import { Request, Response } from "express";
import prisma from "../config/prismaClient";
import { getUserGoogleData } from "../utils/googleAuthUtils";
import { generateAccessToken, generateRefreshToken } from "../utils/tokenUtils";
import { User } from "@prisma/client";
import { OAuth2Client } from "google-auth-library";
import "dotenv/config";
import bcrypt from "bcrypt";
import { v4 } from "uuid";
import {
  generateOtp,
  getOtpExpiration,
  sendOtpMessage,
} from "../utils/otpUtils";
import { sendEmail } from "../utils/emailServiceSand";
import getAccessTokenFromRefreshToken from "../utils/getAccessTokenFromRefreshToken";
import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

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

const passwordSchema = z
  .string()
  .min(8, "password must be at least 8 characters")
  .regex(/[A-Z]/, "password must contain at least one uppercase letter")
  .regex(/[a-z]/, "password must contain at least one lowercase letter")
  .regex(/\d/, "password must contain at least one number")
  .regex(/[@$!%*?&]/, "password must contain at least one special character");

const registerSchema = z.object({
  firstName: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Za-z\s]+$/, "invalid name format"),
  lastName: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Za-z\s]+$/, "invalid name format"),
  email: z.string().email("invalid email format"),
  password: passwordSchema,
});

export const sendPhoneOTP = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;
    const email = (req as any).user.email;

    if (!email || !phoneNumber) {
      res.status(400).json({ message: "Email and phone number are required" });
      return;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      res.status(400).json({
        message:
          "Invalid phone number format. Please use international format, e.g., +1234567890.",
      });
      return;
    }

    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const otp = generateOtp();
    const expiredAt = getOtpExpiration();

    await prisma.user.update({
      where: { email },
      data: {
        phoneNumber,
        phoneOtpToken: otp,
        expiredPhoneOtpToken: expiredAt,
      },
    });

    const message = await sendOtpMessage(phoneNumber, otp);

    res.json({
      message: "OTP sent successfully",
      expiresAt: expiredAt,
      sid: message.sid,
    });
  } catch (err) {
    const error = err as Error;
    res
      .status(500)
      .json({ message: "Failed to send OTP", error: error.message });
  }
};

export const verifyPhoneOTP = async (req: Request, res: Response) => {
  try {
    const { phoneNumber, otp } = req.body;

    const user = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (
      user.phoneOtpToken !== otp ||
      !user.expiredPhoneOtpToken ||
      new Date() > user.expiredPhoneOtpToken
    ) {
      res.status(400).json({ message: "Invalid or expired OTP" });
      return;
    }

    await prisma.user.update({
      where: { phoneNumber },
      data: {
        phoneOtpToken: null,
        expiredPhoneOtpToken: null,
        isPhoneVerified: true,
        role: "User",
      },
    });

    res.json({ message: "Phone number verified successfully" });
  } catch (err) {
    const error = err as Error;
    res
      .status(500)
      .json({ message: "Failed to verify OTP", error: error.message });
  }
};

