import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET!;

interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string };
}

export function authorize(allowedRoles: Role[]) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(" ")[1];

      if (!token) {
        res.status(401).json({ message: "Unauthorized: No token provided" });
        return;
      }

      const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as {
        id: string;
        email: string;
      };

      req.user = decoded;

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { role: true },
      });

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      if (!allowedRoles.includes(user.role)) {
        res.status(403).json({ message: "Forbidden: Access denied" });
        return;
      }

      next();
    } catch (error) {
      res
        .status(403)
        .json({ message: "Forbidden: Invalid token or authentication error" });
    }
  };
}
