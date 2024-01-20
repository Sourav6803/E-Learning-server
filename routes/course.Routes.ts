import express from "express";
import { authorizeRoles, isAuthinticated } from "../middleware/auth";
import { addAnswer, addQuestion, addReplyToReview, addReview, deleteCourse, editCourse, generateVideoUrl, getAdminAllCourses, getAllCourse, getCourseByUser, getSingleCourse, uploadCourse } from "../controllers/course.controller";
import { updateAccessToken } from "../controllers/user.controller";
const courseRouter = express.Router()

courseRouter.post('/create-course',updateAccessToken,isAuthinticated, authorizeRoles('admin'), uploadCourse)
courseRouter.put('/edit-course/:id',updateAccessToken,isAuthinticated, authorizeRoles('admin'), editCourse)
courseRouter.get("/get-course/:id", getSingleCourse)
courseRouter.get("/get-all-course", getAllCourse)

courseRouter.get("/get-course-content/:id",updateAccessToken, isAuthinticated, getCourseByUser)
courseRouter.put("/add-question",updateAccessToken, isAuthinticated, addQuestion)
courseRouter.put("/add-answer",updateAccessToken, isAuthinticated, addAnswer)
courseRouter.put("/add-review/:id",updateAccessToken, isAuthinticated, addReview)
courseRouter.put("/add-reply",updateAccessToken, isAuthinticated, authorizeRoles('admin'), addReplyToReview)
courseRouter.get("/get-admin-courses",updateAccessToken, isAuthinticated, authorizeRoles('admin'), getAdminAllCourses)
// courseRouter.get("/get-courses",updateAccessToken ,isAuthinticated, authorizeRoles('admin'), getAllCourse)
courseRouter.post("/getVdoCipherOTP",  generateVideoUrl)
courseRouter.delete("/delete-course/:id", updateAccessToken, isAuthinticated, authorizeRoles('admin'), deleteCourse)




export default courseRouter;