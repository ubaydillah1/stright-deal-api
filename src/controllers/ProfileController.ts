import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

export const changeName = async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName } = req.body;
    const { id } = req.user || {};

    await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
      },
    });

    res.json({ message: "Name changed successfully" });
  } catch (error) {
    res.status(500).json({
      message: (error as Error).message,
    });
  }
};

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { newPassword } = req.body;
    const { id } = req.user || {};

    const result = passwordSchema.safeParse(newPassword);
    if (!result.success) {
      res.status(400).json({
        message: "Invalid password",
        errors: result.error.format(),
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
