import express, { Request, Response } from "express";
import { hashPassword, comparePassword } from "../utils/hashPassword";
import { generateToken } from "../utils/jwt";
import pool from "../data/connectDatabase";
import crypto from "node:crypto";
import { authMiddleware, AuthRequest } from "../middleware/middleware";

const router = express.Router();

/**
 * REGISTER
 */
router.post("/auth/register", async (req: Request, res: Response) => {
    try {
        const { email, password, username, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Missing fields" });
        }

        const existing = await pool.query('SELECT id FROM "User" WHERE email = $1', [email]);
        if (existing.rowCount! > 0) {
            return res.status(409).json({ message: "User already exists" });
        }

        const hashedPassword = await hashPassword(password);
        const id = crypto.randomUUID();

        const inserted = await pool.query(
            'INSERT INTO "User" (id, email, password, username, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [id, email, hashedPassword, username, role]
        );

        res.status(201).json({ message: "User registered successfully", userId: inserted.rows[0].id });
    } catch (err) {
        res.status(500).json({ message: "Register failed" });
        console.error("REGISTER ERROR:", err);
    }
});

/**
 * LOGIN
 */
router.post("/auth/login", async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query('SELECT id, email, password, role FROM "User" WHERE email = $1', [email]);
        if (result.rowCount === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = result.rows[0];

        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
        });

        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: "Login failed" });
    }
});

/**
 * ME
 */
router.get("/auth/me", authMiddleware, (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(" ")[1];
        const decoded: any = require("jsonwebtoken").verify(token, process.env.JWT_SECRET);

        res.json({ user: decoded });
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
});

/** 
 * Get users with role admin (Protected)
 */
router.get("/admin/users", authMiddleware, async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            'SELECT id, email, username, role FROM "User" WHERE role = $1', 
            ['ADMIN']
        );
        
        res.json({ users: result.rows });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch users" });
    }
});

/**
 * Modify user role (Protected)
 */
router.patch("/users/:id/role", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.params.id;
        const { role } = req.body;
        if (!role) {
            return res.status(400).json({ message: "Missing role field" });
        }
        const result = await pool.query
            ('UPDATE "User" SET role = $1 WHERE id = $2 RETURNING id, email, username, role', 
            [role, userId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ message: "User role updated", user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ message: "Failed to update user role" });
    }
});

export default router;
