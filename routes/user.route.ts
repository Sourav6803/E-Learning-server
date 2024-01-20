import express from "express";
import { activateUser, deleteUser, getAllUsers, getUserInfo, logOut, loginUser, registrationUser, socialauth, updateAccessToken, updatePassword, updateProfilePicture, updateUserInfo, updateUserRole } from "../controllers/user.controller";
import { authorizeRoles, isAuthinticated } from "../middleware/auth";
const userRouter = express.Router()

userRouter.post('/registration', registrationUser)
userRouter.post('/activate-user', activateUser)
userRouter.post('/login', loginUser)
userRouter.get('/logout',updateAccessToken,isAuthinticated, logOut)
userRouter.get("/refreshtoken", updateAccessToken )
userRouter.get("/me",updateAccessToken, isAuthinticated,  getUserInfo )
userRouter.post("/social-auth", socialauth)
userRouter.put("/update-user-info",updateAccessToken,  isAuthinticated, updateUserInfo)
userRouter.put("/update-user-password",updateAccessToken, isAuthinticated, updatePassword)
userRouter.put("/update-user-profileImage",updateAccessToken, isAuthinticated, updateProfilePicture)


userRouter.get("/get-users",updateAccessToken, isAuthinticated, authorizeRoles('admin'), getAllUsers)
userRouter.put("/update-user-role",updateAccessToken, isAuthinticated, authorizeRoles('admin'), updateUserRole)
userRouter.delete("/delete-user/:id",updateAccessToken,  isAuthinticated, authorizeRoles('admin'), deleteUser)

export default userRouter