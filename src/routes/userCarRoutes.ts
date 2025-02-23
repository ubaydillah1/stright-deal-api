import express from "express";
import * as UserCarController from "../controllers/UserCarController";
import { authorize } from "../middlewares/authorize";
import { Role } from "@prisma/client";

const router = express.Router();

router.post("/car", authorize([Role.User]), UserCarController.createCarForm);
router.post(
  "/upload-images-car",
  authorize([Role.User]),
  UserCarController.uploadImages
);

export default router;
