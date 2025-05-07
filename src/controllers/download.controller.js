import { downloadQueue } from '../queues/downloadQueue.js';

export async function submitDownloadTask(req, res) {
  const { id, type } = req.body;
  const userId = req.user?.id;

  if (!id || !type) {
    return res.status(400).json({ code: 1, message: '参数缺失' });
  }

  const job = await downloadQueue.add('download-task', { id, type, userId });

  return res.status(200).json({
    code: 0,
    message: '任务已提交',
    data: {
      taskId: job.id
    }
  });
}
