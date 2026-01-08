import express, { Request, Response } from "express";
import crypto from "node:crypto";
import { getDb } from "../data/connectDatabase";

interface Creature {
  _id: string;
  userId: string;
  name: string;
  origin: string;
  createdAt: Date;
}

const router = express.Router();

/**
 * bestiaire REGISTER
 */
router.post("/bestiaire/register", async (req: Request, res: Response) => {
    try {
        const { name, origin, userId } = req.body;
        
        if (!name || !origin || !userId) {
            return res.status(400).json({ message: "Missing fields" });
        }

        const db = getDb();
        const collection = db.collection<Creature>("Creature");
        const existing = await collection.findOne({ name: name });
        if (existing) {
            return res.status(409).json({ message: "Creature already exists" });
        }

        const id = crypto.randomUUID();
        const newCreature: Creature = {
            _id: id,
            userId,
            name,
            origin,
            createdAt: new Date()
        };

        await collection.insertOne(newCreature);

        res.status(201).json({ 
            message: "Creature registered successfully", 
            creatureId: id 
        });

    } catch (err) {
        console.error("REGISTER ERROR:", err);
        res.status(500).json({ message: "Register failed" });
    }
});

/**
 * recup bestiaire entier
 */
router.get("/bestiaire", async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection<Creature>("Creature");
        const creatures = await collection.find({}).toArray();
        res.status(200).json(creatures);
    } catch (err) {
        console.error("FETCH ERROR:", err);
        res.status(500).json({ message: "Failed to fetch bestiaire" });
    }
});

/** 
 * recup bestiaire par id
 */
router.get("/bestiaire/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const db = getDb();
        const collection = db.collection<Creature>("Creature");
        const creature = await collection.findOne({ _id: id });
        
        if (!creature) {
            return res.status(404).json({ message: "Creature not found" });
        }
        res.status(200).json(creature);
    } catch (err) {
        console.error("FETCH ERROR:", err);
        res.status(500).json({ message: "Failed to fetch creature" });
    }
});

export default router;