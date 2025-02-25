import express from "express";
import * as UserCarController from "../controllers/UserCarController";
import { validateRequest } from "../middlewares/validateRequest";
import { authorize } from "../middlewares/authorize";
import { Role } from "@prisma/client";

const router = express.Router();

router.get("/car", UserCarController.getUserCar);
router.post("/car", UserCarController.createCarForm);

router.post(
  "/upload-images-car",
  validateRequest(["carId"]),
  UserCarController.uploadImages
);

router.patch(
  "/vin",
  validateRequest(["carId", "vin"]),
  authorize([Role.User]),
  UserCarController.updateVIN
);

export default router;
