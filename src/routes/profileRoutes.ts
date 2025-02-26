import express from "express";
import * as DashboardController from "../controllers/ProfileController";
import { validateRequest } from "../middlewares/validateRequest";

const router = express.Router();

router.patch(
  "/change-name",
  validateRequest(["firstName", "lastName"]),
  DashboardController.changeName
);
router.patch(
  "/change-password",
  validateRequest(["newPassword"]),
  DashboardController.changePassword
);

export default router;
