require("dotenv").config();
import mongoose, {Document, Model, Schema} from "mongoose";
import bcrypt from "bcryptjs"
import jwt, { Secret } from "jsonwebtoken";

const emailRegxPattern : RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IUser extends Document{
    name: string;
    email: string;
    password: string;
    avatar: {
        public_id: string,
        url: string
    }
    role: string;
    isVerified: Boolean;
    courses: Array <{courseId: string}>;
    comparePassword: (password: string) => Promise<boolean>;
    SignAccessToken:()=>string;
    SignRefreshToken:()=>string
}

const userScheema: Schema<IUser> = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter your Name"]
    },
    email: {
        type: String, 
        validator: function(value: string){
            return emailRegxPattern.test(value)
        },
        message: "Enter a valid Email",
        unique: true
    },
    password: {
        type: String,
        minlength: [6, "Password must be 6 character"],
        select: false
    },
    avatar: {
        public_id: String,
        url: String
    },
    role: {
        type: String,
        default: 'user'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    courses: [
        {
            courseId: String
        }
    ]
},{timestamps: true});

userScheema.pre<IUser>('save', async function(next){
    if(!this.isModified('password')){
        next()
    }
    this.password = await bcrypt.hash(this.password, 10)
})

userScheema.methods.SignAccessToken = function () {
    return jwt.sign({ id: this._id}, process.env.ACCESS_TOKEN || '', {expiresIn: '5m'});
  };

userScheema.methods.SignRefreshToken = function () {
    return jwt.sign({ id: this._id}, process.env.REFRESH_TOKEN || '', {expiresIn: '3d'});
  };
// compare password
userScheema.methods.comparePassword = async function (enteredPassword:string) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const userModel: Model<IUser> = mongoose.model("User", userScheema);
export default userModel;