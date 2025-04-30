import { v4 as uuidv4 } from 'uuid';
import { saveImageRecord } from '../services/image.js';

// 图片上传控制器
export async function uploadImageController(req, res) {
  const file = req.file;        // multer 提供的上传文件对象
  const userId = req.user.id;   // JWT 鉴权中间件挂在 req.user 上

  // 1. 检查文件是否上传
  if (!file) {
    return res.status(400).json({ code: 1, message: '未上传文件' });
  }

  // 2. 构造图片 URL（注意你是否配置了 app.use('/uploads', express.static(...))）
  const url = `/uploads/${file.filename}`;
  const id = uuidv4();

  // 3. 调用 service 写入数据库
  await saveImageRecord({
    id,
    userId,
    filename: file.filename,
    url
  });

  // 4. 返回结果
  return res.status(200).json({
    code: 0,
    message: '上传成功',
    data: {
      id,
      url,
      filename: file.originalname  // 可选，返回原始文件名给用户
    }
  });
}
