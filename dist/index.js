"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("dotenv/config");
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const googleOAuthRoutes_1 = __importDefault(require("./routes/googleOAuthRoutes"));
const cors_1 = __importDefault(require("cors"));
// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();
const app = (0, express_1.default)();
const PORT = process.env.PORT;
const HOST = process.env.HOST;
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
app.use("/oauth", googleOAuthRoutes_1.default);
app.use("/api/dashboard", dashboardRoutes_1.default);
// app.get("/prisma", async (req, res) => {
//   try {
//     const allUsers = await prisma.user.findMany();
//     res.json({
//       user: allUsers,
//     });
//   } catch (err) {
//     const error = err as Error;
//     res.json({
//       message: error.message,
//     });
//   }
// });
app.get("*", (req, res) => {
    res.json({
        Error: "Not Found",
    });
});
app.listen(process.env.PORT, () => {
    console.log(`http://${HOST}:${PORT}`);
});
