import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Role } from "@prisma/client";

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET!;

interface DecodedUser extends JwtPayload {
  id: string;
  email: string;
  role: Role;
}

interface AuthenticatedRequest extends Request {
  user?: DecodedUser;
}

// Middleware utama untuk autentikasi dan otorisasi
export function authorize(allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "Unauthorized: No token provided" });
      return;
    }

    try {
      const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as DecodedUser;
      req.user = decoded;

      if (!allowedRoles.includes(decoded.role)) {
        res.status(403).json({ message: "Forbidden: Access denied" });
      }

      next();
    } catch (error) {
      res.status(403).json({ message: "Forbidden: Invalid token" });
    }
  };
}
