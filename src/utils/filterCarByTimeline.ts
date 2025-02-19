import { PrismaClient } from "@prisma/client";
import {
  getStartAndEndOfMonth,
  getStartAndEndOfWeek,
} from "./timePeriodHelper";

const prisma = new PrismaClient();

export const getCarsByWeekQuery = async () => {
  const { startOfWeek, endOfWeek } = getStartAndEndOfWeek();
  return await prisma.car.findMany({
    where: {
      createdAt: {
        gte: startOfWeek,
        lte: endOfWeek,
      },
    },
  });
};

export const getCarsByMonthQuery = async () => {
  const { startOfMonth, endOfMonth } = getStartAndEndOfMonth();
  return await prisma.car.findMany({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });
};
