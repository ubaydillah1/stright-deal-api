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
import { sendEmail } from "../utils/emailServiceSand";

export async function getAllCars(req: Request, res: Response) {
  try {
    const cars = await prisma.car.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        User: true,
        CarImages: true,
      },
    });

    const unseenCount = await prisma.car.count({
      where: { seen: false },
    });

    await prisma.car.updateMany({
      where: { seen: false },
      data: { seen: true },
    });

    res.json({
      message: "success",
      data: cars,
      unseenCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching cars", error });
  }
}

export async function getCar(req: Request, res: Response) {
  try {
    const cars = await prisma.car.findUnique({
      where: { id: req.params.id },
      include: {
        User: true,
        CarImages: true,
      },
    });
    res.json({ message: "success", data: cars });
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

    await prisma.activityLog.create({
      data: {
        carId,
        actionType: "ReviewedSubmission",
      },
    });

    res.json({
      message: "Status updated successfully",
      data: updatedCar,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating statusReview", error });
  }
}

export async function addNotes(req: Request, res: Response) {
  try {
    const { notes, carId } = req.body;

    const updatedCar = await prisma.car.update({
      where: { id: carId },
      data: { notes },
      include: {
        User: true,
      },
    });

    await sendEmail(
      updatedCar.User.email,
      "Your Car Listing Has Been Rejected - Stright Deal",
      `<p>Dear ${updatedCar.User.firstName} ${updatedCar.User.lastName},</p>
      <p>We regret to inform you that your car listing with ID <strong>${carId}</strong> has been rejected.</p>
      <p><strong>Reason for Rejection:</strong></p>
      <blockquote style="background: #f8f8f8; padding: 10px; border-left: 3px solid red;">
        ${notes}
      </blockquote>
      <p>Please review the provided information and make the necessary corrections before resubmitting.</p>
      <p>Thank you for using <strong>Stright Deal</strong>.</p>
      <p>Best regards,</p>
      <p>The Stright Deal Team</p>`
    );

    res.json({
      message: "Notes added successfully",
      data: updatedCar,
    });
  } catch (error) {
    res.status(500).json({ message: "Error adding notes", error });
  }
}

export async function getAllActivityLogs(req: Request, res: Response) {
  try {
    const activity = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        Car: true,
      },
    });
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

export const getSubmissions = async (req: Request, res: Response) => {
  try {
    const submissions = await prisma.car.findMany({
      select: {
        createdAt: true,
      },
    });

    const monthlyCounts = submissions.reduce((acc, submission) => {
      const month = submission.createdAt.toLocaleString("en-US", {
        month: "short",
      });

      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const result = Object.entries(monthlyCounts).map(([month, count]) => ({
      month,
      count,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getApprovalStats = async (req: Request, res: Response) => {
  try {
    const totalVehicles = await prisma.car.count();

    const approvedCount = await prisma.car.count({
      where: { statusReview: "Published" },
    });

    const rejectedCount = await prisma.car.count({
      where: { statusReview: "Rejected" },
    });

    const approvalPercentage = totalVehicles
      ? Math.round((approvedCount / totalVehicles) * 100)
      : 0;

    res.json({
      total: totalVehicles,
      approvalPercentage: `${approvalPercentage}`,
      approved: approvedCount,
      rejected: rejectedCount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching approval stats",
      error: (error as Error).message,
    });
  }
};

export const searchCars = async (req: Request, res: Response) => {
  const query = req.query.s as string;

  try {
    const cars = await prisma.car.findMany({
      where: {
        OR: [
          { vin: { contains: query, mode: "insensitive" } },
          { User: { firstName: { contains: query, mode: "insensitive" } } },
          { User: { lastName: { contains: query, mode: "insensitive" } } },
        ],
      },
      include: {
        User: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json(cars);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
