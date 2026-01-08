import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import pool from "../data/connectDatabase";

export interface AuthRequest extends Request {
    user: any;
}

export const authMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(" ")[1];
        const decoded: any = verifyToken(token);

        if (!decoded || !decoded.id) {
            return res.status(401).json({ message: "Invalid token payload" });
        }

        const result = await pool.query('SELECT id, email, role FROM "User" WHERE id = $1', [decoded.id]);
        if (result.rowCount === 0) {
            return res.status(401).json({ message: "User not found" });
        }

        const user = result.rows[0];

        if (user.role !== "admin") {
            return res.status(403).json({ message: "Admin role required" });
        }

        req.user = { id: user.id, email: user.email, role: user.role };
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
