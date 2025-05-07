import { Job } from 'bullmq';
import { downloadQueue } from '../queues/downloadQueue.js'; // ✅ 队列实例

export async function getTaskStatus(req, res) {
  const { id } = req.params;

  try {
    const job = await Job.fromId(downloadQueue, id); // ✅ 改这里

    if (!job) {
      return res.status(404).json({ code: 1, message: '任务不存在' });
    }

    const state = await job.getState();

    return res.status(200).json({
      code: 0,
      data: {
        id: job.id,
        status: state,
        result: job.returnvalue || null,
        failedReason: job.failedReason || null
      }
    });
  } catch (err) {
    return res.status(500).json({
      code: 1,
      message: '查询失败',
      error: err.message
    });
  }
}
