import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pgPool } from "./MicroServiceAuth/src/data/connectDatabase";

export const verifyToken = async (req: any, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as any;
        if (!pgPool) {
            console.error("DATABASE ERROR: pgPool is not initialized");
            return res.status(500).json({ message: "Internal server error: Database not ready" });
        }

        const result = await pgPool.query(
            'SELECT id, "userName" FROM "User" WHERE id = $1', 
            [decoded.id]
        );
        
        if (result.rowCount === 0) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = result.rows[0]; 
        next();
    } catch (err: any) {
        console.error("AUTH ERROR:", err.message);
        res.status(401).json({ message: "Invalid or expired token" });
    }
};