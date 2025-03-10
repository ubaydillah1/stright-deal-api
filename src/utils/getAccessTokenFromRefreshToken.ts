import jwt, { JwtPayload } from "jsonwebtoken";
import prisma from "../config/prismaClient";
import { Role } from "@prisma/client";

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET;

interface decoded extends JwtPayload {
  id: string;
  email: string;
  role: Role;
}

async function getAccessTokenFromRefreshToken(refreshToken: string) {
  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET!) as decoded;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || user.refreshToken !== refreshToken) {
      throw new Error("Invalid refresh token");
    }

    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      ACCESS_TOKEN_SECRET!,
      { expiresIn: "1d" }
    );

    return { accessToken };
  } catch (error) {
    return null;
  }
}

export default getAccessTokenFromRefreshToken;
