import { v4 as uuidv4 } from 'uuid';
import { findCardNumber, registerUser } from "../services/card.js";
import jwt from 'jsonwebtoken';


// 生成卡号
export async function cardController(req, res) {
  const { cardNumber } = req.body;

  // 1. 参数校验
  if (!cardNumber) {
    return res.status(400).json({ code: 1, message: "卡号不能为空" });
  }

  // 2. 查询是否已经存在（要 await）
  const data = await findCardNumber({ cardNumber });

  if (data) {
    // 3. 卡号已存在，返回错误
    return res.status(409).json({ code: 1, message: "卡号已存在" });
  }

  // 4. 生成新的卡号id并保存
  const carduuid = uuidv4();

  await registerUser({
    id: carduuid,
    cardNumber
  });

  //生成token一起返回过去
  // 签发JWT Token
  const JWT_SECRET = "112211"
  const token = jwt.sign(
    {
        id: carduuid
    },
    JWT_SECRET,
    { expiresIn: '7d' } // token有效期7天
    );

  // 5. 返回成功
  return res.status(200).json({ code: 0, message: "注册成功", data: { id: carduuid, cardNumber,token } });
}
