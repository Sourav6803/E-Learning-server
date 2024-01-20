import { NextFunction, Response } from "express";
import userModel from "../models/user.model";
import { redis } from "../utils/redis";
import { catchasyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";

export const getuserById = async (id: string, res: Response) => {
  const userJson = await redis.get(id);
  
  if (userJson) {
    const user = JSON.parse(userJson);
    res.status(200).json({ success: true, user });
  }
};

export const getAllUsersService = async (res: Response) => {
  const users = await userModel.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, users });
};

export const updateUsersRoleService = async (res: Response, id: string, role:string) => {
  const user = await userModel.findByIdAndUpdate(id, {role},{new:true})
  res.status(200).json({ success: true, user });
};

