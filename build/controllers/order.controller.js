"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newPayment = exports.sendStripePublishableKey = exports.getAllOrders = exports.createOrder = void 0;
require("dotenv").config();
const user_model_1 = __importDefault(require("../models/user.model"));
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const sendmailer_1 = __importDefault(require("../utils/sendmailer"));
const course_model_1 = __importDefault(require("../models/course.model"));
const notificationModel_1 = __importDefault(require("../models/notificationModel"));
const order_servise_1 = require("../services/order.servise");
const redis_1 = require("../utils/redis");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
exports.createOrder = (0, catchAsyncError_1.catchasyncError)(async (req, res, next) => {
    try {
        const { courseId, payment_info } = req.body;
        if (payment_info) {
            if ("id" in payment_info) {
                const paymentIntentId = payment_info.id;
                const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
                if (paymentIntent.status !== "succeeded") {
                    return next(new ErrorHandler_1.default("Payment not Authorized", 400));
                }
            }
        }
        const user = await user_model_1.default.findById(req.user?._id);
        const courseExistInUser = user?.courses.some((course) => course._id.toString() === courseId.toString());
        if (courseExistInUser) {
            return next(new ErrorHandler_1.default("You already purchase the course", 400));
        }
        const course = await course_model_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("YCourse not found", 404));
        }
        const data = {
            courseId: course._id,
            userId: user?._id,
            payment_info
        };
        const mailData = {
            order: {
                _id: course?._id.toString().slice(0, 6),
                name: course?.name,
                price: course?.price,
                date: new Date().toLocaleString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
            },
        };
        const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/order-confirmation.ejs"), { order: mailData });
        try {
            if (user) {
                await (0, sendmailer_1.default)({
                    email: user.email,
                    subject: "Order Confirmation",
                    template: "order-confirmation.ejs",
                    data: mailData,
                });
            }
        }
        catch (err) {
            return next(new ErrorHandler_1.default(err.message, 500));
        }
        user?.courses.push(course?._id);
        await redis_1.redis.set(req?.user?._id, JSON.stringify(user));
        await user?.save();
        await notificationModel_1.default.create({
            userId: user?._id,
            title: "New order",
            message: `You have a new order from ${course?.name}`
        });
        course.purchased = course?.purchased + 1;
        await course.save();
        (0, order_servise_1.newOrder)(data, res, next);
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
exports.getAllOrders = (0, catchAsyncError_1.catchasyncError)(async (req, res, next) => {
    try {
        (0, order_servise_1.getAllOrderService)(res);
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
// send stripe publishleble keys
exports.sendStripePublishableKey = (0, catchAsyncError_1.catchasyncError)(async (req, res, next) => {
    try {
        res.status(200).json({
            publishablekey: process.env.STRIPE_PUBLISHABLE_KEY
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
exports.newPayment = (0, catchAsyncError_1.catchasyncError)(async (req, res, next) => {
    try {
        const myPaymet = await stripe.paymentIntents.create({
            amount: req?.body?.amount,
            currency: "inr",
            metadata: {
                company: "Jamalpur_Baazar",
            },
            automatic_payment_methods: {
                enabled: true
            }
        });
        res.status(201).json({
            success: true,
            client_secret: myPaymet.client_secret,
        });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
