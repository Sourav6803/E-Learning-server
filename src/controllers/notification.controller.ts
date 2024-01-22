require("dotenv").config();
import { NextFunction, Request, Response, Express } from "express";
import notificationModel from "../models/notificationModel";
import { catchasyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";


export const getNotification =catchasyncError(async(req:Request, res:Response, next:NextFunction)=>{
    try{
        const notification = await notificationModel.find().sort({createdAt: -1});

        res.status(200).json({succes:true, notification})
    }
    catch(err:any){
        return next(new ErrorHandler(err.message, 500))
    }
})


export const updateNotification = catchasyncError(async(req:Request,res:Response, next:NextFunction)=>{
    try{
        const notfication = await notificationModel.findById(req.params.id)
        if(notfication){
            notfication?.status ? notfication.status = "read" : notfication?.status
        }

        await notfication?.save()

        res.status(200).json({success:true, notfication})
        
    }
    catch(err:any){
        return next(new ErrorHandler(err.message, 500))
    }
})

export const deletenotification = catchasyncError(async(req:Request,res:Response, next:NextFunction)=>{
    try{

    }
    catch(err:any){
        return next(new ErrorHandler(err.message, 500))
    } 
})