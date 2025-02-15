import { Request, Response } from "express";
import prisma from "../config/prismaClient";
import { getUserGoogleData } from "../utils/googleAuthUtils";
import { generateAccessToken, generateRefreshToken } from "../utils/tokenUtils";
import { User } from "@prisma/client";
import { OAuth2Client } from "google-auth-library";
import "dotenv/config";
import bcrypt from "bcrypt";
import { v4 } from "uuid";
import emailService from "../utils/emailService";
import {
  generateOtp,
  getOtpExpiration,
  sendOtpMessage,
} from "../utils/otpUtils";
import { sendEmail } from "../utils/emailServiceSand";
import getAccessTokenFromRefreshToken from "../utils/getAccessTokenFromRefreshToken";

const serverUrl = process.env.SERVER_URL;
const clientUrl = process.env.CLIENT_URL;

interface UserGoogleProfile {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
}

export const getOtp = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    const user = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    // if (!user) {
    //   res.status(404).json({ message: "User not found" });
    //   return;
    // }

    const otp = generateOtp();
    const expiredAt = getOtpExpiration();

    // await prisma.user.update({
    //   where: { phoneNumber },
    //   data: {
    //     phoneOtpToken: otp,
    //     expiredPhoneOtpToken: expiredAt,
    //   },
    // });

    // Kirim OTP lewat Twilio (menggunakan utils)
    const message = await sendOtpMessage(phoneNumber, otp);
    console.log("SID : " + message.sid);

    res.json({ message: "OTP sent successfully", expiresAt: expiredAt });
  } catch (err) {
    const error = err as Error;
    res
      .status(500)
      .json({ message: "Failed to send OTP", error: error.message });
  }
};

export async function verifyEmail(req: Request, res: Response) {
  const { email, otp } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(404).json({ message: "Email not found" });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ message: "Email already verified" });
      return;
    }

    if (user.provider !== "Local") {
      res.status(403).json({
        message: "You cannot reset the password for a social login account",
      });
      return;
    }

    if (user.emailOtpToken !== otp) {
      res.status(400).json({ message: "Invalid OTP" });
      return;
    }

    if (user.expiredEmailOtpToken && user.expiredEmailOtpToken < new Date()) {
      res.status(400).json({ message: "OTP has expired" });
      return;
    }

    await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        emailOtpToken: null,
        expiredEmailOtpToken: null,
      },
    });

    res.json({ message: "Email verified successfully" });
  } catch (error: unknown) {
    const e = error as Error;
    res.status(500).json({
      message: e.message,
    });
  }
}

export async function resendVerificationEmail(req: Request, res: Response) {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(404).json({ message: "Email not found" });
      return;
    }

    if (user.provider !== "Local") {
      res.status(403).json({
        message: "You cannot reset the password for a social login account",
      });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ message: "Email is already verified" });
      return;
    }

    const emailOtpToken = generateOtp();
    const expiredEmailOtpToken = getOtpExpiration();

    await prisma.user.update({
      where: { email },
      data: { emailOtpToken, expiredEmailOtpToken },
    });

    await sendEmail(
      email,
      "Resend Email Verification",
      `<p>Your OTP code is <strong>${emailOtpToken}</strong>. This code is valid for 10 minutes.</p>`
    );

    res.json({ message: "Verification email resent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to resend verification email" });
  }
}

