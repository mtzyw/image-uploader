import dotenv from 'dotenv/config';
import cors from 'cors';
import express from 'express';
import userRouter from './routes/user.router.js'; // 👈 引入路由
import { errorMiddleware } from './middlewares/error.middleware.js';

const app = express();

app.use(express.json());

// 👇 挂载路由，加上/api前缀
app.use(cors());
app.use('/api', userRouter);
app.use('/uploads', express.static('uploads'));
app.use('/downloads', express.static('downloads', {
  setHeaders: res => {
    res.set('Access-Control-Allow-Origin', '*');
  }
}));
app.use(errorMiddleware)


// 启动服务器
app.listen(3000, () => {
  console.log('服务器已启动: http://localhost:3000');
});
