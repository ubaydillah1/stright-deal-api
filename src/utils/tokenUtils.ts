import jwt from "jsonwebtoken";
import "dotenv/config";

export function generateAccessToken(user: any): string {
  return jwt.sign(user, process.env.JWT_ACCESS_TOKEN_SECRET!, {
    expiresIn: "7s",
  });
}

export function generateRefreshToken(user: any): string {
  return jwt.sign(user, process.env.JWT_REFRESH_TOKEN_SECRET!, {
    expiresIn: "7d",
  });
}
