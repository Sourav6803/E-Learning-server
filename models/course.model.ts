require("dotenv").config();
import mongoose, {Document, Model, Schema} from "mongoose";
import { IUser } from "./user.model";


interface IComment {
    user: IUser,
    question: string,
    questionReplies?: IComment[]
}

interface IReview {
    user: IUser;
    rating: number;
    comment: string;
    commentReplies: IComment[]
}

interface ILink {
    rating: number;
    title: string;
    url: string; 
}

interface ICourseData{
    title:string;
    description: string;
    videoUrl: string;
    videoThumbnil: object;
    videoSection: string;
    videoLength: number;
    videoPlayer: string;
    links: ILink[];
    suggestion: string;
    question: IComment[];
}

export interface ICourse{
    name: string;
    description: string;
    categories: string,
    price: number;
    estimatedPrice?: number;
    thumbnail: object;
    tags: string;
    level: string;
    demoUrl: string;
    benifits: {title: string}[];
    reviews: IReview[];
    courseData: ICourseData[];
    rating?: number;
    purchased: number;
    prerequisites: {title: string}[];

}

const reviewScheema = new Schema<IReview>({
    user: Object,
    rating: {
        type: Number,
        default: 0
    },
    comment: String,
    commentReplies: [Object]
},{timestamps:true})

const linkSchema = new Schema<ILink>({
    title: String,
    url: String
})

const commentSchema = new Schema<IComment>({
    user: Object,
    question: String,
    questionReplies: [Object]
},{timestamps:true})

const courseDataSchema = new Schema<ICourseData>({
    videoUrl: String,
    title: String,
    videoSection: String,
    description: String,
    videoLength: Number,
    videoPlayer: String,
    links: [linkSchema],
    suggestion: String,
    question: [commentSchema]
})

const courseSchema = new Schema<ICourse>({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    categories: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    estimatedPrice: {
        type: Number,
    },
    thumbnail: {
        public_id: {
            // required: true ,
            type: String,
        },
        url: {
            // required: true,
            type: String
        }
    },
    tags: {
        type: String,
        required: true
    },
    level: {
        type: String,
        required: true
    },
    demoUrl: {
        type: String,
        required: true
    },
    benifits: [{title: String}],
    prerequisites:  [{title: String}],
    
    reviews: [reviewScheema],
    courseData: [courseDataSchema],
    rating: {
        type: Number,
        default: 0
    },
    purchased: {
        type: Number,
        default: 0
    }

}, {timestamps:true})

const CourseModel:Model<ICourse> = mongoose.model("Course", courseSchema)
export default CourseModel

