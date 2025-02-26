import express from "express";
import * as DashboardController from "../controllers/ProfileController";

const router = express.Router();

router.patch("/change-name", DashboardController.changeName);
router.patch("/change-password", DashboardController.changePassword);

export default router;
