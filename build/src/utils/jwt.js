"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToken = exports.refreshTokenOptions = exports.accessTokenOptions = exports.refreshTokenExpire = exports.accessTokenExpire = void 0;
require("dotenv").config();
const redis_1 = require("./redis");
exports.accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || '300', 10);
exports.refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '1200', 10);
// option for cookie
exports.accessTokenOptions = {
    expires: new Date(Date.now() + exports.accessTokenExpire * 60 * 60 * 1000),
    maxAge: exports.accessTokenExpire * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'none',
    secure: true
};
exports.refreshTokenOptions = {
    expires: new Date(Date.now() + exports.refreshTokenExpire * 24 * 60 * 60 * 1000),
    maxAge: exports.refreshTokenExpire * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'none',
    secure: true
};
const sendToken = (user, statusCode, res) => {
    const accessToken = user.SignAccessToken();
    const refreshToken = user.SignRefreshToken();
    // upload session to redis
    redis_1.redis.set(user._id, JSON.stringify(user));
    // parse enviaroment variables to intregate with fallback values
    if (process.env.NODE_ENV === 'production') {
        exports.accessTokenOptions.secure = true;
    }
    res.cookie("refresh_token", refreshToken, exports.refreshTokenOptions);
    res.cookie("access_token", accessToken, exports.accessTokenOptions);
    res.status(statusCode).json({ success: true, user, accessToken });
};
exports.sendToken = sendToken;
