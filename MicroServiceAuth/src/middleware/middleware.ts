import { Request, Response, NextFunction, RequestHandler } from "express";
import { verifyToken } from "../utils/jwt";
import pool from "../data/connectDatabase";

export interface AuthRequest extends Request {
    user?: any;
}

export const authMiddleware: RequestHandler = async (req, res, next) => {
    const authReq = req as AuthRequest;

    try {
        const authHeader = authReq.headers.authorization;

        if (!authHeader) {
            res.status(401).json({ message: "No token provided" });
            return;
        }

        const token = authHeader.split(" ")[1];
        const decoded: any = verifyToken(token);

        if (!decoded || !decoded.id) {
            res.status(401).json({ message: "Invalid token payload" });
            return;
        }

        const result = await pool.query(
            'SELECT id, email, role FROM "User" WHERE id = $1', 
            [decoded.id]
        );

        if (result.rowCount === 0) {
            res.status(401).json({ message: "User not found" });
            return;
        }

        const user = result.rows[0];

        if (user.role !== "ADMIN") {
            res.status(403).json({ message: "Admin role required" });
            return;
        }

        authReq.user = { id: user.id, email: user.email, role: user.role };
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid or expired token" });
    }
};