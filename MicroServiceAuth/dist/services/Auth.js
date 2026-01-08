import express from "express";
import { hashPassword, comparePassword } from "../utils/hashPassword";
import { generateToken } from "../utils/jwt";
import pool from "../data/connectDatabase";
import crypto from "node:crypto";
const router = express.Router();
/**
 * REGISTER
 */
router.post("/auth/register", async (req, res) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Missing fields" });
        }
        const existing = await pool.query('SELECT id FROM "User" WHERE email = $1', [email]);
        if (existing.rowCount > 0) {
            return res.status(409).json({ message: "User already exists" });
        }
        const hashedPassword = await hashPassword(password);
        const id = crypto.randomUUID();
        const inserted = await pool.query('INSERT INTO "User" (id, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id', [id, email, hashedPassword, role || "User"]);
        res.status(201).json({ message: "User registered successfully", userId: inserted.rows[0].id });
    }
    catch (err) {
        res.status(500).json({ message: "Register failed" });
    }
});
/**
 * LOGIN
 */
router.post("/auth/login", async (req, res) => {
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
    }
    catch (err) {
        res.status(500).json({ message: "Login failed" });
    }
});
/**
 * ME (Protected)
 */
router.get("/auth/me", (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: "No token provided" });
        }
        const token = authHeader.split(" ")[1];
        // verify token and return payload
        const decoded = require("jsonwebtoken").verify(token, process.env.JWT_SECRET);
        res.json({ user: decoded });
    }
    catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
});
export default router;
