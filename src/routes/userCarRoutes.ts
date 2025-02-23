import express from "express";
import * as UserCarController from "../controllers/UserCarController";
import { authorize } from "../middlewares/authorize";
import { Role } from "@prisma/client";

const router = express.Router();

router.post("/car", UserCarController.createCarForm);
router.post("/upload-images-car", UserCarController.uploadImages);

export default router;
