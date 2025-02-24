import express from "express";
import * as DashboardController from "../controllers/DashboardController";

const router = express.Router();

// Car Feature
router.get("/cars", DashboardController.getAllCars);
router.get("/cars/this-week", DashboardController.getCarsByWeekHandler);
router.get("/cars/this-month", DashboardController.getCarsByMonthHandler);

// Update Status
router.patch("/cars/status", DashboardController.changeStatus);

// Log Feature
router.post("/activity-log", DashboardController.createActivityLog);
router.get("/activity-logs", DashboardController.getAllActivityLogs);
router.get(
  "/activity-logs/this-week",
  DashboardController.getActivityLogsByWeekHandler
);
router.get(
  "/activity-logs/this-month",
  DashboardController.getActivityLogsByMonthHandler
);

export default router;
