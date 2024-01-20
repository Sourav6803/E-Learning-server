import { NextFunction, Request, Response, Express } from "express";
import { catchasyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import layoutModel from "../models/layout.model";
import cloudinary from "cloudinary";

export const createLayout = catchasyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
      const isTypeExist = await layoutModel.findOne({ type });
      if (isTypeExist) {
        return next(new ErrorHandler(`${type} already exist.`, 400));
      }
      if (type === "Banner") {
        const { image, title, subTitle } = req.body;
        const myCloud = await cloudinary.v2.uploader.upload(image, {
          folder: "layout",
        });
        const banner = {
            type: "Banner",
            banner: {
              image: {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
              },
              title:title,
              subTitle: subTitle,
            },
        };
        
        await layoutModel.create(banner);
      }
      if (type === "FAQ") {
        const { faq } = req.body;
        const faqItems = await Promise.all(
          faq.map(async (item: any) => {
            return {
              question: item.question,
              answer: item.answer,
            };
          })
        );
        await layoutModel.create({ type: "FAQ", faq: faqItems });
      }
      if (type === "Categories") {
        const { categories } = req.body;
        
        const categorytems = await Promise.all(
          categories.map(async (item: any) => {
            return {
              title: item.title,
            };
          })
        );
        await layoutModel.create({
          type: "Categories",
          categories: categorytems,
        });
      }
      res
        .status(201)
        .json({ success: true, message: "Layout create successfully" });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

// Edit layout

export const editLayout = catchasyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
        
      if (type === "Banner") {
        const bannerData :any = await layoutModel.findOne({type: "Banner"})
        const { image, title, subTitle } = req.body;
        

        const data = image?.startsWith("https") ? bannerData : await cloudinary.v2.uploader.upload(image, {
          folder: "layout",
        });

        //  await cloudinary.v2.uploader.destroy(bannerData?.image?.public_id);

        //  const myCloud = await cloudinary.v2.uploader.upload(image, {
        //     folder: "layout",
        //   });

        const banner = {
          type: "Banner",
          image: {
            public_id: image.startsWith("https") ? bannerData.banner.image.public_id : data.public_id,
            url: image.startsWith("https") ? bannerData.banner.image.url : data.secure_url,
          },
          title,
          subTitle,
        };
        console.log(banner)
        await layoutModel.findByIdAndUpdate(bannerData?._id, {banner});
      }
      if (type === "FAQ") {
        const faqItem = await layoutModel.findOne({type:"FAQ"})
        const { faq } = req.body;
        const faqItems = await Promise.all(
          faq.map(async (item: any) => {
            return {
              question: item.question,
              answer: item.answer,
            };
          })
        );
        await layoutModel.findByIdAndUpdate(faqItem?._id,{ type: "FAQ", faq: faqItems });
      }
      if (type === "Categories") {
        const { categories } = req.body;
        const categoryItem = await layoutModel.findOne({type:"Categories"})
        const categorytems = await Promise.all(
          categories.map(async (item: any) => {
            return {
              title: item.title,
            };
          })
        );
        await layoutModel.findByIdAndUpdate(categoryItem?._id,{
          type: "Categories",
          categories: categorytems,
        });
      }
      res
        .status(201)
        .json({ success: true, message: "Layout update successfully" });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);


export const getLayoutByType = catchasyncError(async(req: Request, res: Response, next: NextFunction)=>{
    try{
        const {type} = req.params
        const layout = await layoutModel.findOne({type})
        return res.status(200).json({succes:true, layout})
    }
    catch(err:any){  
        return next(new ErrorHandler(err.message, 500));
    }
})