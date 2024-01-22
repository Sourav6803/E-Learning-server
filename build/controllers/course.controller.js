"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVideoUrl = exports.deleteCourse = exports.getAdminAllCourses = exports.addReplyToReview = exports.addReview = exports.addAnswer = exports.addQuestion = exports.getCourseByUser = exports.getAllCourse = exports.getSingleCourse = exports.editCourse = exports.uploadCourse = void 0;
require("dotenv").config();
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const sendmailer_1 = __importDefault(require("../utils/sendmailer"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const course_service_1 = require("../services/course.service");
const course_model_1 = __importDefault(require("../models/course.model"));
const redis_1 = require("../utils/redis");
const mongoose_1 = __importDefault(require("mongoose"));
const notificationModel_1 = __importDefault(require("../models/notificationModel"));
const node_cron_1 = __importDefault(require("node-cron"));
const axios_1 = __importDefault(require("axios"));
exports.uploadCourse = (0, catchAsyncError_1.catchasyncError)(async (req, res, next) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;
        if (thumbnail) {
            const myCloud = await cloudinary_1.default.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        (0, course_service_1.createCourse)(data, res, next);
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
exports.editCourse = (0, catchAsyncError_1.catchasyncError)(async (req, res, next) => {
    try {
        const data = req.body;
        const courseId = req.params.id;
        const thumbnail = data?.thumbnail;
        const thumbnilUrl = thumbnail?.url;
        console.log(thumbnilUrl);
        const courseData = await course_model_1.default.findById(courseId);
        if (thumbnilUrl === undefined && !thumbnail.startsWith("https")) {
            console.log("hii");
            await cloudinary_1.default.v2.uploader.destroy(courseData.thumbnail.public_id);
            const myCloud = await cloudinary_1.default.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        if (thumbnilUrl && thumbnilUrl.startsWith("https")) {
            data.thumbnail = {
                public_id: courseData?.thumbnail?.public_id,
                url: courseData?.thumbnail?.url
            };
        }
        const course = await course_model_1.default.findByIdAndUpdate(courseId, { $set: data }, { new: true });
        res.status(201).json({ success: true, course });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
// get single course --without purchasing
exports.getSingleCourse = (0, catchAsyncError_1.catchasyncError)(async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const isCachedExist = await redis_1.redis.get(courseId);
        if (isCachedExist) {
            const course = JSON.parse(isCachedExist);
            res.status(200).json({ success: true, course });
        }
        else {
            const course = await course_model_1.default.findById(req.params.id).select("-courseData.videoUrl -courseData.suggestion -courseData.question -courseData.links");
            res.status(200).json({ success: true, course });
            await redis_1.redis.set(courseId, JSON.stringify(course), "EX", 604800);
        }
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
// get all course --without purchasing
exports.getAllCourse = (0, catchAsyncError_1.catchasyncError)(async (req, res, next) => {
    try {
        const courses = await course_model_1.default.find().select("-courseData.videoUrl -courseData.suggestion -courseData.question -courseData.links");
        res.status(200).json({ success: true, courses });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
// get course content only for valid user
exports.getCourseByUser = (0, catchAsyncError_1.catchasyncError)(async (req, res, next) => {
    try {
        const userCourseList = req.user?.courses;
        const courseId = req.params.id;
        const corseExit = userCourseList?.find((course) => course._id.toString() === courseId);
        if (!corseExit) {
            return next(new ErrorHandler_1.default("You are not eligable to access this course", 500));
        }
        const course = await course_model_1.default.findById(courseId);
        const content = course?.courseData;
        res.status(200).json({ success: true, content });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
exports.addQuestion = (0, catchAsyncError_1.catchasyncError)(async (req, res, next) => {
    try {
        const { question, courseId, contentId } = req.body;
        const course = await course_model_1.default.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default("Invalid content id", 400));
        }
        const courseContent = course?.courseData.find((item) => item._id.equals(contentId));
        if (!courseContent) {
            return next(new ErrorHandler_1.default("This content not exist", 400));
        }
        //create a new question object
        const newQuestion = {
            user: req?.user,
            question,
            questionReplies: [],
        };
        // add this question on course content
        courseContent.question.push(newQuestion);
        await notificationModel_1.default.create({
            userId: req?.user?._id,
            title: "New Question recived",
            message: `You have a new question in ${courseContent?.title}`,
        });
        await course?.save();
        res.status(200).json({ success: true, course });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
exports.addAnswer = (0, catchAsyncError_1.catchasyncError)(async (req, res, next) => {
    try {
        const { answer, courseId, contentId, questionId } = req.body;
        const course = await course_model_1.default.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default("Invalid content id", 400));
        }
        const courseContent = course?.courseData.find((item) => item._id.equals(contentId));
        if (!courseContent) {
            return next(new ErrorHandler_1.default("This content not exist", 400));
        }
        const qustion = courseContent?.question.find((item) => item._id.equals(questionId));
        if (!qustion) {
            return next(new ErrorHandler_1.default("Invalid question Id", 400));
        }
        const newAnswer = {
            user: req.user,
            answer,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        qustion.questionReplies?.push(newAnswer);
        await course?.save();
        if (req.user?._id === qustion.user._id) {
            // create a notification
            await notificationModel_1.default.create({
                userId: req.user?._id,
                title: "New Question_reply recived",
                message: `You have a new order from ${courseContent?.title}`,
            });
        }
        else {
            const data = {
                name: qustion.user.name,
                title: courseContent.title,
            };
            const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/question-reply.ejs"), data);
            try {
                await (0, sendmailer_1.default)({
                    email: qustion.user.email,
                    subject: "Question reply",
                    template: "question-reply.ejs",
                    data,
                });
            }
            catch (err) {
                return next(new ErrorHandler_1.default(err.message, 400));
            }
        }
        res.status(200).json({ success: true, course });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
exports.addReview = (0, catchAsyncError_1.catchasyncError)(async (req, res, next) => {
    try {
        const userCourseList = req.user?.courses;
        const courseId = req.params.id;
        const courseExists = userCourseList?.some((course) => course._id.toString() === courseId.toString());
        if (!courseExists) {
            return next(new ErrorHandler_1.default("You are not eligible for this course", 400));
        }
        const course = await course_model_1.default.findById(courseId);
        const { review, rating } = req.body;
        const reviewData = {
            user: req.user,
            comment: review,
            rating,
        };
        course?.reviews.push(reviewData);
        let avg = 0;
        course?.reviews.forEach((rev) => {
            avg += rev.rating;
        });
        if (course) {
            course.rating = avg / course.reviews.length;
        }
        await course?.save();
        await redis_1.redis.set(courseId, JSON.stringify(course), "EX", 604800);
        // create notfication
        // await notificationModel.create({
        //   user: req.user._id,
        //   title: "New Review recived",
        //   message: `${req.user.name} has given a review in ${course.name}`
        // })
        res.status(200).json({ success: true, course });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
exports.addReplyToReview = (0, catchAsyncError_1.catchasyncError)(async (req, res, next) => {
    try {
        const { comment, courseId, reviewId } = req.body;
        const course = await course_model_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", 400));
        }
        const review = course?.reviews?.find((rev) => rev._id.toString() === reviewId);
        if (!review) {
            return next(new ErrorHandler_1.default("Review not found", 400));
        }
        const replyData = {
            user: req.user,
            comment,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        if (!review.commentReplies) {
            review.commentReplies = [];
        }
        review.commentReplies.push(replyData);
        await course?.save();
        await redis_1.redis.set(courseId, JSON.stringify(course), 'EX', 604800);
        res.status(200).json({ success: true, course });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
// delete notification
node_cron_1.default.schedule("0 0 0 * * *", async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await notificationModel_1.default.deleteMany({
        status: "read",
        createdAt: { $lt: thirtyDaysAgo },
    });
    console.log("Delete read notification");
});
// for admin
exports.getAdminAllCourses = (0, catchAsyncError_1.catchasyncError)(async (req, res, next) => {
    try {
        (0, course_service_1.getAllCoursesService)(res);
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
exports.deleteCourse = (0, catchAsyncError_1.catchasyncError)(async (req, res, next) => {
    try {
        const { id } = req.params;
        const course = await course_model_1.default.findById(id);
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", 404));
        }
        await course.deleteOne({ id });
        await redis_1.redis.del(id);
        res
            .status(200)
            .json({ success: true, message: "Course deleted successfully" });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
// generate video url
exports.generateVideoUrl = (0, catchAsyncError_1.catchasyncError)(async (req, res, next) => {
    try {
        const { videoId } = req.body;
        const response = await axios_1.default.post(`https://dev.vdocipher.com/api/videos/${videoId}/otp`, { ttl: 300 }, {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Apisecret ${process.env.VDOCHIPHER_API_SECRET}`,
            },
        });
        res.json(response.data);
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
