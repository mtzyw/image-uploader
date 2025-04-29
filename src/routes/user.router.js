import express from 'express';
import { cardController } from '../controllers/card.controlles.js';


const router = express.Router();

// 注册接口
router.post('/register', cardController);


export default router;
