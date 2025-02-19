import express, { Response, Request } from "express";
import * as UserCarController from "../controllers/UserCarController";

const router = express.Router();

router.post("/car", UserCarController.createCarForm);

export default router;
