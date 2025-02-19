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
import { google } from "googleapis";

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

export const getPhoneOTP = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    if (!isValidPhoneNumber(phoneNumber)) {
      res.status(400).json({
        message:
          "Invalid phone number format. Please use international format, e.g., +1234567890.",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const otp = generateOtp();
    const expiredAt = getOtpExpiration();

    await prisma.user.update({
      where: { phoneNumber },
      data: {
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
  const { email, otp } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(404).json({ message: "Email not found" });
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

    if (user.emailOtpToken !== otp) {
      res.status(400).json({ message: "Invalid OTP" });
      return;
    }

    if (user.expiredEmailOtpToken && user.expiredEmailOtpToken < new Date()) {
      res.status(403).json({ message: "OTP has expired" });
      return;
    }

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    await prisma.user.update({
      where: { email },
      data: {
        isEmailVerified: true,
        emailOtpToken: null,
        expiredEmailOtpToken: null,
        refreshToken,
      },
    });

    res.json({
      message: "Email verified successfully",
      accessToken,
      refreshToken,
    });
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
  try {
    const parsedBody = registerSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res
        .status(400)
        .json({ message: "Invalid input", errors: parsedBody.error.format() });
      return;
    }

    const { firstName, lastName, email, password } = parsedBody.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      if (existingUser.isEmailVerified) {
        res.status(400).json({ message: "email is already in use" });
        return;
      }

      res
        .status(400)
        .json({ message: "email is already registered but not verified" });
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

    res.status(201).json({
      message: "Registration successful. Please check your email for the OTP.",
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

    if (!existingUser.isEmailVerified) {
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
  const state = req.query.state as string;

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
    const refresh_token = tokens.refresh_token;

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
          isEmailVerified: true,
        },
      });
    }

    if (!existingUser || !existingUser.id) {
      return res.redirect(
        `${clientUrl}/failed?status=login&error=missing_user_id`
      );
    }

    if (state === "login") {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          googleAccessToken: access_token,
          googleRefreshToken: refresh_token,
          googleLastConnectedAt: new Date(),
        },
      });
    }

    if (state === "calendar") {
      console.log("Masuk calendar callback");
      console.log(access_token, refresh_token);
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          googleAccessToken: access_token,
          googleRefreshToken: refresh_token,
          googleCalendarConnected: true,
          googleLastConnectedAt: new Date(),
        },
      });

      return res.redirect(
        `${clientUrl}/success?status=calendar&message=calendar_connected`
      );
    } else {
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

      return res.redirect(
        `${clientUrl}/success?status=login&access_token=${accessToken}`
      );
    }
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

export async function requestAdditionalScopesForGoogleCalendar(
  req: Request,
  res: Response
) {
  const userId = (req as any).user?.id;
  if (!userId) {
    res.status(401).json({ error: "User not authenticated" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.googleRefreshToken) {
    res.status(401).json({
      error: "User not logged in or no Google refresh token available",
    });
    return;
  }

  const redirectUrl = `${serverUrl}/api/auth/google/callback`;

  const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUrl
  );

  oAuth2Client.setCredentials({ refresh_token: user.googleRefreshToken });

  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.events.owned",
    ],
    include_granted_scopes: true,
    login_hint: user.email,
    state: "calendar",
  });

  res.json({ url: authorizeUrl });
}

export async function createGoogleCalendarEvent(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  if (!userId) {
    res.status(401).json({ error: "User not authenticated" });
    return;
  }

  const { title, description, startDate, endDate } = req.body;

  if (!title || !description || !startDate || !endDate) {
    res.status(400).json({
      error: "Title, description, startDate, and endDate are required",
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.googleAccessToken || !user.googleRefreshToken) {
    res.status(401).json({ error: "No Google credentials found" });
    return;
  }

  const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oAuth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
  });

  try {
    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    const event = {
      summary: title,
      description: description,
      start: {
        dateTime: startDate,
        timeZone: "Asia/Jakarta",
      },
      end: {
        dateTime: endDate,
        timeZone: "Asia/Jakarta",
      },
      conferenceData: {
        createRequest: {
          requestId: "sample123",
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
      attendees: [],
    };

    const createdEvent = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
      conferenceDataVersion: 1,
    });

    res.status(200).json({ event: createdEvent.data });
  } catch (error) {
    res.status(500).json({ error: "Failed to create event" });
  }
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

    if (!token) {
      res.status(400).json({ message: "Invalid token" });
      return;
    }

    const user = await prisma.user.findFirst({
      where: { resetToken: token as string },
    });

    if (!user || !user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
      res.status(400).json({ message: "Invalid or expired token." });
      return;
    }

    res.json({ message: "Token is valid. Proceed to reset password." });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
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
      res.status(403).json({ message: "Invalid or expired refresh token" });
      return;
    }

    res.json({ accessToken: result.accessToken });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}
