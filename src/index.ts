import express, { Request, Response } from "express";
import "dotenv/config";
import dashboardRouter from "./routes/dashboardRoutes";
import authRouter from "./routes/authRoutes";
import cors from "cors";
import prisma from "./config/prismaClient";
import cookieParser from "cookie-parser";
import { sendEmail } from "./utils/emailServiceSand";
// import { supabase } from "./config/supabaseClient";
// import "./utils/seed";

// import twilio from "twilio";

// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const client = twilio(accountSid, authToken);

// async function createMessage() {
//   const message = await client.messages.create({
//     body: "This is the ship that made the Kessel Run in fourteen parsecs?",
//     from: "+19125134149",
//     to: "+15558675310",
//   });

//   console.log(message.body);
// }

// createMessage();

const app = express();

const PORT = process.env.PORT;
const HOST = process.env.HOST;

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://testing-s-deal-vercel.vercel.app",
      "https://straight-deal.webflow.io",
      "http://127.0.0.1:5500",
      "http://localhost:5500",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);

app.get("/delete-users", async (req, res) => {
  try {
    await prisma.user.deleteMany();
    res.json({
      message: "User has been deleted",
    });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({
      message: error.message,
    });
  }
});

app.get("/prisma", async (req, res) => {
  try {
    const allUsers = await prisma.user.findMany();

    res.json({
      user: allUsers,
    });
  } catch (err) {
    const error = err as Error;
    res.json({
      message: error.message,
    });
  }
});

// const getBucketInfo = async () => {
//   const { data, error } = await supabase.storage.listBuckets();

//   if (error) {
//     console.error("Error fetching bucket:", error);
//     return;
//   }

//   console.log("Bucket data:", data);
// };

// getBucketInfo();

app.get("*", (req: Request, res: Response) => {
  res.json({
    Error: "Not Found",
  });
});

app.listen(process.env.PORT, () => {
  console.log(`http://${HOST}:${PORT}`);
});
