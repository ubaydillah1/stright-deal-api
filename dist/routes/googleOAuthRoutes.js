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
const router = express_1.default.Router();
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
router.get("/", function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const code = req.query.code;
        try {
            const redirectUrl = `${clientUrl}/oauth`;
            const oAuth2Client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, redirectUrl);
            const { tokens } = yield oAuth2Client.getToken(code);
            yield oAuth2Client.setCredentials(tokens);
            const user = oAuth2Client.credentials;
        }
        catch (error) {
            const e = error;
            res.status(500).json({ error: e.message });
        }
    });
});
router.post("/", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const redirectUrl = `${clientUrl}/oauth`;
        const oAuth2Client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, redirectUrl);
        const authorizeUrl = oAuth2Client.generateAuthUrl({
            access_type: "offline",
            scope: "https://www.googleapis.com/auth/userinfo.profile openid",
            prompt: "consent",
        });
        res.json({ url: authorizeUrl });
    });
});
exports.default = router;
