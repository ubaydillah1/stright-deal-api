import jwt from "jsonwebtoken";
import "dotenv/config";

export type User = {
  id: string;
  email: string;
};

export function generateAccessToken(user: User): string {
  return jwt.sign(user, process.env.JWT_ACCESS_TOKEN_SECRET!, {
    expiresIn: "10s",
  });
}

export function generateRefreshToken(user: User): string {
  return jwt.sign(user, process.env.JWT_REFRESH_TOKEN_SECRET!, {
    expiresIn: "7d",
  });
}
