import { pgTable, uuid, varchar, text, timestamp, foreignKey } from 'drizzle-orm/pg-core';

// 用户表
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),                        // 主键 UUID
  cardNumber: varchar('card_number', { length: 50 })   // 卡号（唯一）
    .notNull()
    .unique(),
  createdAt: timestamp('created_at')                  // 创建时间
    .defaultNow(),
  updatedAt: timestamp('updated_at')                  // 更新时间
    .defaultNow(),
});

// 图片表
export const images = pgTable('images', {
  id: uuid('id').primaryKey(),                        // 图片记录主键 UUID
  userId: uuid('user_id')                              // 所属用户 ID
    .notNull(),
  filename: varchar('filename', { length: 255 })       // 存储的文件名
    .notNull(),
  url: text('url')                                     // 图片访问 URL
    .notNull(),
  createdAt: timestamp('created_at')                  // 上传时间
    .defaultNow(),
});