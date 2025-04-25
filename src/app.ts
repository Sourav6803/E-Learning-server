require('dotenv').config()
import express, { NextFunction, Request, Response } from 'express';
export const app = express();
import cors from 'cors';
import multer from 'multer'
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ErrorMiddlware } from './middleware/error';
import userRouter from './routes/user.route';
import courseRouter from './routes/course.Routes';
import orderRouter from './routes/order.routes';
import notificationRouter from './routes/notificatio.routes';
import analyticRouter from './routes/analytic.routes';
import layoutRoutes from './routes/layout.routes';
import { rateLimit } from 'express-rate-limit'



app.use(express.json({limit: '50mb'}));
app.use(helmet())
app.use(cookieParser())
app.use(multer().any())

// app.use(cors({
//     origin: ["https://e-learning-frontend-one.vercel.app"],
//     credentials: true
// }));
app.use(cors({
    origin: ["http://localhost:3000", "https://e-learning-frontend-one.vercel.app"],
    credentials: true
}));



// origin: ["https://e-learning-frontend-8sr0iytv6-sourav6803.vercel.app"],
//https://e-learning-frontend-11mga87bd-sourav6803.vercel.app/

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	// store: ... , // Use an external store for consistency across multiple server instances.
})

app.use("/api/v1", userRouter)
app.use("/api/v1", courseRouter)
app.use("/api/v1", orderRouter)
app.use("/api/v1", notificationRouter)
app.use("/api/v1", analyticRouter)
app.use("/api/v1", layoutRoutes)

app.get("/test", (req:Request, res: Response, next:NextFunction)=> {
    res.status(200).json({success: true, message: "Welocome to LMS"})
})

app.all('*', (req:Request, res:Response, next:NextFunction)=>{
    const err = new Error(`Route ${req.originalUrl} not found`) as any
    err.statusCode = 404
    next(err)
})
// app.use(limiter)
app.use(ErrorMiddlware);
