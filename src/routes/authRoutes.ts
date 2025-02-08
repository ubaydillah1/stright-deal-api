import express, { NextFunction, Request, Response } from "express";
import "dotenv/config";
import { OAuth2Client } from "google-auth-library";
import prisma from "../config/prismaClient";
import jwt from "jsonwebtoken";
import { User } from "@prisma/client";

const router = express.Router();

const serverUrl = process.env.SERVER_URL;
const clientUrl = process.env.CLIENT_URL;

interface UserProfile {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
}

async function getUserData(accessToken: string): Promise<any> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`
    );

    const data = await response.json();

    return data;
  } catch (error: any) {
    const e = error as Error;
    console.log(e.message);
  }
}

function generateAccessToken(user: any): string {
  return jwt.sign(user, process.env.JWT_ACCESS_TOKEN_SECRET!, {
    expiresIn: "15m",
  });
}

function generateRefreshToken(user: any): string {
  return jwt.sign(user, process.env.JWT_REFRESH_TOKEN_SECRET!, {
    expiresIn: "7d",
  });
}

router.get(
  "/google/callback",
  async function (req: Request, res: Response, next: NextFunction) {
    const code = req.query.code as string;

    if (!code) {
      return res.redirect(`${clientUrl}/failed-login?error=missing_code`);
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

      const userProfil: UserProfile = await getUserData(access_token);

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
        data: { refreshToken: refreshToken },
      });

      res.redirect(`${clientUrl}/success-login?access_token=${accessToken}`);
    } catch (error: any) {
      return res.redirect(
        `${clientUrl}/failed-login?error=${encodeURIComponent(error.message)}`
      );
    }
  }
);

router.post("/google", async function (req: Request, res: Response) {
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
});

export default router;
