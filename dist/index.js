"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("dotenv/config");
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const googleOAuthRoutes_1 = __importDefault(require("./routes/googleOAuthRoutes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT;
const HOST = process.env.HOST;
app.use(express_1.default.json());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:5173");
    res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,PATCH");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Referrer-Policy", "no-referrer-when-downgrade");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});
app.use("/oauth", googleOAuthRoutes_1.default);
app.use("/api/dashboard", dashboardRoutes_1.default);
app.get("*", (req, res) => {
    res.json({
        Error: "Not Found",
    });
});
app.listen(process.env.PORT, () => {
    console.log(`http://${HOST}:${PORT}`);
});
