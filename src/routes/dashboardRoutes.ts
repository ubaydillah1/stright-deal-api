import express, { Request, Response } from "express";
import prisma from "../config/prismaClient";

const router = express.Router();

router.get("/cars", async (req: Request, res: Response) => {
  try {
    const cars = await prisma.car.findMany();
    res.json({
      message: "success",
      data: cars,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching cars", error });
  }
});

router.patch("/cars/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { statusReview } = req.body;

    const validStatuses = [
      "NeedToReview",
      "InReview",
      "Reviewed",
      "Published",
      "Rejected",
    ];
    if (!statusReview || !validStatuses.includes(statusReview)) {
      res.status(400).json({
        message:
          "Invalid statusReview. Allowed values: " + validStatuses.join(", "),
      });
      return;
    }

    const updatedCar = await prisma.car.update({
      where: { id },
      data: { statusReview },
    });

    res.json({
      message: "Status updated successfully",
      data: updatedCar,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating statusReview", error });
  }
});

export default router;
