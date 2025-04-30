// src/middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  // 1. 检查 Authorization 头
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未携带 Token 或格式错误' });
  }

  const token = authHeader.split(' ')[1]; // 只取 Bearer 后面的 token

  try {
    // 2. 验证 token
    const decoded = jwt.verify(token, JWT_SECRET);

    // 3. 把用户信息挂到 req.user，后续接口可以用
    req.user = decoded;

    next(); // 继续执行下一个中间件或接口处理函数
  } catch (err) {
    return res.status(401).json({ code: 401, message: 'Token 无效或已过期' });
  }
}
