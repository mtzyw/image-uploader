// src/middlewares/error.middleware.js

export function errorMiddleware(err, req, res, next) {
    console.error('【错误日志】', err);
  
    res.status(500).json({
      code: 500,
      message: err.message || '服务器内部错误',
      data: null,
    });
  }
  