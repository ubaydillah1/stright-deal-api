import express from "express";
import * as DashboardController from "../controllers/AdminDashboardController";
import { validateRequest } from "../middlewares/validateRequest";

const router = express.Router();

// Car Feature
router.get("/cars", DashboardController.getAllCars);
router.get("/car/:id", DashboardController.getCar);
router.get("/cars/this-week", DashboardController.getCarsByWeekHandler);
router.get("/cars/this-month", DashboardController.getCarsByMonthHandler);

//  Grafik
router.get("/submissions", DashboardController.getSubmissions);
router.get("/approvalStats", DashboardController.getApprovalStats);

// Update Status
router.patch(
  "/car/status",
  validateRequest(["statusReview", "carId"]),
  DashboardController.changeStatus
);

router.patch(
  "/cars/notes",
  validateRequest(["notes", "carId"]),
  DashboardController.addNotes
);

// Log Feature
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
