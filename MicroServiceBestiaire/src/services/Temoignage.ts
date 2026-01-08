import express, { Request, Response } from "express";
import crypto from "node:crypto";
import { getDb } from "../data/connectDatabase";

interface Temoignage {
  _id: string;
  creatureName: string;
  description: string;
  status: string;
  validatedBy: string;
  validatedDate: Date;
  createdAt: Date;
}

const router = express.Router();

/**
 * temoignage REGISTER
*/
router.post("/temoignage/register", async (req: Request, res: Response) => {
    try {
        const { description, creatureName } = req.body;
        
        if (!description || !creatureName) {
            return res.status(400).json({ message: "Missing fields" });
        }

        const id = crypto.randomUUID();
        const db = getDb();
        const collection = db.collection<Temoignage>("Temoignage");
        const existing = await collection.findOne({ _id: id });
        if (existing) {
            return res.status(409).json({ message: "Temoignage already exists" });
        }

        const newTemoignage: Temoignage = {
            _id: id,
            creatureName,
            description,
            status: "PENDING",
            validatedBy: null,
            validatedDate: null,
            createdAt: new Date()
        };

        await collection.insertOne(newTemoignage);

        res.status(201).json({ 
            message: "Temoignage registered successfully", 
            temoignageId: id 
        });

    } catch (err) {
        console.error("REGISTER ERROR:", err);
        res.status(500).json({ message: "Register failed" });
    }
});

/**
* recup temoignage entier
*/
router.get("/temoignages", async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection<Temoignage>("Temoignage");
        const temoignages = await collection.find({}).toArray();
        res.status(200).json(temoignages);
    } catch (err) {
        console.error("FETCH ERROR:", err);
        res.status(500).json({ message: "Failed to fetch temoignages" });
    }
});

export default router;