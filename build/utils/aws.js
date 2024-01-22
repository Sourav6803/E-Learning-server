"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFile = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
aws_sdk_1.default.config.update({
    accessKeyId: "AKIAQJAOIC75Q2FDGCOY",
    secretAccessKey: "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",
    region: "ap-south-1"
});
const removeFile = async (file) => {
    return new Promise(function (resolve, reject) {
        // this function will upload file to aws and return the link
        let s3 = new aws_sdk_1.default.S3({ apiVersion: '2006-03-01' });
        console.log(file);
        var removeParams = {
            Bucket: "sourav-ekart",
            Key: "lms/" + file,
        };
        s3.deleteObject(removeParams, function (err, data) {
            if (err) {
                console.log("Error during image removed");
                return reject({ "error": err });
            }
            else {
                console.log('Successfully deleted the object from S3.');
            }
        });
    });
};
exports.removeFile = removeFile;
const uploadFile = async (file) => {
    return new Promise(function (resolve, reject) {
        // this function will upload file to aws and return the link
        let s3 = new aws_sdk_1.default.S3({ apiVersion: '2006-03-01' });
        var uploadParams = {
            ACL: "public-read",
            Bucket: "sourav-ekart",
            Key: "lms/" + file?.originalname,
            Body: file?.buffer
        };
        s3.upload(uploadParams, function (err, data) {
            if (err) {
                return reject({ "error": err });
            }
            console.log("File uploaded succesfully");
            return resolve(data?.Location);
        });
    });
};
exports.default = uploadFile;
// // module.exports.removeFile = removeFile
