import express from "express";
import * as AuthController from "./../controllers/AuthController";
import { validateRequest } from "../middlewares/validateRequest";
import { authenticateToken } from "../middlewares/authenticateToken";

const router = express.Router();

// Auth local
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

router.delete("/logout", AuthController.logout);

// Reset Password
router.post(
  "/forgot-password",
  validateRequest(["email"]),
  AuthController.forgotPassword
);
router.get("/reset-password", AuthController.getResetPasswordPage);
router.post("/reset-password", AuthController.resetPassword);

// Email verification after register
router.post(
  "/verify-email",
  validateRequest(["email", "otp"]),
  authenticateToken,
  AuthController.verifyEmail
);
router.post(
  "/resend-verification-email",
  validateRequest(["email"]),
  authenticateToken,
  AuthController.resendVerificationEmail
);

// Google Auth
router.get("/google", AuthController.googleAuth);
router.get("/google/callback", AuthController.googleCallback);

// Get token from cookies
router.get("/get-token-cookies", AuthController.getTokenCookies);

// Get OTP
router.post(
  "/get-phone-otp",
  validateRequest(["phoneNumber"]),
  AuthController.getOtp
);

// Get Access token from Refresh token
router.post("/refresh-token", AuthController.refreshTokenHandler);

export default router;
