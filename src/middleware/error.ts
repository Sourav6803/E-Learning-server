
import  { NextFunction, Request, Response } from 'express';
import ErrorHandler from "../utils/ErrorHandler";

export const ErrorMiddlware = (err:any,req:Request,res: Response,next: NextFunction)=>{
    err.statusCode = err.statusCode || 500
    err.message = err.message || "Internal server error"

    // wrong mongodb id error
    if(err.name === "castError"){
        const message = `Resourses not found with this ID... Invalid ${err.path}`;
        err = new ErrorHandler(message, 400);
    }

    // duplicate key error
    if(err.code === 11000){
        const message = `Duplicate key ${Object.keys(err.keyValue)} Entered`;
        err = new ErrorHandler(message, 400);
    }

    // wrong jwt error
    if(err.name === "JsonWebTokenError"){
        const message = `Your URL is invalid please try again letter`;
        err = new ErrorHandler(message, 400);
    }

    // jwt expired
    if(err.name === "TokenExpiredError"){
        const message = `Your JWT is expired please try again letter`;
        err = new ErrorHandler(message, 400);
    }

    res.status(err.statusCode).json({success: false, message: err.message})
}