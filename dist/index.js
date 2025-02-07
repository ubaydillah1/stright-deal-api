"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("dotenv/config");
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const googleOAuthRoutes_1 = __importDefault(require("./routes/googleOAuthRoutes"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
app.get("/prisma", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const allUsers = yield prisma.user.findMany();
        res.json({
            user: allUsers,
        });
    }
    catch (err) {
        const error = err;
        res.json({
            message: error.message,
        });
    }
}));
app.get("*", (req, res) => {
    res.json({
        Error: "Not Found",
    });
});
app.listen(process.env.PORT, () => {
    console.log(`http://${HOST}:${PORT}`);
});
