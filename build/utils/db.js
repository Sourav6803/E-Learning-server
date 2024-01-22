"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
require("dotenv").config();
const mongoose_1 = __importDefault(require("mongoose"));
const dbUrl = process.env.DB_URL || '';
const connectDB = async () => {
    try {
        await mongoose_1.default.connect(dbUrl).then((data) => {
            console.log(`Database connected with ${data.connection.host}`);
        });
    }
    catch (err) {
        console.log(err.message);
        setTimeout(exports.connectDB, 5000);
    }
};
exports.connectDB = connectDB;
