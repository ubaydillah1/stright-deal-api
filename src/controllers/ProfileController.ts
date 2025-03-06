import { PrismaClient } from "@prisma/client";
import { Response } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { supabase } from "../config/supabaseClient";
import { AuthenticatedRequest } from "../middlewares/authorize";
import { FilesRequest } from "./UserCarController";
const prisma = new PrismaClient();

export const changeName = async (req: AuthenticatedRequest, res: Response) => {
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

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response
) => {
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

export const changeAvatar = async (req: FilesRequest, res: Response) => {
  const userId = req.user?.id;
  const file = req.files?.avatar;

  if (!userId || !file) {
    res.status(400).json({ message: "User ID and avatar file are required" });
    return;
  }

  if (Array.isArray(file)) {
    res.status(400).json({ message: "Only one avatar file is allowed" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (user.avatar) {
      let fileName = user.avatar.split("/").pop();
      if (fileName) {
        fileName = decodeURIComponent(fileName);
        const { error } = await supabase.storage
          .from("avatars")
          .remove([fileName]);
        if (error) {
          throw new Error(`Failed to delete old avatar: ${error.message}`);
        }
      }
    }

    const fileName = `${userId}_${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file.data, {
        contentType: file.mimetype,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(fileName);

    await prisma.user.update({
      where: { id: userId },
      data: { avatar: publicUrl },
    });

    res.status(200).json({
      message: "Avatar updated successfully",
      avatar: publicUrl,
    });
  } catch (error) {
    const e = error as Error;
    res
      .status(500)
      .json({ message: "Error updating avatar", error: e.message });
  }
};

export const deleteAvatar = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(400).json({ message: "User ID is required" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (!user.avatar) {
      res.status(400).json({ message: "No avatar to delete" });
      return;
    }

    let fileName = user.avatar.split("/").pop();
    if (fileName) {
      fileName = decodeURIComponent(fileName);
      const { error } = await supabase.storage
        .from("avatars")
        .remove([fileName]);
      if (error) {
        throw new Error(`Failed to delete avatar: ${error.message}`);
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
    });

    res.status(200).json({ message: "Avatar deleted successfully" });
  } catch (error) {
    const e = error as Error;
    res
      .status(500)
      .json({ message: "Error deleting avatar", error: e.message });
  }
};
