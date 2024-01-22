import express from "express";
import { authorizeRoles, isAuthinticated } from "../middleware/auth";
import { createLayout, editLayout, getLayoutByType } from "../controllers/layout.controller";
import { updateAccessToken } from "../controllers/user.controller";


const layoutRoutes = express.Router()

layoutRoutes.post("/create-layout",updateAccessToken, isAuthinticated, authorizeRoles('admin'), createLayout)
layoutRoutes.put("/edit-layout",updateAccessToken, isAuthinticated, authorizeRoles('admin'), editLayout)
layoutRoutes.get("/get-layout/:type", getLayoutByType)

export default layoutRoutes