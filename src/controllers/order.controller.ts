require("dotenv").config();
import { NextFunction, Request, Response, Express } from "express";
import userModel, { IUser } from "../models/user.model";
import { catchasyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendmailer";
import CourseModel, { ICourse } from "../models/course.model";
import orderModel, { IOrder } from "../models/orderModel";
import notificationModel from "../models/notificationModel";
import { getAllOrderService, newOrder } from "../services/order.servise";
import { redis } from "../utils/redis";

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

 interface IGetUserAuthInfoRequest extends Request {
  user: IUser // or any other type
}

export const createOrder = catchasyncError(
  async (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
    try {
      const { courseId, payment_info } = req.body as IOrder;

      if(payment_info){
        if("id" in payment_info){
          const paymentIntentId = payment_info.id;
          const paymentIntent = await stripe.paymentIntents.retrieve(
            paymentIntentId
          )
          if(paymentIntent.status !== "succeeded"){
            return next(new ErrorHandler ("Payment not Authorized", 400))
          }
        }
      }
      const user = await userModel.findById(req.user?._id);
      const courseExistInUser = user?.courses.some(
        (course: any) => course._id.toString() === courseId.toString()
      );
      if (courseExistInUser) {
        return next(new ErrorHandler("You already purchase the course", 400));
      }

      const course = await CourseModel.findById(courseId);
      
      if (!course) {
        return next(new ErrorHandler("YCourse not found", 404));
      }

      const data: any = {
        courseId: course._id,
        userId: user?._id,
        payment_info  
      };

      

      const mailData = {
        order: {
          _id: course?._id.toString().slice(0,6),
          name: course?.name,
          price: course?.price,
          date: new Date().toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        },
      };

      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/order-confirmation.ejs"),
        { order: mailData }
      );

      try {
        if (user) {
          await sendMail({
            email: user.email,
            subject: "Order Confirmation",
            template: "order-confirmation.ejs",
            data: mailData,
          });
        }
      } catch (err: any) {
        return next(new ErrorHandler(err.message, 500));
      }

      user?.courses.push(course?._id as any);

      await redis.set(req?.user?._id, JSON.stringify(user))

      await user?.save()

      await notificationModel.create({
        userId: user?._id,
        title: "New order",
        message: `You have a new order from ${course?.name}`
      })
      
      course.purchased = course?.purchased + 1
      await course.save()
    
      newOrder(data, res, next);
      
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);



export const getAllOrders = catchasyncError(async(req:Request,res:Response, next:NextFunction)=>{
  try{
    getAllOrderService(res)
  }
  catch(err:any){
    return next(new ErrorHandler(err.message,500))
  }
})

// send stripe publishleble keys

export const sendStripePublishableKey = catchasyncError(async(req:Request, res:Response, next:NextFunction)=>{
  try{
      res.status(200).json({
        publishablekey: process.env.STRIPE_PUBLISHABLE_KEY
      })
  }
  catch(err:any){
    return next(new ErrorHandler(err.message,500))
  }
})

export const newPayment = catchasyncError(async(req:Request, res:Response, next:NextFunction)=>{
  try{
    const myPaymet =  await stripe.paymentIntents.create({
      amount: req?.body?.amount,
      currency: "inr",
      metadata: {
        company: "Jamalpur_Baazar",
      },
      automatic_payment_methods: {
        enabled:true
      }
    });
    console.log(myPaymet)

    res.status(201).json({
      success: true,
      client_secret: myPaymet.client_secret,
    });
  }
  catch(err:any){
    return next(new ErrorHandler(err.message,500))
  }
})