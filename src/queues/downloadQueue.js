import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// ✅ 设置 maxRetriesPerRequest 为 null
export const connection = new IORedis({
  maxRetriesPerRequest: null
});

export const downloadQueue = new Queue('downloadQueue', {
  connection
});
