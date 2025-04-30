import express from 'express';
import { cardController ,cardLogin} from '../controllers/card.controlles.js';
import {authMiddleware} from "../middlewares/authMiddleware.js"
import {uploadMiddleware} from "../middlewares/upload.middleware.js"
import {uploadImageController}from "../controllers/image.controlles.js"


const router = express.Router();

// 注册接口
router.post('/register', cardController);
router.post('/login',cardLogin)
router.post('/upload', authMiddleware, uploadMiddleware.single('file'), uploadImageController);

export default router;
