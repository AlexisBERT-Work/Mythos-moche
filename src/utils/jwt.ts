import jwt from 'jsonwebtoken';
import dotenv from "dotenv";

dotenv.config( {
    quiet:true,
})

interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export const generateToken = (payload: TokenPayload) => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '6h'
  });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET!);
};



