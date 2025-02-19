import express, { Request, Response } from "express";
import "dotenv/config";
import dashboardRouter from "./routes/dashboardRoutes";
import authRouter from "./routes/authRoutes";
import cors from "cors";
import prisma from "./config/prismaClient";
import cookieParser from "cookie-parser";
import userCarRouter from "./routes/userCarRoutes";
import rateLimit from "express-rate-limit";
import { supabase } from "./config/supabaseClient";
// import "./utils/seed";
import fileUpload from "express-fileupload";

const app = express();

const PORT = process.env.PORT;
const HOST = process.env.HOST;

app.use(fileUpload());
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

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later",
});

async function verifyToken(token: string) {
  const url = `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`;

  try {
    // Menggunakan fetch untuk memverifikasi token
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Token verification failed");
    }

    // Mengambil data JSON dari respons
    const data = await response.json();
    console.log(data); // Menampilkan data token yang valid
  } catch (error) {
    console.error("Error:", error);
  }
}

// Contoh penggunaan fungsi dengan token akses
const token =
  "ya29.a0AXeO80RC7nLRK2k5eNXs6jSp2kZe1RG3KI5sNurxcOC2OIZDeYgrZZQ3Cz4X4NHi2xxyINOME19uE-M8yUKvZmEjv6KT0vElAF7cDbH1KBxyBIpU8wTxzCrTSNeErWZwtEfMC-HOC-JtxnkyD4RyYe7I49QFCkS0nLkGhuT4aCgYKAXISARISFQHGX2Mi5N8jPH4Zvoe3MPwqs0CEPw0175";
// verifyToken(token);

app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);

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

app.listen(process.env.PORT, () => {
  console.log(`http://${HOST}:${PORT}`);
});
