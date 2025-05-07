import { pgTable, uuid, varchar, text, timestamp, integer, date } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// 用户表
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),                        // 主键 UUID，由前端提供
  cardNumber: varchar('card_number', { length: 50 })   // 卡号（唯一）
    .notNull()
    .unique(),
  cardValidDays: integer('card_valid_days')            // 有效天数，默认 30
    .notNull()
    .default(sql`30`),
  cardFirstUsedAt: timestamp('card_first_used_at'),     // 首次使用时间
  cardExpiresAt: timestamp('card_expires_at'),          // 过期时间
  downloadLimit: integer('download_limit')              // 每日下载次数上限，0 表示不限制
    .notNull()
    .default(sql`25`),
  dailyDownloads: integer('daily_downloads')            // 当日已下载次数
    .notNull()
    .default(sql`0`),
  dailyDownloadsDate: date('daily_downloads_date')      // 计数对应的日期
    .notNull()
    .default(sql`CURRENT_DATE`),
  totalDownloadLimit: integer('total_download_limit')    // 总下载次数上限，0 表示无限制
    .notNull()
    .default(sql`0`),
  totalDownloads: integer('total_downloads')            // 已下载次数
    .notNull()
    .default(sql`0`),
  createdAt: timestamp('created_at')                    // 创建时间
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at')                    // 更新时间
    .notNull()
    .defaultNow(),
});

// 图片表
export const images = pgTable('images', {
  id: uuid('id').primaryKey(),                         // 图片记录主键 UUID，由前端生成
  userId: uuid('user_id')                               // 所属用户 ID
    .notNull(),
  filename: varchar('filename', { length: 255 })        // 存储的文件名
    .notNull(),
  url: text('url')                                      // 图片访问 URL
    .notNull(),
  createdAt: timestamp('created_at')                    // 上传时间
    .notNull()
    .defaultNow(),
  sourceUrl: text('source_url').notNull(), // 新增字段
});
