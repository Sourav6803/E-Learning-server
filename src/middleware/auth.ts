require("dotenv").config()
import { Request, Response, NextFunction } from "express";
import { catchasyncError } from "./catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, {  JwtPayload  } from "jsonwebtoken"
import { redis } from "../utils/redis";
import { IUser } from "../models/user.model";

// interface IGetUserAuthInfoRequest extends Request {
//     user: IUser // or any other type
//   }

  declare module 'express-serve-static-core' {
    interface Request {
        user: IUser
    }
}

export const isAuthinticated = catchasyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try{
        
        const access_token = req.cookies.access_token;
        
        if(!access_token){
            return next(new ErrorHandler("Please login to access this resource", 400))
        }
 
        const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string) as JwtPayload
        if(!decoded){
            return next(new ErrorHandler("Access token is not valid", 400))
        }

        const user = await redis.get(decoded.id)
        
        if(!user){
            return next(new ErrorHandler("Please login ", 400))
        }

        

        req.user = JSON.parse(user);

        next()
    }
    catch(err: any){
        return next(new ErrorHandler(err.message, 400));
    }
})


export const authorizeRoles = (...roles: string[])=>{
    return(req:Request,res: Response,next: NextFunction) => {
        if(!roles.includes(req?.user?.role || '')){
            return next(new ErrorHandler(`Role ${req.user?.role} is not allowed to access this resource.`,403))
        }
        next()
    }
}