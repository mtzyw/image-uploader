import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

// 注册新用户
// 支持可选参数 dailyLimit（每日限额）和 totalLimit（总限额），不传则用表的默认值
export async function registerUser({
  id,
  cardNumber,
  cardValidDays,
  dailyLimit,
  totalLimit,
}) {
  await db.insert(users).values({
    id,
    cardNumber,
    cardValidDays,
    // 下面两个若为 undefined 则交给 DEFAULT 处理
    ...(dailyLimit !== undefined
      ? { downloadLimit: dailyLimit }
      : {}),
    ...(totalLimit !== undefined
      ? { totalDownloadLimit: totalLimit }
      : {}),
    // cardFirstUsedAt / cardExpiresAt / dailyDownloads / dailyDownloadsDate / totalDownloads
    // 都由数据库在默认值或业务逻辑中维护
  });
}

// 查询用户：根据卡号
export async function findUserByCardNumber(cardNumber) {
  const [user] = await db
    .select()            // 可改为 .select({ …fields }) 精选字段
    .from(users)
    .where(eq(users.cardNumber, cardNumber))
    .limit(1);

  return user || null;
}
