import express from "express";
import * as AdminDashboardController from "../controllers/AdminDashboardController";
import { validateRequest } from "../middlewares/validateRequest";

const router = express.Router();

// Car Feature
router.get("/cars", AdminDashboardController.getAllCars);
router.get("/car/:id", AdminDashboardController.getCar);
router.get("/cars/this-week", AdminDashboardController.getCarsByWeekHandler);
router.get("/cars/this-month", AdminDashboardController.getCarsByMonthHandler);
router.get("/search-cars", AdminDashboardController.searchCars);

//  Grafik
router.get(
  "/grafik-submissions",
  AdminDashboardController.getGrafikSubmissions
);
router.get(
  "/grafik-approval-stats",
  AdminDashboardController.getGrafikApprovalStats
);

// Update Status
router.patch(
  "/car/status",
  validateRequest(["statusReview", "carId"]),
  AdminDashboardController.changeStatus
);

// Log Feature
router.get("/activity-logs", AdminDashboardController.getAllActivityLogs);
router.get(
  "/activity-logs/this-week",
  AdminDashboardController.getActivityLogsByWeekHandler
);
router.get(
  "/activity-logs/this-month",
  AdminDashboardController.getActivityLogsByMonthHandler
);

// Notifications
router.get("/notifications", AdminDashboardController.getNotifications);
router.get("/submissions", AdminDashboardController.getSubmissions);

export default router;
