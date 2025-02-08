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
const google_auth_library_1 = require("google-auth-library");
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = express_1.default.Router();
const serverUrl = process.env.SERVER_URL;
const clientUrl = process.env.CLIENT_URL;
function getUserData(accessToken) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
            const data = yield response.json();
            return data;
        }
        catch (error) {
            const e = error;
            console.log(e.message);
        }
    });
}
function generateAccessToken(user) {
    return jsonwebtoken_1.default.sign(user, process.env.JWT_ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
    });
}
function generateRefreshToken(user) {
    return jsonwebtoken_1.default.sign(user, process.env.JWT_REFRESH_TOKEN_SECRET, {
        expiresIn: "7d",
    });
}
router.get("/google/callback", function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const code = req.query.code;
        if (!code) {
            return res.redirect(`${clientUrl}/failed-login?error=missing_code`);
        }
        try {
            const redirectUrl = `${serverUrl}/api/auth/google/callback`;
            const oAuth2Client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, redirectUrl);
            const { tokens } = yield oAuth2Client.getToken(code);
            oAuth2Client.setCredentials(tokens);
            const access_token = tokens.access_token;
            if (!access_token) {
                return res.redirect(`${clientUrl}/failed-login?error=missing_token`);
            }
            const userProfil = yield getUserData(access_token);
            if (!userProfil || !userProfil.email) {
                return res.redirect(`${clientUrl}/failed-login?error=missing_email`);
            }
            let existingUser = yield prismaClient_1.default.user.findUnique({
                where: { email: userProfil.email },
            });
            if (!existingUser) {
                existingUser = yield prismaClient_1.default.user.create({
                    data: {
                        email: userProfil.email,
                        avatar: userProfil.picture,
                        firstName: userProfil.given_name,
                        lastName: userProfil.family_name,
                        password: "",
                        expiredOtpToken: new Date(),
                        otpToken: "",
                        phoneNumber: "",
                        refreshToken: "",
                    },
                });
            }
            if (!existingUser || !existingUser.id) {
                return res.redirect(`${clientUrl}/failed-login?error=missing_user_id`);
            }
            const accessToken = generateAccessToken({
                id: existingUser.id,
                email: existingUser.email,
                role: existingUser.role,
            });
            const refreshToken = generateRefreshToken({
                id: existingUser.id,
                email: existingUser.email,
                role: existingUser.role,
            });
            yield prismaClient_1.default.user.update({
                where: { id: existingUser.id },
                data: { refreshToken: refreshToken },
            });
            res.redirect(`${clientUrl}/success-login?access_token=${accessToken}`);
        }
        catch (error) {
            return res.redirect(`${clientUrl}/failed-login?error=${encodeURIComponent(error.message)}`);
        }
    });
});
router.post("/google", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const redirectUrl = `${serverUrl}/api/auth/google/callback`;
        const oAuth2Client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, redirectUrl);
        const authorizeUrl = oAuth2Client.generateAuthUrl({
            access_type: "offline",
            scope: [
                "https://www.googleapis.com/auth/userinfo.profile",
                "https://www.googleapis.com/auth/userinfo.email",
            ],
            prompt: "consent",
        });
        res.json({ url: authorizeUrl });
    });
});
exports.default = router;
