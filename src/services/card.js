import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

// 注册新用户
export async function registerUser({ id,cardNumber }) {
    await db.insert(users).values({
        id,
        cardNumber
    });
  }

//查询卡密是否存在
export async function findCardNumber({ cardNumber }) {
    const cardList = await db
      .select()
      .from(users)
      .where(eq(users.cardNumber, cardNumber))
      .limit(1);
    return cardList[0] || null;  // 查不到直接返回null
  }
  