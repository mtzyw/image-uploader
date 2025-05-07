import express from 'express';
import { cardController ,cardLogin,getUserInfoByCard} from '../controllers/card.controlles.js';
import {authMiddleware} from "../middlewares/authMiddleware.js"
import {uploadMiddleware} from "../middlewares/upload.middleware.js"
import {uploadImageController}from "../controllers/image.controlles.js"
import { proxyFreepikDownload } from '../controllers/freepik.controller.js';
import { getMyImagesController } from '../controllers/image.controlles.js';
import { getTaskStatus } from '../controllers/task.controller.js';



const router = express.Router();

// 注册接口
router.post('/register', cardController);
router.post('/login',cardLogin)
router.post('/upload', authMiddleware, uploadMiddleware.single('file'), uploadImageController);
router.post('/freepik/download',authMiddleware, proxyFreepikDownload);
router.get('/my-images', authMiddleware, getMyImagesController);
router.get('/task/:id',authMiddleware,getTaskStatus);
router.get('/user/:cardNumber', authMiddleware, getUserInfoByCard);



export default router;
