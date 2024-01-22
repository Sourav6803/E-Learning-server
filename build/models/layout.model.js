"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const mongoose_1 = require("mongoose");
const faqSchema = new mongoose_1.Schema({
    question: {
        type: String,
    },
    answer: {
        type: String,
    },
}, { timestamps: true });
const categorySchema = new mongoose_1.Schema({
    title: String,
});
const bannerImageSchema = new mongoose_1.Schema({
    public_id: { type: String },
    url: { type: String },
});
const layoutScheema = new mongoose_1.Schema({
    type: { type: String },
    faq: [faqSchema],
    categories: [categorySchema],
    banner: {
        image: {
            public_id: String,
            url: String,
        },
        title: { type: String },
        subTitle: { type: String },
    },
});
const layoutModel = (0, mongoose_1.model)("Layout", layoutScheema);
exports.default = layoutModel;
