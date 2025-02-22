import crypto from "crypto";
import { client as twilioClient, twilioPhoneNumber } from "./twilioClient";

export const generateOtp = () => crypto.randomInt(100000, 999999).toString();
export const getOtpExpiration = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5);
  return now;
};

export const sendOtpMessage = async (phoneNumber: string, otp: string) => {
  return await twilioClient.messages.create({
    body: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
    from: twilioPhoneNumber,
    to: phoneNumber,
  });
};
