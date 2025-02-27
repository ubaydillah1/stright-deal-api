import { generateAccessToken, generateRefreshToken } from "./tokenUtils";

export default function generateToken(id: string, email: string) {
  const accessToken = generateAccessToken({
    id,
    email,
  });

  const refreshToken = generateRefreshToken({
    id,
    email,
  });
  return { accessToken, refreshToken };
}
