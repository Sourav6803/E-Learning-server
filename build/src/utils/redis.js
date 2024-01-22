"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = require("ioredis");
require("dotenv").config();
const redisClient = () => {
    if (process.env.REDIS_URL) {
        console.log(`Redis connected`);
        return process.env.REDIS_URL;
    }
    throw new Error('Redis connection Failed');
};
// "redis://default:752ea426362345c58ec906c711be0267@direct-bonefish-34145.upstash.io:34145"
exports.redis = new ioredis_1.Redis(redisClient());
