require("dotenv").config();
import { NextFunction, Request, Response, Express } from "express";
import userModel, { IUser } from "../models/user.model";
import { catchasyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendmailer";
import cloudinary from "cloudinary";

import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from "../utils/jwt";
import { redis } from "../utils/redis";
import { getAllUsersService, getuserById, updateUsersRoleService } from "../services/user.service";
import uploadFile, { removeFile } from "../utils/aws";



interface multerFile {
  buffer: Buffer, 
  encoding: string, 
  fieldname: string, 
  mimetype: string, 
  originalname: string, 
  size: number;
};

interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}



export const registrationUser = catchasyncError(
  async (req: Request, res: Response, next: NextFunction):Promise<any> => {
    try {
      const { name, email, password, avatar } = req.body;
      
      const isEmailExist = await userModel.findOne({ email });
      if (isEmailExist) {
        return next(new ErrorHandler("Email already exist", 400));
      }
      
      // const files = req.files as any;
      
      // let myFile
      // if(files){
      //    myFile = files[0] 
      // } 
      // const uploadImage = await uploadFile(myFile)
      // console.log(uploadImage)
  
      //  req.body.avatar = uploadImage as string

       

      const user: IRegistrationBody = {
        name: name,
        email: email,
        password: password,
        // avatar: uploadImage as string,
      };

      

      const activationToken = createActivationToken(user);
      const activationCode = activationToken.activationCode;

      const data = { user: { name: user.name }, activationCode };

      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/activation-mail.ejs"),
        data
      );

      try {
        await sendMail({
          email: user.email,
          subject: "Activate your account",
          template: "activation-mail.ejs",
          data,
        });

        res.status(201).json({
          success: true,
          message: "Please check your email to activate your account",
          activationToken: activationToken.token,
        });
      } catch (err: any) {
        return next(new ErrorHandler(err.message, 400));
      }
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

interface IActivationToken {
  token: string;
  activationCode: string;
}

const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: "5m",
    }
  );

  return { token, activationCode };
};

interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

export const activateUser = catchasyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } =
        req.body as IActivationRequest;

      const newUser: { user: IUser; activationCode: string } = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      ) as { user: IUser; activationCode: string };

      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler("Invalid activation code", 400));
      }

      const { name, email, password , avatar} = newUser.user;
      const existuser = await userModel.findOne({ email });

      if (existuser) {
        return next(new ErrorHandler("Email already exist", 400));
      }

      const user = await userModel.create({ name, email, password , avatar});
     
      return res
        .status(201)
        .json({ success: true, message: "Registration success" });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

interface ILoginrequest {
  email: string;
  password: string;
}

export const loginUser = catchasyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginrequest;

      if (!email || !password) {
        return next(new ErrorHandler("Please Enter Email or Password", 400));
      }

      const user = await userModel.findOne({ email }).select("+password");
      if (!user) {
        return next(new ErrorHandler("Invalid Email or Password", 400));
      }
      const isPasswordMatched = await user.comparePassword(password);
      if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid Email or Password", 400));
      }

      sendToken(user, 200, res);
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const logOut = catchasyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });

      const userid = req.user?._id || "";
      await redis.del(userid);

      res.status(200).json({ success: true, message: "Logout success" });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const updateAccessToken = catchasyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refresh_token as string;
      const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN as string) as JwtPayload;
      

      const message = "Could not refresh";
      if (!decoded) {
        return next(new ErrorHandler(message, 400));
      }

      const session = await redis.get(decoded.id as string);
      if (!session) {
        return next(new ErrorHandler("Please login to access this resourses", 400));
      }

      const user = JSON.parse(session);

      const accessToken = jwt.sign(
        { id: user._id },
        process.env.ACCESS_TOKEN as string,
        { expiresIn: "5m" }
      );

      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN as string,
        { expiresIn: "3d" }
      );

      req.user = user

      res.cookie("access_token", accessToken, accessTokenOptions);
      res.cookie("refresh_token", refreshToken, refreshTokenOptions);

      await redis.set(user._id, JSON.stringify(user), "EX", 604800) //7d

      // res.status(200).json({ success: true, accessToken });
      next()
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const getUserInfo = catchasyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      
      const userId = req.user?._id;
    
      getuserById(userId, res);
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

