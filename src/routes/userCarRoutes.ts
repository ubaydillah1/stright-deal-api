import express from "express";
import * as UserCarController from "../controllers/UserCarController";
import { validateRequest } from "../middlewares/validateRequest";
const router = express.Router();

router.get("/car", UserCarController.getUserCar);
router.get("/cars", UserCarController.getCarsUser);
router.post("/car", UserCarController.createCarForm);

router.post(
  "/upload-images-car",
  validateRequest(["carId"]),
  UserCarController.uploadImages
);

export default router;
