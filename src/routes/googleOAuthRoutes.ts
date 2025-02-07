import express, { NextFunction, Request, Response } from "express";
import "dotenv/config";
import { OAuth2Client } from "google-auth-library";

const router = express.Router();

const clientUrl = process.env.CLIENT_URL;

async function getUserData(accessToken: string): Promise<any> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`
    );

    const data = await response.json();

    return data;
  } catch (error: unknown) {
    const e = error as Error;
    console.log(e.message);
  }
}

router.get(
  "/",
  async function (req: Request, res: Response, next: NextFunction) {
    const code = req.query.code as string;

    try {
      const redirectUrl = `${clientUrl}/oauth`;
      const oAuth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUrl
      );

      const { tokens } = await oAuth2Client.getToken(code);

      await oAuth2Client.setCredentials(tokens);

      const user = oAuth2Client.credentials;
    } catch (error: unknown) {
      const e = error as Error;
      res.status(500).json({ error: e.message });
    }
  }
);

router.post("/", async function (req: Request, res: Response) {
  const redirectUrl = `${clientUrl}/oauth`;

  const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUrl
  );

  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: "https://www.googleapis.com/auth/userinfo.profile openid",
    prompt: "consent",
  });

  res.json({ url: authorizeUrl });
});

export default router;
