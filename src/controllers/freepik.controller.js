import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { saveImageRecord } from '../services/freepik.image.js';  // 你自己定义的保存数据库记录的函数

const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;
//获取到freepik返回过来的链接以后去下载到本地
async function downloadToLocal(downloadUrl, filename) {
  const saveDir = path.resolve('downloads');
  // 确保目标目录存在，如果不存在则创建
  if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir);
  }

  const savePath = path.join(saveDir, filename);
  const res = await fetch(downloadUrl);

  if (!res.ok) throw new Error('下载失败');

  const fileStream = fs.createWriteStream(savePath);
  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on('error', reject);
    fileStream.on('finish', resolve);
  });

  return `/downloads/${filename}`;  // 返回可以供前端访问的路径
}
//请求接口
export async function proxyFreepikDownload(req, res) {
  const { id } = req.body;
  const userId = req.user.id;

  // 确保请求中包含资源 ID
  if (!id) {
    return res.status(400).json({ code: 1, message: '缺少 resource-id' });
  }

  try {
    // 使用 Freepik API 获取资源的下载信息
    const url = `https://api.freepik.com/v1/resources/${id}/download`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'x-freepik-api-key': FREEPIK_API_KEY }
    });

    // 解析 API 响应
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ code: 1, message: data?.message || 'Freepik 请求失败' });
    }

    // 从 API 响应中获取文件名和下载链接
    const filename = data.data.filename;  // 获取文件名
    const downloadUrl = data.data.url;    // 获取文件下载链接

    // 下载文件到本地
    const localUrl = await downloadToLocal(downloadUrl, filename);

    // 将下载的文件记录保存到数据库
    await saveImageRecord({
      id: uuidv4(),
      userId,
      filename,
      url: localUrl
    });

    // 返回响应给前端，包含文件下载链接和文件名等信息
    return res.status(200).json({
      code: 0,
      message: '下载成功',
      data: {
        freepikUrl: downloadUrl,  // Freepik 的下载链接
        localUrl,                 // 本地保存的文件路径
        filename                  // 文件名
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ code: 1, message: '服务器错误' });
  }
}
