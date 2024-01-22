import express from "express";
import { authorizeRoles, isAuthinticated } from "../middleware/auth";
import { getCourserAnalytic, getOrderAnalytic, getUserAnalytic } from "../controllers/analytic.controller";
const analyticRouter = express.Router()


analyticRouter.get("/get-user-analytic", isAuthinticated, authorizeRoles('admin'), getUserAnalytic)
analyticRouter.get("/get-course-analytic", isAuthinticated, authorizeRoles('admin'), getCourserAnalytic)
analyticRouter.get("/get-order-analytic", isAuthinticated, authorizeRoles('admin'), getOrderAnalytic)


export default analyticRouter