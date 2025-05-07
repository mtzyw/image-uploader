import { db } from '../db/index.js';
import { images } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

// 分页查询图片记录（根据 userId），并按创建时间倒序返回
export async function findUserImages({ userId, page = 1, pageSize = 10 }) {
  const offset = (page - 1) * pageSize;

  const list = await db
    .select()
    .from(images)
    .where(eq(images.userId, userId))
    .orderBy(desc(images.createdAt))  // 使用 desc() 倒序
    .limit(pageSize)
    .offset(offset);

  return list;
}
