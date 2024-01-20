import { Response } from "express";
import userModel from "../models/user.model";
import { redis } from "../utils/redis";
import CourseModel from "../models/course.model";
import { catchasyncError } from "../middleware/catchAsyncError";


export const createCourse = catchasyncError(async(data:any, res:Response)=>{
    const course = await CourseModel.create(data)
    res.status(201).json({success:true, course})
})


export const getAllCoursesService = async (res: Response) => {
    const courses = await CourseModel.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, courses });
  };
