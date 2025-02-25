import prisma from "../config/prismaClient";
import {
  getStartAndEndOfMonth,
  getStartAndEndOfWeek,
} from "./timePeriodHelper";

export const getActivityLogsByWeekQuery = async () => {
  const { startOfWeek, endOfWeek } = getStartAndEndOfWeek();
  return await prisma.activityLog.findMany({
    where: {
      createdAt: {
        gte: startOfWeek,
        lte: endOfWeek,
      },
    },
    include: {
      Car: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getActivityLogsByMonthQuery = async () => {
  const { startOfMonth, endOfMonth } = getStartAndEndOfMonth();
  return await prisma.activityLog.findMany({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    include: {
      Car: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};