export async function register(req: Request, res: Response) {
  const { firstName, lastName, email, password } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.isVerified) {
        res.status(400).json({ message: "Email is already in use" });
        return;
      }
      res
        .status(400)
        .json({ message: "Email is already registered but not verified" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOtp();
    const otpExpiry = getOtpExpiration();

    const newUser = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        emailOtpToken: otp,
        expiredEmailOtpToken: otpExpiry,
      },
    });

    await sendEmail(
      email,
      "Email Verification Code",
      `<p>Your OTP code for verification is: <strong>${otp}</strong></p>`
    );

    const accessToken = generateAccessToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    const refreshToken = generateRefreshToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    await prisma.user.update({
      where: { id: newUser.id },
      data: { refreshToken },
    });

    res.json({
      message: "Registration successful. Please check your email for the OTP.",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  try {
    const existingUser: User | null = await prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (!existingUser.isVerified) {
      res.status(403).json({ message: "User not verified" });
      return;
    }

    if (existingUser.password === null) {
      res.status(400).json({ message: "Password not set for this user" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid password" });
      return;
    }

    const accessToken = generateAccessToken({
      id: existingUser.id,
      email: existingUser.email,
      role: existingUser.role,
    });

    const refreshToken = generateRefreshToken({
      id: existingUser.id,
      email: existingUser.email,
      role: existingUser.role,
    });

    await prisma.user.update({
      where: { id: existingUser.id },
      data: { refreshToken },
    });

    res.json({ accessToken, refreshToken });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function logout(req: Request, res: Response) {
  if (!req.cookies.refreshToken) {
    res.status(401).json({
      message: "No refresh token found, please log in first.",
    });
    return;
  }

  res.clearCookie("refreshToken");

  res.json({ message: "Logout successful" });
}

// Google Controller
export async function googleCallback(req: Request, res: Response) {
  const code = req.query.code as string;

  if (!code) {
    res.redirect(`${clientUrl}/failed?status=login&error=missing_code`);
    return;
  }

  try {
    const redirectUrl = `${serverUrl}/api/auth/google/callback`;

    const oAuth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUrl
    );

    const { tokens } = await oAuth2Client.getToken(code);

    oAuth2Client.setCredentials(tokens);
    const access_token = tokens.access_token;

    if (!access_token) {
      return res.redirect(
        `${clientUrl}/failed?status=login&error=missing_token`
      );
    }

    const userProfil: UserGoogleProfile = await getUserGoogleData(access_token);

    if (!userProfil || !userProfil.email) {
      return res.redirect(
        `${clientUrl}/failed?status=login&error=missing_email`
      );
    }

    let existingUser: User | null = await prisma.user.findUnique({
      where: { email: userProfil.email },
    });

    if (!existingUser) {
      existingUser = await prisma.user.create({
        data: {
          email: userProfil.email,
          avatar: userProfil.picture,
          firstName: userProfil.given_name,
          lastName: userProfil.family_name,
          provider: "Google",
          isVerified: true,
        },
      });
    }

    if (!existingUser || !existingUser.id) {
      return res.redirect(
        `${clientUrl}/failed?status=login&error=missing_user_id`
      );
    }

    const accessToken = generateAccessToken({
      id: existingUser.id,
      email: existingUser.email,
      role: existingUser.role,
    });

    const refreshToken = generateRefreshToken({
      id: existingUser.id,
      email: existingUser.email,
      role: existingUser.role,
    });

    await prisma.user.update({
      where: { id: existingUser.id },
      data: { refreshToken },
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });

    res.redirect(
      `${clientUrl}/success?status=login&access_token=${accessToken}`
    );
  } catch (error: any) {
    return res.redirect(
      `${clientUrl}/failed?status=login&error=${error.message}`
    );
  }
}

export async function getTokenCookies(req: Request, res: Response) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    res.status(401).json({ error: "No refresh token found" });
    return;
  }

  res.json({ refreshToken });
}

export async function googleAuth(req: Request, res: Response) {
  const redirectUrl = `${serverUrl}/api/auth/google/callback`;

  const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUrl
  );

  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    prompt: "consent",
  });

  res.json({ url: authorizeUrl });
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({ message: "User not verified" });
      return;
    }

    if (user.provider !== "Local") {
      res.status(403).json({
        message: "You cannot reset the password for a social login account",
      });
      return;
    }

    const resetToken = v4();
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 30); // Expiry in 30 minutes

    await prisma.user.update({
      where: { email },
      data: { resetToken, resetTokenExpiry },
    });

    const resetLink = `${serverUrl}/api/auth/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: "Password Reset",
      text: `Click the link to reset your password: ${resetLink}`,
    };

    await emailService.sendMail(mailOptions);

    res.json({
      message: "Password reset link sent. Please check your email.",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getResetPasswordPage(req: Request, res: Response) {
  const { token } = req.query;

  if (!token) {
    res.status(400).json({
      message: "Invalid token",
    });
    return;
  }

  const user = await prisma.user.findFirst({
    where: { resetToken: token as string },
  });

  if (!user) {
    res.status(400).json({ message: "Invalid or expired token." });
    return;
  }

  res.json({ message: "Token is valid. Proceed to reset password." });
}

export async function resetPassword(req: Request, res: Response) {
  const { token, newPassword } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gte: new Date() } },
    });

    if (!user) {
      res.status(400).json({ message: "Invalid or expired token" });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.json({ message: "Password has been reset successfully." });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function refreshTokenHandler(req: Request, res: Response) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ message: "Refresh token is required" });
    return;
  }

  const result = await getAccessTokenFromRefreshToken(refreshToken);

  if (!result) {
    res.status(403).json({ message: "Invalid or expired refresh token" });
    return;
  }

  res.json({ accessToken: result.accessToken });
}
