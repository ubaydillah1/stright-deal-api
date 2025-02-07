import express, { Request, Response, NextFunction } from "express";
import "dotenv/config";
import dashboardRouter from "./routes/dashboardRoutes";
import googleOuthRouter from "./routes/googleOAuthRoutes";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const app = express();

const PORT = process.env.PORT;
const HOST = process.env.HOST;

app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use("/oauth", googleOuthRouter);
app.use("/api/dashboard", dashboardRouter);

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
