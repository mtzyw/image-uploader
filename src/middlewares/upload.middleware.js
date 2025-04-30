import multer from 'multer';
import path from 'path';
import fs from 'fs';

// 自动创建 uploads 文件夹
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 存储规则
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // 上传目录
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename); // 文件名：时间戳+随机数+原始扩展名
  }
});

// 不做 fileFilter，允许任意类型
export const uploadMiddleware = multer({
  storage,
});
