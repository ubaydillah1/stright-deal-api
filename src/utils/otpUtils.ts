import crypto from "crypto";
import dayjs from "dayjs";
import { client as twilioClient, twilioPhoneNumber } from "./twilioClient";

export const generateOtp = () => crypto.randomInt(100000, 999999).toString();
export const getOtpExpiration = () => dayjs().add(5, "minutes").toDate();

export const sendOtpMessage = async (phoneNumber: string, otp: string) => {
  console.log("Generated OTP:", otp);
  console.log("Trigger");
  return await twilioClient.messages.create({
    body: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
    from: twilioPhoneNumber,
    to: phoneNumber,
  });
};
