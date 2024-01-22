import { Response, NextFunction } from "express";
import { catchasyncError } from ".././middleware/catchAsyncError";
import orderModel from "../models/orderModel";


//create new order

export const newOrder = catchasyncError(async(data:any,res: Response, next:NextFunction)=>{
    const order = await orderModel.create(data)
    res.status(201).json({success: true, order})
})

export const getAllOrderService = async (res: Response) => {
    const orders = await orderModel.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  };