require("dotenv").config();
import { NextFunction, Request, Response } from "express";
import { catchasyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendmailer";
import cloudinary from "cloudinary";
import { createCourse, getAllCoursesService } from "../services/course.service";
import CourseModel from "../models/course.model";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import notificationModel from "../models/notificationModel";
import cron from "node-cron";
import axios from "axios";
import userModel, { IUser } from "../models/user.model";

interface IGetUserAuthInfoRequest extends Request {
  user: IUser // or any other type
}



export const uploadCourse = catchasyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;
      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      createCourse(data, res, next);
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

export const editCourse = catchasyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const courseId = req.params.id;
      const thumbnail = data?.thumbnail;
      const thumbnilUrl = thumbnail?.url
      

      const courseData = await CourseModel.findById(courseId) as any

      if(thumbnilUrl === undefined && !thumbnail.startsWith("https")){
        
        await cloudinary.v2.uploader.destroy(courseData.thumbnail.public_id);

        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      if (thumbnilUrl && thumbnilUrl.startsWith("https") ) {

        data.thumbnail = {
          public_id: courseData?.thumbnail?.public_id,
          url: courseData?.thumbnail?.url
      }
    }
      

      
      const course = await CourseModel.findByIdAndUpdate(
        courseId,
        { $set: data },
        { new: true }
      );
      res.status(201).json({ success: true, course });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

// get single course --without purchasing

export const getSingleCourse = catchasyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const isCachedExist = await redis.get(courseId);

      if (isCachedExist) {
        const course = JSON.parse(isCachedExist);

        res.status(200).json({ success: true, course });
      } else {
        const course = await CourseModel.findById(req.params.id).select(
          "-courseData.videoUrl -courseData.suggestion -courseData.question -courseData.links"
        );

        res.status(200).json({ success: true, course });

        await redis.set(courseId, JSON.stringify(course), "EX", 604800);
      }
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

// get all course --without purchasing

export const getAllCourse = catchasyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {

      const courses = await CourseModel.find().select(
        "-courseData.videoUrl -courseData.suggestion -courseData.question -courseData.links"
      );
      res.status(200).json({ success: true, courses });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

// get course content only for valid user
export const getCourseByUser = catchasyncError(
  async (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;

      const corseExit = userCourseList?.find(
        (course: any) => course._id.toString() === courseId
      );
      if (!corseExit) {
        return next(
          new ErrorHandler("You are not eligable to access this course", 500)
        );
      }

      const course = await CourseModel.findById(courseId);
      const content = course?.courseData;

      res.status(200).json({ success: true, content });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

// add question on course

interface IAddQuestionData {
  question: String;
  courseId: String;
  contentId: string;
}

export const addQuestion = catchasyncError(
  async (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId }: IAddQuestionData = req.body;
      const course = await CourseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      const courseContent = course?.courseData.find((item: any) =>
        item._id.equals(contentId)
      );
      if (!courseContent) {
        return next(new ErrorHandler("This content not exist", 400));
      }

      //create a new question object

      const newQuestion: any = {
        user: req?.user,
        question,
        questionReplies: [],
      };

      // add this question on course content
      courseContent.question.push(newQuestion);

      await notificationModel.create({
        userId: req?.user?._id,
        title: "New Question recived",
        message: `You have a new question in ${courseContent?.title}`,
      });

      await course?.save();

      res.status(200).json({ success: true, course });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

interface IAddAnswerData {
  answer: String;
  courseId: String;
  contentId: string;
  questionId: string;
}

export const addAnswer = catchasyncError(
  async (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, contentId, questionId }: IAddAnswerData =
        req.body;

      const course = await CourseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      const courseContent = course?.courseData.find((item: any) =>
        item._id.equals(contentId)
      );
      if (!courseContent) {
        return next(new ErrorHandler("This content not exist", 400));
      }

      const qustion = courseContent?.question.find((item: any) =>
        item._id.equals(questionId)
      );
      if (!qustion) {
        return next(new ErrorHandler("Invalid question Id", 400));
      }

      const newAnswer: any = {
        user: req.user,
        answer,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      qustion.questionReplies?.push(newAnswer);

      await course?.save();
      if (req.user?._id === qustion.user._id) {
        // create a notification
        await notificationModel.create({
          userId: req.user?._id,
          title: "New Question_reply recived",
          message: `You have a new order from ${courseContent?.title}`,
        });
      } else {
        const data = {
          name: qustion.user.name,
          title: courseContent.title,
        };

        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/question-reply.ejs"),
          data
        );

        try {
          await sendMail({
            email: qustion.user.email,
            subject: "Question reply",
            template: "question-reply.ejs",
            data,
          });
        } catch (err: any) {
          return next(new ErrorHandler(err.message, 400));
        }
      }

      res.status(200).json({ success: true, course });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

interface IAddReviewData {
  review: string;
  courseId: string;
  rating: number;
  userId: string;
}

export const addReview = catchasyncError(
  async (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;

      const courseExists = userCourseList?.some(
        (course: any) => course._id.toString() === courseId.toString()
      );

      if (!courseExists) {
        return next(
          new ErrorHandler("You are not eligible for this course", 400)
        );
      }

      const course = await CourseModel.findById(courseId);
      const { review, rating } = req.body as IAddReviewData;

      const reviewData: any = {
        user: req.user,
        comment: review,
        rating,
      };

      course?.reviews.push(reviewData);

      let avg = 0;

      course?.reviews.forEach((rev: any) => {
        avg += rev.rating;
      });

      if (course) {
        course.rating = avg / course.reviews.length;
      }

      await course?.save();

      await redis.set(courseId, JSON.stringify(course), "EX", 604800)

     

      // create notfication
      // await notificationModel.create({
      //   user: req.user._id,
      //   title: "New Review recived",
      //   message: `${req.user.name} has given a review in ${course.name}`
      // })

      res.status(200).json({ success: true, course });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

// add reply to review
interface IAddReviewData {
  comment: string;
  courseId: string;
  reviewId: string;
}

export const addReplyToReview = catchasyncError(
  async (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
    try {
      const { comment, courseId, reviewId } = req.body as IAddReviewData;
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 400));
      }

      const review = course?.reviews?.find(
        (rev: any) => rev._id.toString() === reviewId
      );
      if (!review) {
        return next(new ErrorHandler("Review not found", 400));
      }

      const replyData: any = {
        user: req.user,
        comment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (!review.commentReplies) {
        review.commentReplies = [];
      }
      review.commentReplies.push(replyData);

      await course?.save();

      await redis.set(courseId, JSON.stringify(course), 'EX', 604800)

      res.status(200).json({ success: true, course });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

// delete notification
cron.schedule("0 0 0 * * *", async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await notificationModel.deleteMany({
    status: "read",
    createdAt: { $lt: thirtyDaysAgo },
  });
  console.log("Delete read notification");
});

// for admin
export const getAdminAllCourses = catchasyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllCoursesService(res);
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

export const deleteCourse = catchasyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const course = await CourseModel.findById(id);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      await course.deleteOne({ id });
      await redis.del(id);
      res
        .status(200)
        .json({ success: true, message: "Course deleted successfully" });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

// generate video url

export const generateVideoUrl = catchasyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { videoId } = req.body;
      
      const response = await axios.post(
        `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
        { ttl: 300 },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Apisecret ${process.env.VDOCHIPHER_API_SECRET}`,
          },
        }
      );

      res.json(response.data);
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);
