import dotenv from 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';
import { findUserByCardNumber, registerUser } from '../services/card.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const DEFAULT_VALID_DAYS = 30;   // 默认有效天数
const DEFAULT_DAILY_LIMIT = 25;  // 每日下载上限
const DEFAULT_TOTAL_LIMIT = 750;   // 不限制总下载次数

// 注册接口
export async function cardController(req, res) {
  const { cardNumber } = req.body;

  if (!cardNumber) {
    return res.status(400).json({ code: 1, message: '卡号不能为空' });
  }

  // 检查是否已存在
  const existing = await findUserByCardNumber(cardNumber);
  if (existing) {
    return res.status(409).json({ code: 1, message: '卡号已存在' });
  }

  // 新建用户
  const id = uuidv4();
  await registerUser({
    id,
    cardNumber,
    cardValidDays: DEFAULT_VALID_DAYS,
    dailyLimit: DEFAULT_DAILY_LIMIT,
    totalLimit: DEFAULT_TOTAL_LIMIT,
  });

  return res.status(200).json({
    code: 0,
    message: '注册成功',
    data: { id, cardNumber },
  });
}

// 登录接口
export async function cardLogin(req, res) {
  const { cardNumber } = req.body;

  if (!cardNumber) {
    return res.status(400).json({ code: 1, message: '卡号不能为空' });
  }

  // 查用户（返回的 user 包含所有字段）
  const user = await findUserByCardNumber(cardNumber);
  if (!user) {
    return res.status(404).json({ code: 1, message: '卡号不存在' });
  }

  // 签发 Token
  const token = jwt.sign(
    { id: user.id, cardNumber: user.cardNumber },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // 返回 user 所有字段 + token
  return res.status(200).json({
    code: 0,
    message: '登录成功',
    data: {
      ...user,   // 把 id, cardNumber, cardValidDays, cardFirstUsedAt, cardExpiresAt, downloadLimit, dailyDownloads, …等都返回
      token,     // 新增 token 字段
    },
  });
}
//通过card查询当前用户信息
/**
 * GET /api/user/:cardNumber
 * 根据卡号返回完整用户信息（不包含 token）
 */
export async function getUserInfoByCard(req, res) {
  const { cardNumber } = req.params;

  if (!cardNumber) {
    return res.status(400).json({ code: 1, message: '卡号不能为空' });
  }

  try {
    const user = await findUserByCardNumber(cardNumber);
    if (!user) {
      return res.status(404).json({ code: 1, message: '用户不存在' });
    }
    // 不返回敏感字段（如密码等），这里只是示例，Drizzle schema 中并未存密码
    return res.status(200).json({
      code: 0,
      message: '查询成功',
      data: user,
    });
  } catch (err) {
    console.error('查询用户信息失败：', err);
    return res.status(500).json({ code: 1, message: '服务器错误' });
  }
}