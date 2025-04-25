import {Redis} from "ioredis"

require("dotenv").config()

console.log(process.env.REDIS_URL)

const redisClient = () => {
    if(process.env.REDIS_URL){
        console.log(`Redis connected....`)
        return  process.env.REDIS_URL 
    }
    throw new Error('Redis connection Failed')
}

// "redis://default:752ea426362345c58ec906c711be0267@direct-bonefish-34145.upstash.io:34145"

 export const redis = new Redis(redisClient())



// import Redis from "ioredis";
// import dotenv from "dotenv";

// dotenv.config();

// const redisClient = () => {
//   if (process.env.REDIS_URL) {
//     console.log(`Connecting to Redis...${process.env.REDIS_URL}` , );
//     return new Redis(process.env.REDIS_URL, {
//       retryStrategy(times) {
//         const delay = Math.min(times * 50, 2000);
//         return delay; // Reconnect with an incremental delay
//       },
//       reconnectOnError(err) {
//         console.error("Redis reconnecting due to error: ", err.message);
//         return true; // Enable automatic reconnection
//       },
//       maxRetriesPerRequest: 5, // Optional: Set a retry limit for each request
//     });
//   }
//   throw new Error("REDIS_URL is not defined. Redis connection failed.");
// };

// export const redis = redisClient();

