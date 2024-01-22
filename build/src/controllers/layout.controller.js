"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLayoutByType = exports.editLayout = exports.createLayout = void 0;
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const layout_model_1 = __importDefault(require("../models/layout.model"));
const cloudinary_1 = __importDefault(require("cloudinary"));
exports.createLayout = (0, catchAsyncError_1.catchasyncError)(async (req, res, next) => {
    try {
        const { type } = req.body;
        const isTypeExist = await layout_model_1.default.findOne({ type });
        if (isTypeExist) {
            return next(new ErrorHandler_1.default(`${type} already exist.`, 400));
        }
        if (type === "Banner") {
            const { image, title, subTitle } = req.body;
            const myCloud = await cloudinary_1.default.v2.uploader.upload(image, {
                folder: "layout",
            });
            const banner = {
                type: "Banner",
                banner: {
                    image: {
                        public_id: myCloud.public_id,
                        url: myCloud.secure_url,
                    },
                    title: title,
                    subTitle: subTitle,
                },
            };
            await layout_model_1.default.create(banner);
        }
        if (type === "FAQ") {
            const { faq } = req.body;
            const faqItems = await Promise.all(faq.map(async (item) => {
                return {
                    question: item.question,
                    answer: item.answer,
                };
            }));
            await layout_model_1.default.create({ type: "FAQ", faq: faqItems });
        }
        if (type === "Categories") {
            const { categories } = req.body;
            const categorytems = await Promise.all(categories.map(async (item) => {
                return {
                    title: item.title,
                };
            }));
            await layout_model_1.default.create({
                type: "Categories",
                categories: categorytems,
            });
        }
        res
            .status(201)
            .json({ success: true, message: "Layout create successfully" });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
// Edit layout
exports.editLayout = (0, catchAsyncError_1.catchasyncError)(async (req, res, next) => {
    try {
        const { type } = req.body;
        if (type === "Banner") {
            const bannerData = await layout_model_1.default.findOne({ type: "Banner" });
            const { image, title, subTitle } = req.body;
            const data = image?.startsWith("https") ? bannerData : await cloudinary_1.default.v2.uploader.upload(image, {
                folder: "layout",
            });
            //  await cloudinary.v2.uploader.destroy(bannerData?.image?.public_id);
            //  const myCloud = await cloudinary.v2.uploader.upload(image, {
            //     folder: "layout",
            //   });
            const banner = {
                type: "Banner",
                image: {
                    public_id: image.startsWith("https") ? bannerData.banner.image.public_id : data.public_id,
                    url: image.startsWith("https") ? bannerData.banner.image.url : data.secure_url,
                },
                title,
                subTitle,
            };
            console.log(banner);
            await layout_model_1.default.findByIdAndUpdate(bannerData?._id, { banner });
        }
        if (type === "FAQ") {
            const faqItem = await layout_model_1.default.findOne({ type: "FAQ" });
            const { faq } = req.body;
            const faqItems = await Promise.all(faq.map(async (item) => {
                return {
                    question: item.question,
                    answer: item.answer,
                };
            }));
            await layout_model_1.default.findByIdAndUpdate(faqItem?._id, { type: "FAQ", faq: faqItems });
        }
        if (type === "Categories") {
            const { categories } = req.body;
            const categoryItem = await layout_model_1.default.findOne({ type: "Categories" });
            const categorytems = await Promise.all(categories.map(async (item) => {
                return {
                    title: item.title,
                };
            }));
            await layout_model_1.default.findByIdAndUpdate(categoryItem?._id, {
                type: "Categories",
                categories: categorytems,
            });
        }
        res
            .status(201)
            .json({ success: true, message: "Layout update successfully" });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
exports.getLayoutByType = (0, catchAsyncError_1.catchasyncError)(async (req, res, next) => {
    try {
        const { type } = req.params;
        const layout = await layout_model_1.default.findOne({ type });
        return res.status(200).json({ succes: true, layout });
    }
    catch (err) {
        return next(new ErrorHandler_1.default(err.message, 500));
    }
});
