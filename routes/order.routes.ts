import express from "express";
import { authorizeRoles, isAuthinticated } from "../middleware/auth";
import { createOrder, getAllOrders, newPayment, sendStripePublishableKey } from "../controllers/order.controller";
import { updateAccessToken } from "../controllers/user.controller";
const orderRouter = express.Router()


orderRouter.post("/create-order",updateAccessToken, isAuthinticated, createOrder)
orderRouter.get("/get-orders",updateAccessToken, isAuthinticated, authorizeRoles('admin'), getAllOrders)
orderRouter.get("/payment/stripepublishablekey", sendStripePublishableKey)
orderRouter.post("/payment",updateAccessToken, isAuthinticated, newPayment)

export default orderRouter