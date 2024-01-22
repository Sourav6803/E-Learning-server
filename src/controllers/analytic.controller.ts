require("dotenv").config();
import { NextFunction, Request, Response, Express } from "express";
import userModel from "../models/user.model";
import { catchasyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import { generateLast12MonthsData } from "../utils/analytic.generator";
import orderModel from "../models/orderModel";
import CourseModel from "../models/course.model";

// user analytic only for admin
export const getUserAnalytic = catchasyncError(async(req: Request, res: Response, next: NextFunction)=>{
    try{
        const users = await generateLast12MonthsData(userModel)
        res.status(200).json({success:true, users})
    }
    catch (err: any) {
        return next(new ErrorHandler(err.message, 500));
      }
})


export const getCourserAnalytic = catchasyncError(async(req: Request, res: Response, next: NextFunction)=>{
    try{
        const course = await generateLast12MonthsData(CourseModel as any)
        res.status(200).json({success:true, course})
    }
    catch (err: any) {
        return next(new ErrorHandler(err.message, 500));
      }
})

export const getOrderAnalytic = catchasyncError(async(req: Request, res: Response, next: NextFunction)=>{
    try{
        const order = await generateLast12MonthsData(orderModel)
        res.status(200).json({success:true, order})
    }
    catch (err: any) {
        return next(new ErrorHandler(err.message, 500));
      }
})

