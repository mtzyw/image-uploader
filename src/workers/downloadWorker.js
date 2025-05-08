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

// 工具函数：给日期加天数
function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

// 下载到本地并返回路径
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
    const { id, type, userId, sourceUrl } = job.data;
    const now = new Date();

    console.log('📥 接收到任务:', { id, type, userId, sourceUrl });

    // 获取用户
    console.log('🔍 获取用户信息...');
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

    if (!user) {
      console.error('❌ 用户不存在');
      throw new Error('用户不存在');
    }

    console.log('✅ 用户信息:', user);

    // 重置每日下载
    const todayStr = now.toISOString().slice(0, 10);
    if (user.dailyDate !== todayStr) {
      console.log('📆 重置用户每日下载计数');
      await db.update(users)
        .set({ dailyDownloads: 0, dailyDownloadsDate: todayStr, updatedAt: now })
        .where(eq(users.id, userId));
      user.dailyDownloads = 0;
      user.dailyDate = todayStr;
    }

    // 检查有效期
    if (!user.firstUsed) {
      console.log('🆕 首次使用卡，设置过期时间...');
      const expiresAt = addDays(now, user.validDays);
      await db.update(users)
        .set({ cardFirstUsedAt: now, cardExpiresAt: expiresAt, updatedAt: now })
        .where(eq(users.id, userId));
    } else if (user.expiresAt && now > user.expiresAt) {
      console.warn('⏰ 卡已过期');
      throw new Error('卡号已过期');
    }

    // 每日限额
    if (user.dailyLimit > 0 && user.dailyDownloads >= user.dailyLimit) {
      console.warn('🚫 每日下载次数超限');
      throw new Error('今日下载次数已达上限');
    }

    // 总限额
    if (user.totalLimit > 0 && user.totalDownloads >= user.totalLimit) {
      console.warn('🚫 总下载次数超限');
      throw new Error('下载总次数已达上限');
    }

    // 获取下载链接
    const apiUrl = type === 'icon'
      ? `https://api.freepik.com/v1/icons/${id}/download`
      : `https://api.freepik.com/v1/resources/${id}/download`;

    console.log('🌐 调用 Freepik API:', apiUrl);
    const resFetch = await fetch(apiUrl, {
      headers: { 'x-freepik-api-key': FREEPIK_API_KEY }
    });

    if (!resFetch.ok) {
      const errText = await resFetch.text();
      console.error('❌ Freepik API 错误:', errText);
      throw new Error(`Freepik API ${resFetch.status}`);
    }

    const data = await resFetch.json();
    console.log('📦 获取文件链接成功:', data.data.url);

    // 下载到本地
    const filename = data.data.filename || `${id}.zip`;
    console.log('⬇️ 开始下载:', filename);
    const localPath = await downloadToLocal(data.data.url, filename);
    const fullUrl = `https://freepikapi.shayudata.com${localPath}`;
    console.log('✅ 下载完成:', fullUrl);

    // 保存记录
    console.log('💾 保存下载记录...');
    await saveImageRecord({
      id: uuidv4(),
      userId,
      filename,
      url: fullUrl,
      sourceUrl
    });

    // 更新用户计数
    console.log('🔢 更新用户下载计数...');
    await db.update(users)
      .set({
        dailyDownloads: user.dailyDownloads + 1,
        totalDownloads: user.totalDownloads + 1,
        updatedAt: now,
      })
      .where(eq(users.id, userId));

    console.log('🎉 任务处理完成:', filename);
    return { filename, fullUrl };
  },
  { connection }
);
