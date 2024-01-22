"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const emailRegxPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const userScheema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, "Please enter your Name"]
    },
    email: {
        type: String,
        validator: function (value) {
            return emailRegxPattern.test(value);
        },
        message: "Enter a valid Email",
        unique: true
    },
    password: {
        type: String,
        minlength: [6, "Password must be 6 character"],
        select: false
    },
    avatar: {
        public_id: String,
        url: String
    },
    role: {
        type: String,
        default: 'user'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    courses: [
        {
            courseId: String
        }
    ]
}, { timestamps: true });
userScheema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    this.password = await bcryptjs_1.default.hash(this.password, 10);
});
userScheema.methods.SignAccessToken = function () {
    return jsonwebtoken_1.default.sign({ id: this._id }, process.env.ACCESS_TOKEN || '', { expiresIn: '5m' });
};
userScheema.methods.SignRefreshToken = function () {
    return jsonwebtoken_1.default.sign({ id: this._id }, process.env.REFRESH_TOKEN || '', { expiresIn: '3d' });
};
// compare password
userScheema.methods.comparePassword = async function (enteredPassword) {
    return await bcryptjs_1.default.compare(enteredPassword, this.password);
};
const userModel = mongoose_1.default.model("User", userScheema);
exports.default = userModel;
