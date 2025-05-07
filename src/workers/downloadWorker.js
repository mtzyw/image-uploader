// workers/downloadWorker.js
import { Worker } from 'bullmq';
import { downloadQueue, connection } from '../queues/downloadQueue.js';
import fetch from 'node-fetch';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { saveImageRecord } from '../services/freepik.image.js';
import { v4 as uuidv4 } from 'uuid';

const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;

// 简单工具，给日期加天数
function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

// 下载 URL 到本地并返回相对路径
function downloadToLocal(downloadUrl, filename) {
  const saveDir = path.resolve('downloads');
  if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir);
  const savePath = path.join(saveDir, filename);

  return new Promise((resolve, reject) => {
    axios.get(downloadUrl, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://www.freepik.com',
        'Accept': '*/*',
        'Connection': 'keep-alive',
      },
      timeout: 20000,
    })
    .then(response => {
      const writer = fs.createWriteStream(savePath);
      response.data.pipe(writer);
      writer.on('finish', () => {
        resolve(`/downloads/${filename}`);
      });
      writer.on('error', err => {
        fs.unlink(savePath, () => {});
        reject(err);
      });
    })
    .catch(err => {
      reject(err);
    });
  });
}

console.log('🐮 启动 downloadQueue Worker…');

new Worker(
  downloadQueue.name,
  async job => {
    const { id, type, userId,sourceUrl} = job.data;
    //job拿到了链接
    const now = new Date();

    // 1. 获取用户卡信息
    const [user] = await db
      .select({
        firstUsed: users.cardFirstUsedAt,
        expiresAt: users.cardExpiresAt,
        validDays: users.cardValidDays,
        dailyDownloads: users.dailyDownloads,
        dailyDate: users.dailyDownloadsDate,
        dailyLimit: users.downloadLimit,
        totalDownloads: users.totalDownloads,
        totalLimit: users.totalDownloadLimit,
      })
      .from(users)
      .where(eq(users.id, userId));

    // 日重置逻辑
    const todayStr = now.toISOString().slice(0, 10);
    if (user.dailyDate !== todayStr) {
      await db.update(users)
        .set({ dailyDownloads: 0, dailyDownloadsDate: todayStr, updatedAt: now })
        .where(eq(users.id, userId));
      user.dailyDownloads = 0;
      user.dailyDate = todayStr;
    }
    // 2. 检查有效期
    if (!user.firstUsed) {
      const expiresAt = addDays(now, user.validDays);
      await db.update(users)
        .set({ cardFirstUsedAt: now, cardExpiresAt: expiresAt, updatedAt: now })
        .where(eq(users.id, userId));
    } else if (user.expiresAt && now > user.expiresAt) {
      throw new Error('卡号已过期');
    }
    // 3. 检查每日限额
    if (user.dailyLimit > 0 && user.dailyDownloads >= user.dailyLimit) {
      throw new Error('今日下载次数已达上限');
    }
    // 4. 检查总限额
    if (user.totalLimit > 0 && user.totalDownloads >= user.totalLimit) {
      throw new Error('下载总次数已达上限');
    }

    // 5. 构建 Freepik API URL
    const apiUrl = type === 'icon'
      ? `https://api.freepik.com/v1/icons/${id}/download`
      : `https://api.freepik.com/v1/resources/${id}/download`;

    const resFetch = await fetch(apiUrl, { headers: { 'x-freepik-api-key': FREEPIK_API_KEY } });
    if (!resFetch.ok) {
      const errText = await resFetch.text();
      console.error('Freepik 返回错误:', errText);
      throw new Error(`Freepik API ${resFetch.status}`);
    }
    const data = await resFetch.json();

    // 6. 下载到本地
    const filename = data.data.filename || `${id}.zip`;
    const downloadUrl = data.data.url;
    const localPath = await downloadToLocal(downloadUrl, filename);
    const fullUrl = `http://localhost:3000${localPath}`;

    // 7. 存储记录
    await saveImageRecord({ id: uuidv4(), userId, filename, url: fullUrl ,sourceUrl});

    // 8. 更新用户计数
    await db.update(users)
      .set({
        dailyDownloads: user.dailyDownloads + 1,
        totalDownloads: user.totalDownloads + 1,
        updatedAt: now,
      })
      .where(eq(users.id, userId));

    return { filename, fullUrl };
  },
  { connection }
)
