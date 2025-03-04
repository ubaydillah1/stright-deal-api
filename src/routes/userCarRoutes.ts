import express from "express";
import * as UserCarController from "../controllers/UserCarController";
import { validateRequest } from "../middlewares/validateRequest";
const router = express.Router();

router.get("/car", UserCarController.getUserCar);
router.get("/cars", UserCarController.getCarsUser);
router.post("/car", UserCarController.createCarForm);
router.put("/car", UserCarController.updateCarForm);

router.post(
  "/upload-images-car",
  validateRequest(["carId"]),
  UserCarController.uploadImages
);

router.put(
  "/update-images-car",
  validateRequest(["carId", "imagesToReplace"]),
  UserCarController.updateImages
);

export default router;