export async function verifyEmail(req: Request, res: Response) {
  const { token } = req.query;

  try {
    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token as string },
    });

    if (!user) {
      res.status(404).json({ message: "Invalid verification token" });
      return;
    }

    if (user.isEmailVerified) {
      res.status(400).json({ message: "Email already verified" });
      return;
    }

    if (user.provider !== "Local") {
      res.status(403).json({
        message: "Email verification is not allowed for social login accounts",
      });
      return;
    }

    if (
      user.emailVerificationTokenExpiry &&
      user.emailVerificationTokenExpiry < new Date()
    ) {
      res.status(403).json({ message: "Verification link has expired" });
      return;
    }

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiry: null,
        refreshToken,
      },
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });

    res.redirect(
      `${clientUrl}/success?status=verify_email&access_token=${accessToken}`
    );
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
        message: "Email verification is not allowed for social login accounts",
      });
      return;
    }

    if (user.isEmailVerified) {
      res.status(400).json({ message: "Email is already verified" });
      return;
    }

    const emailVerificationToken = v4();
    const emailVerificationTokenExpiry = new Date(Date.now() + 1000 * 60 * 30); // Expiry in 30 minutes
    await prisma.user.update({
      where: { email },
      data: { emailVerificationToken, emailVerificationTokenExpiry },
    });

    const verificationLink = `${serverUrl}/api/auth/verify-email?token=${emailVerificationToken}`;

    await sendEmail(
      email,
      "Resend Email Verification",
      `<p>Please click the following link to verify your email: ${verificationLink}</p>`
    );

    res.json({ message: "Verification email resent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to resend verification email" });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const parsedBody = registerSchema.safeParse(req.body);
    if (!parsedBody.success) {
      const errorMessage = parsedBody.error.issues[0].message;
      res.status(400).json({ message: `${errorMessage}` });
      return;
    }

    const { firstName, lastName, email, password } = parsedBody.data;
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      let message: string;

      if (!existingUser.isEmailVerified) {
        message = "Email is already registered but not verified";
        res.status(400).json({ message });
        return;
      }

      if (!existingUser.isPhoneVerified) {
        message = "Phone number is not verified";
        res.status(400).json({ message });
        return;
      }

      message = "Email already in use";
      res.status(400).json({ message });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const emailVerificationToken = v4();
    const emailVerificationTokenExpiry = new Date(Date.now() + 1000 * 60 * 30);

    await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        emailVerificationToken,
        emailVerificationTokenExpiry,
      },
    });

    const verificationLink = `${serverUrl}/api/auth/verify-email?token=${emailVerificationToken}`;
    await sendEmail(
      email,
      "Email Verification",
      `<p>Please click the following link to verify your email: <a href="${verificationLink}">${verificationLink}</a></p>`
    );

    res.status(201).json({
      message:
        "Registration successful. Please check your email for the verification link.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error.",
      error: (error as Error).message,
    });
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

    if (existingUser.role === "Admin") {
      const accessToken = generateAccessToken({
        id: existingUser.id,
        email: existingUser.email,
      });

      const refreshToken = generateRefreshToken({
        id: existingUser.id,
        email: existingUser.email,
      });

      await prisma.user.update({
        where: { id: existingUser.id },
        data: { refreshToken },
      });

      res.json({
        message: "Admin login successfully",
        refreshToken,
        accessToken,
      });
      return;
    }

    if (!existingUser.isEmailVerified) {
      res.status(403).json({ message: "Email user is not verified" });
      return;
    }

    if (!existingUser.isPhoneVerified) {
      res.status(403).json({ message: "Phone number is not verified" });
      return;
    }

    if (existingUser.password === null) {
      res.status(400).json({
        message:
          "This account was registered using social login. Please log in with your social account.",
      });
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
    });

    const refreshToken = generateRefreshToken({
      id: existingUser.id,
      email: existingUser.email,
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
      message: "No refresh k found, please log in first.",
    });
    return;
  }

  res.clearCookie("refreshToken");

  res.json({ message: "Logout successful" });
}

export async function googleCallback(req: Request, res: Response) {
  const code = req.query.code as string;

  if (!code) {
    return res.redirect(`${clientUrl}/failed?status=login&error=missing_code`);
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

    let existingUser = await prisma.user.findUnique({
      where: { email: userProfil.email },
    });

    if (existingUser) {
      if (existingUser.provider !== "Google") {
        return res.redirect(
          `${clientUrl}/failed?status=login&error=account_exists_manual`
        );
      }
    } else {
      existingUser = await prisma.user.create({
        data: {
          email: userProfil.email,
          avatar: userProfil.picture,
          firstName: userProfil.given_name,
          lastName: userProfil.family_name,
          provider: "Google",
          isEmailVerified: true,
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
    });

    const refreshToken = generateRefreshToken({
      id: existingUser.id,
      email: existingUser.email,
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

    return res.redirect(
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
    state: "login",
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

    if (!user.isEmailVerified) {
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

    await sendEmail(
      email,
      "Email Verification Code",
      `<p>Click the link to reset your password: <strong>${resetLink}</strong></p>`
    );

    res.json({
      message: "Password reset link sent. Please check your email.",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getResetPasswordPage(req: Request, res: Response) {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.redirect(
        `${clientUrl}/failed?status=reset&error=missing_token`
      );
    }

    const user = await prisma.user.findFirst({
      where: { resetToken: token },
    });

    if (!user || !user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
      return res.redirect(
        `${clientUrl}/failed?status=reset&error=invalid_or_expired_token`
      );
    }

    return res.redirect(`${clientUrl}/success?status=reset&token=${token}`);
  } catch (error: any) {
    return res.redirect(
      `${clientUrl}/failed?status=reset&error=${encodeURIComponent(
        error.message
      )}`
    );
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;

    const passwordValidation = passwordSchema.safeParse(newPassword);
    if (!passwordValidation.success) {
      res.status(400).json({
        message: passwordValidation.error.errors
          .map((err) => err.message)
          .join(", "),
      });
      return;
    }

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
  try {
    const { refreshToken } = req.body;

    const result = await getAccessTokenFromRefreshToken(refreshToken);

    if (!result) {
      res.status(403).json({ message: "Invalid or expired refresh k" });
      return;
    }

    res.json({ accessToken: result.accessToken });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getUser(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        role: true,
        createdAt: true,
      },
    });

    if (!userData) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}
