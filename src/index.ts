import express, { Request, Response } from "express";
import "dotenv/config";
import adminDashboardRouter from "./routes/adminDashboardRoutes";
import authRouter from "./routes/authRoutes";
import cors from "cors";
import prisma from "./config/prismaClient";
import cookieParser from "cookie-parser";
import userCarRouter from "./routes/userCarRoutes";
import fileUpload from "express-fileupload";
import limiter from "./utils/limiter";
import { authorize } from "./middlewares/authorize";
import { Role } from "@prisma/client";
import profileRouter from "./routes/profileRoutes";
import { supabase } from "./config/supabaseClient";

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
    origin: ["https://www.straightdeal.com", "https://straightdeal.com"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use("/api/auth", authRouter);
app.use("/api/profile", authorize([Role.User, Role.Admin]), profileRouter);
app.use("/api/admin/dashboard", authorize([Role.Admin]), adminDashboardRouter);
app.use("/api/user", authorize([Role.User]), userCarRouter);

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

async function deleteFile() {
  let fileName =
    "5b3dced6-9204-4f1a-9bc7-670d9714dbcf_1741168346879_Screenshot 2025-02-22 154745.png";

  try {
    fileName = decodeURIComponent(fileName);

    const { error } = await supabase.storage.from("avatars").remove([fileName]);

    if (error) {
      console.error("Error deleting file:", error.message);
    } else {
      console.log(`Successfully deleted file: ${fileName}`);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

// deleteFile();

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
