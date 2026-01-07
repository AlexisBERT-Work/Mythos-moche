import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
dotenv.config({
    quiet: true,
});
export const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '6h'
    });
};
export const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};
