import express, { Request, Response } from "express";
import { hashPassword, comparePassword } from "../utils/hashPassword";
import { generateToken, verifyToken } from "../utils/jwt";

const router = express.Router();


const users: any[] = [];

/**
 * REGISTER
 */
router.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await hashPassword(password);

    const user = {
      email,
      password: hashedPassword,
      role
    };

    users.push(user);

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Register failed" });
  }
});

/**
 * LOGIN
 */
router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
});

/**
 * ME (Protected)
 */
router.get("/auth/me", (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    res.json({ user: decoded });
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
});

export default router;
