const { createClient } = require('redis');

const redisClient = createClient({
    socket: {
        host: process.env.REDIS_HOST,
        // host: '127.0.0.1',
        port: process.env.REDIS_PORT,
    },
    password: process.env.REDIS_PASSWORD,
});

redisClient.connect().catch(console.error);

module.exports = redisClient;