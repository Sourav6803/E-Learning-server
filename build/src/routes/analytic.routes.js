"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const analytic_controller_1 = require("../controllers/analytic.controller");
const analyticRouter = express_1.default.Router();
analyticRouter.get("/get-user-analytic", auth_1.isAuthinticated, (0, auth_1.authorizeRoles)('admin'), analytic_controller_1.getUserAnalytic);
analyticRouter.get("/get-course-analytic", auth_1.isAuthinticated, (0, auth_1.authorizeRoles)('admin'), analytic_controller_1.getCourserAnalytic);
analyticRouter.get("/get-order-analytic", auth_1.isAuthinticated, (0, auth_1.authorizeRoles)('admin'), analytic_controller_1.getOrderAnalytic);
exports.default = analyticRouter;
