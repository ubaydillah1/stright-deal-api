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

export async function verifyEmail(req: Request, res: Response) {
  const { token } = req.query;

  if (!token) {
    res.status(400).json({
      message: "Invalid token",
    });
    return;
  }

  const user = await prisma.user.findFirst({
    where: { verificationToken: token as string },
  });

  if (!user) {
    res.status(400).json({
      message: "Invalid or expired token",
    });
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verificationToken: null,
    },
  });

  res.json({
    message: "Email verified successfully!",
  });
}

export async function register(req: Request, res: Response) {
  const { firstName, lastName, email, password } = req.body;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    res.status(400).json({
      message: "Email is already in use",
    });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const verificationToken = v4();

  await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      password: hashedPassword,
      verificationToken,
    },
  });

  const verificationUrl = `${serverUrl}/api/auth/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: "Email Verification",
    text: `Please verify your email by clicking the following link: ${verificationUrl}`,
  };

  try {
    await emailService.sendMail(mailOptions);
    res.json({
      message:
        "Registration successful. Please check your email for verification.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error sending verification email.",
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

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
    });

    console.log("Cookie terkirim");

    res.json({ accessToken });
  } catch (error) {
    console.error(error);
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
    res.redirect(`${clientUrl}/failed-login?error=missing_code`);
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
      return res.redirect(`${clientUrl}/failed-login?error=missing_token`);
    }

    const userProfil: UserGoogleProfile = await getUserGoogleData(access_token);

    if (!userProfil || !userProfil.email) {
      return res.redirect(`${clientUrl}/failed-login?error=missing_email`);
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
          password: "",
          expiredOtpToken: new Date(),
          otpToken: "",
          phoneNumber: "",
          refreshToken: "",
          provider: "Google",
        },
      });
    }

    if (!existingUser || !existingUser.id) {
      return res.redirect(`${clientUrl}/failed-login?error=missing_user_id`);
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
    });

    console.log("Berhasil Callback dan set cookie");

    res.redirect(`${clientUrl}/success-login?access_token=${accessToken}`);
  } catch (error: any) {
    return res.redirect(
      `${clientUrl}/failed-login?error=${encodeURIComponent(error.message)}`
    );
  }
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
