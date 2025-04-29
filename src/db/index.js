// src/db/index.js
import dotenv from 'dotenv';
dotenv.config();

import postgres from 'postgres'; // ✅ 使用 postgres.js
import { drizzle } from 'drizzle-orm/postgres-js'; // ✅ 使用 drizzle 的 postgres-js 适配器
import * as schema from './schema.js';

// 创建 postgres.js 实例
const client = postgres("postgres://bio:xx112211@38.246.250.234:5432/bio", {
  prepare: false, // drizzle 推荐关掉 prepare，避免类型不匹配问题
});

// 创建 drizzle 实例
export const db = drizzle(client, { schema });
