"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchasyncError = void 0;
const catchasyncError = (theFunc) => (req, res, next) => {
    Promise.resolve(theFunc(req, res, next)).catch(next);
};
exports.catchasyncError = catchasyncError;
