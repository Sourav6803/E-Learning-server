import express from "express";
import { authorizeRoles, isAuthinticated } from "../middleware/auth";
import { createOrder } from "../controllers/order.controller";
import { getNotification, updateNotification } from "../controllers/notification.controller";
import { updateAccessToken } from "../controllers/user.controller";
const notificationRouter = express.Router()


notificationRouter.get("/get-all-notifications",updateAccessToken, isAuthinticated,authorizeRoles('admin'), getNotification)
notificationRouter.put("/update-notifications/:id",updateAccessToken, isAuthinticated,authorizeRoles('admin'), updateNotification)


export default notificationRouter