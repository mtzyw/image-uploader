import { downloadQueue } from '../queues/downloadQueue.js';

// ✅ 主控制器
// 🚀 下载任务不再直接下载，而是添加进队列
export async function proxyFreepikDownload(req, res) {
  const { id, type,sourceUrl} = req.body;
  const userId = req.user.id;
  console.log(sourceUrl)
  if (!id || !type) {
    return res.status(400).json({ code: 1, message: '缺少 resource-id 或 type' });
  }

  try {
    // ✅ 添加下载任务到队列
    const job = await downloadQueue.add('freepik-download', {
      id,
      type,
      userId,
      sourceUrl,
    });

    return res.status(200).json({
      code: 0,
      message: '任务已提交',
      data: {
        taskId: job.id
      }
    });
  } catch (err) {
    console.error('❌ 添加任务失败:', err);
    return res.status(500).json({ code: 1, message: '服务器内部错误' });
  }
}