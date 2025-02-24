import express from "express";
import * as AuthController from "./../controllers/AuthController";
import { validateRequest } from "../middlewares/validateRequest";
import { authorize } from "../middlewares/authorize";
import { Role } from "@prisma/client";

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
router.post(
  "/reset-password",
  validateRequest(["token", "newPassword"]),
  AuthController.resetPassword
);

// Email verification after register
router.get("/verify-email", AuthController.verifyEmail);

router.post(
  "/resend-verification-email",
  validateRequest(["email"]),
  AuthController.resendVerificationEmail
);

// Google Auth
router.get("/google", AuthController.googleAuth);
router.get("/google/callback", AuthController.googleCallback);

// Get token from cookies
router.get("/get-token-cookies", AuthController.getTokenCookies);

// Get OTP
router.post(
  "/send-phone-otp",
  authorize([Role.Visitor, Role.User]),
  validateRequest(["phoneNumber"]),
  AuthController.sendPhoneOTP
);

router.post(
  "/verify-phone-otp",
  authorize([Role.Visitor, Role.User]),
  validateRequest(["phoneNumber", "otp"]),
  AuthController.verifyPhoneOTP
);

// Get Access token from Refresh token
router.post(
  "/refresh-token",
  validateRequest(["refreshToken"]),
  AuthController.refreshTokenHandler
);

// Get User
router.get(
  "/get-user",
  authorize([Role.Visitor, Role.User, Role.Admin]),
  AuthController.getUser
);

export default router;
