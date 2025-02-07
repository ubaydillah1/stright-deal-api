import express, { Request, Response, NextFunction } from "express";
import "dotenv/config";
import dashboardRouter from "./routes/dashboardRoutes";
import { OAuth2Client } from "google-auth-library";
import googleOuthRouter from "./routes/googleOAuthRoutes";

const app = express();

const PORT = process.env.PORT;
const HOST = process.env.HOST;

app.use(express.json());
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,PATCH");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Referrer-Policy", "no-referrer-when-downgrade");
  res.header("Access-Control-Allow-Credentials", "true");

  next();
});

app.use("/oauth", googleOuthRouter);
app.use("/api/dashboard", dashboardRouter);

app.get("*", (req: Request, res: Response) => {
  res.json({
    Error: "Not Found",
  });
});

app.listen(process.env.PORT, () => {
  console.log(`http://${HOST}:${PORT}`);
});
