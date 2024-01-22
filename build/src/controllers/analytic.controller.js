"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderAnalytic = exports.getCourserAnalytic = exports.getUserAnalytic = void 0;
require("dotenv").config();
const user_model_1 = __importDefault(require("../models/user.model"));
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const analytic_generator_1 = require("../utils/analytic.generator");
const orderModel_1 = __importDefault(require("../models/orderModel"));
const course_model_1 = __importDefault(require("../models/course.model"));
// user analytic only for admin
exports.getUserAnalytic = (0, catchAsyncError_1.catchasyncError)(async (req, res, next) => {
    try {
        const users = await (0, analytic_generator_1.generateLast12MonthsData)(user_model_1.default);
        res.status(200).json({ success: true, users });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
exports.getCourserAnalytic = (0, catchAsyncError_1.catchasyncError)(async (req, res, next) => {
    try {
        const course = await (0, analytic_generator_1.generateLast12MonthsData)(course_model_1.default);
        res.status(200).json({ success: true, course });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
exports.getOrderAnalytic = (0, catchAsyncError_1.catchasyncError)(async (req, res, next) => {
    try {
        const order = await (0, analytic_generator_1.generateLast12MonthsData)(orderModel_1.default);
        res.status(200).json({ success: true, order });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
