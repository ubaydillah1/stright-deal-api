import { Request, Response } from "express";
import {
  getCarsByMonthQuery,
  getCarsByWeekQuery,
} from "../utils/filterCarByTimeline";
import prisma from "../config/prismaClient";
import {
  getActivityLogsByMonthQuery,
  getActivityLogsByWeekQuery,
} from "../utils/filterActivityLogsByQuery";

export async function getAllCars(req: Request, res: Response) {
  try {
    const cars = await prisma.car.findMany();
    res.json({
      message: "success",
      data: cars,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching cars", error });
  }
}

export async function getCarsByMonthHandler(req: Request, res: Response) {
  try {
    const cars = await getCarsByMonthQuery();
    res.json({ message: "success", data: cars });
  } catch (error) {
    res.status(500).json({ message: "Error fetching cars", error });
  }
}

export async function getCarsByWeekHandler(req: Request, res: Response) {
  try {
    const cars = await getCarsByWeekQuery();
    res.json({ message: "success", data: cars });
  } catch (error) {
    res.status(500).json({ message: "Error fetching cars", error });
  }
}

export async function changeStatus(req: Request, res: Response) {
  try {
    const { statusReview, carId } = req.body;

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
      where: { id: carId },
      data: { statusReview },
    });

    console.log(updatedCar);

    res.json({
      message: "Status updated successfully",
      data: updatedCar,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating statusReview", error });
  }
}

export async function getAllActivityLogs(req: Request, res: Response) {
  try {
    const activity = await prisma.activityLog.findMany();
    res.json({
      message: "success",
      data: activity,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching cars", error });
  }
}

export async function getActivityLogsByWeekHandler(
  req: Request,
  res: Response
) {
  try {
    const activityLogs = await getActivityLogsByWeekQuery();
    res.json({ message: "success", data: activityLogs });
  } catch (error) {
    res.status(500).json({ message: "Error fetching activity logs", error });
  }
}

export async function getActivityLogsByMonthHandler(
  req: Request,
  res: Response
) {
  try {
    const activityLogs = await getActivityLogsByMonthQuery();
    res.json({ message: "success", data: activityLogs });
  } catch (error) {
    res.status(500).json({ message: "Error fetching activity logs", error });
  }
}
