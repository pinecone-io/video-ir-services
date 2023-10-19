import { createClient } from "redis";

const redis = createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379')
    }
});


redis.on("error", (err) => console.log("Redis Client Error", err));

await redis.connect();

export default redis;
