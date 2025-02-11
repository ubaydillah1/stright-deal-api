import express from "express";
import * as AuthController from "./../controllers/AuthController";
import { validateRequest } from "../middlewares/validateRequest";

const router = express.Router();

router.post(
  "/register",
  validateRequest(["firstName", "lastName", "email", "password"]),
  AuthController.register
);

router.post(
  "/login",
  validateRequest(["email", "password"]),
  AuthController.login
);
router.post("/logout", AuthController.logout);

// Email verification after register
router.get("/verify-email", AuthController.verifyEmail);
router.post(
  "/resend-verification-email",
  AuthController.resendVerificationEmail
);

// Google Auth
router.get("/google", AuthController.googleAuth);
router.get("/google/callback", AuthController.googleCallback);

// Get token from cookies
router.get("/get-token-cookies", AuthController.getTokenCookies);

export default router;
