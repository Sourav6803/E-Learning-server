"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletenotification = exports.updateNotification = exports.getNotification = void 0;
require("dotenv").config();
const notificationModel_1 = __importDefault(require("../models/notificationModel"));
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
exports.getNotification = (0, catchAsyncError_1.catchasyncError)(async (req, res, next) => {
    try {
        const notification = await notificationModel_1.default.find().sort({ createdAt: -1 });
        res.status(200).json({ succes: true, notification });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
exports.updateNotification = (0, catchAsyncError_1.catchasyncError)(async (req, res, next) => {
    try {
        const notfication = await notificationModel_1.default.findById(req.params.id);
        if (notfication) {
            notfication?.status ? notfication.status = "read" : notfication?.status;
        }
        await notfication?.save();
        res.status(200).json({ success: true, notfication });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
exports.deletenotification = (0, catchAsyncError_1.catchasyncError)(async (req, res, next) => {
    try {
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
