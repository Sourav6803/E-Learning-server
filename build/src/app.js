"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
require('dotenv').config();
const express_1 = __importDefault(require("express"));
exports.app = (0, express_1.default)();
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const error_1 = require("./middleware/error");
const user_route_1 = __importDefault(require("./routes/user.route"));
const course_Routes_1 = __importDefault(require("./routes/course.Routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const notificatio_routes_1 = __importDefault(require("./routes/notificatio.routes"));
const analytic_routes_1 = __importDefault(require("./routes/analytic.routes"));
const layout_routes_1 = __importDefault(require("./routes/layout.routes"));
const express_rate_limit_1 = require("express-rate-limit");
exports.app.use(express_1.default.json({ limit: '50mb' }));
exports.app.use((0, helmet_1.default)());
exports.app.use((0, cookie_parser_1.default)());
exports.app.use((0, multer_1.default)().any());
exports.app.use((0, cors_1.default)({
    origin: ["https://e-learning-frontend-one.vercel.app"],
    credentials: true
}));
// origin: ["https://e-learning-frontend-8sr0iytv6-sourav6803.vercel.app"],
//https://e-learning-frontend-11mga87bd-sourav6803.vercel.app/
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    // store: ... , // Use an external store for consistency across multiple server instances.
});
exports.app.use("/api/v1", user_route_1.default);
exports.app.use("/api/v1", course_Routes_1.default);
exports.app.use("/api/v1", order_routes_1.default);
exports.app.use("/api/v1", notificatio_routes_1.default);
exports.app.use("/api/v1", analytic_routes_1.default);
exports.app.use("/api/v1", layout_routes_1.default);
exports.app.get("/test", (req, res, next) => {
    res.status(200).json({ success: true, message: "Welocome to LMS" });
});
exports.app.all('*', (req, res, next) => {
    const err = new Error(`Route ${req.originalUrl} not found`);
    err.statusCode = 404;
    next(err);
});
exports.app.use(limiter);
exports.app.use(error_1.ErrorMiddlware);
