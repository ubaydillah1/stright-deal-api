import express, { Request, Response } from "express";
import "dotenv/config";
import adminDashboardRouter from "./routes/adminDashboardRoutes";
import authRouter from "./routes/authRoutes";
import cors from "cors";
import prisma from "./config/prismaClient";
import cookieParser from "cookie-parser";
import userCarRouter from "./routes/userCarRoutes";
// import "./utils/seed";
import fileUpload from "express-fileupload";
import limiter from "./utils/limiter";
import { authorize } from "./middlewares/authorize";
import { Role } from "@prisma/client";
import profileRouter from "./routes/profileRoutes";

const app = express();

const PORT = process.env.PORT;
const HOST = process.env.HOST;

app.use(cookieParser());
app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://www.straightdeal.com",
      "https://straightdeal.com",
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
app.use("/api/profile", authorize([Role.User, Role.Admin]), profileRouter);
app.use("/api/admin/dashboard", adminDashboardRouter);
app.use("/api/user", authorize([Role.User]), userCarRouter);

app.get("/delete-users", async (req, res) => {
  console.log(req.ip);
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

app.get("/delete-cars", async (req, res) => {
  try {
    await prisma.car.deleteMany();
    res.json({
      message: "All cars has been deleted",
    });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({
      message: error.message,
    });
  }
});

app.get("/delete-car-images", async (req, res) => {
  try {
    await prisma.carImage.deleteMany();
    res.json({
      message: "All features has been deleted",
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

app.get("*", (req: Request, res: Response) => {
  res.json({
    Error: "Not Found",
  });
});

const server = app.listen(process.env.PORT, () => {
  console.log(`http://${HOST}:${PORT}`);
});

process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});