interface ISocialAuthBody {
  email: string;
  name: string;
  avatar: string;
}

// social auth
export const socialauth = catchasyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, avatar } = req.body as ISocialAuthBody;

      const user = await userModel.findOne({ email });
      if (!user) {
        const newUser = await userModel.create({ email, name, avatar });
        sendToken(newUser, 200, res);
      } else {
        sendToken(user, 200, res);
      }
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

interface IUpdateUserInfo {
  name?: string;
  email?: string;
}

export const updateUserInfo = catchasyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.body as IUpdateUserInfo;
      const userId = req.user?._id;
      const user = await userModel.findById(userId);
      

      if (name && user) {
        user.name = name;
      }

      await user?.save();

      await redis.set(userId, JSON.stringify(user));

      res.status(200).json({ success: true, user });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

interface IUpdatePassword {
    oldPassword : string;
    newPassword: string
}

export const updatePassword = catchasyncError(async(req:Request,res:Response,next: NextFunction)=>{
    const {oldPassword, newPassword} = req.body as IUpdatePassword

    if(!oldPassword || !newPassword){
        return next(new ErrorHandler("Please Enter old & new password", 400))
    }

    const user = await userModel.findById(req.user?._id).select("+password")
    if(user?.password === undefined){
        return next(new ErrorHandler("Invalid user", 400))
    }

    const isPasswordMatched = await user?.comparePassword(oldPassword)
    if(!isPasswordMatched){
        return next(new ErrorHandler("Old password dose't match", 400))
    }
    user.password = newPassword
    await user.save()
    await redis.set(req.user?._id, JSON.stringify(user))

    res.status(200).json({success:true, user})
})

interface IUpdateProfilePicture{
      avatar:{
        public_id: String,
        url: String
    }  
}

export const updateProfilePicture = catchasyncError(async(req:Request, res:Response, next: NextFunction):Promise<any>=>{
    try{
        const {avatar} = req.body ;
        const userId = req.user?._id
        const user = await userModel.findById(userId)

        if( avatar && user){
          if(user?.avatar?.public_id  ){
            await cloudinary.v2.uploader.destroy(user?.avatar?.public_id )
            const myCloud = await cloudinary.v2.uploader.upload(avatar, {folder: "avatars", width: 150})

            user.avatar = {
              public_id: myCloud.public_id,
              url: myCloud.secure_url
            }
          }else{
            const myCloud = await cloudinary.v2.uploader.upload(avatar, {folder: "avatars", width: 150})

            user.avatar = {
              public_id: myCloud.public_id,
              url: myCloud.secure_url
            }
          }
         

          await user?.save()
          await redis.set(req.user?._id, JSON.stringify(user))
          res.status(200).json({success: true, user})
          console.log(user)
        }
    }
    catch (err: any) {
        return next(new ErrorHandler(err.message, 400));
      }
    }
)


export const getAllUsers = catchasyncError(async(req:Request,res:Response, next:NextFunction)=>{
  try{
    getAllUsersService(res)
  }
  catch(err:any){
    return next(new ErrorHandler(err.message,500))
  }
})

 export const updateUserRole = catchasyncError(async(req:Request,res:Response, next:NextFunction)=>{
  try{
    const {id, role} = req.body
    updateUsersRoleService(res,id,role)
  }
  catch(err:any){
    return next(new ErrorHandler(err.message,500))
  }
})

export const deleteUser = catchasyncError(async(req:Request, res:Response, next:NextFunction)=>{
  try{
    const {id}= req.params
    const user = await userModel.findById(id)
    if(!user){
      return next(new ErrorHandler("User not found", 404))
    }
    await user.deleteOne({id})
    await redis.del(id)
    res.status(200).json({success:true, message:"User deleted successfully"})
  }
  catch(err:any){
    return next(new ErrorHandler(err.message, 500))
  }
})