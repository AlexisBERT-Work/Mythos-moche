import express, { Request, Response } from "express";
import crypto from "node:crypto";
import { getDb } from "../data/connectDatabase";
import { verifyToken } from "../../../middleware";


interface Temoignage {
  _id: string;
  creatureName: string;
  userName: string;
  description: string;
  status: "PENDING" | "VALIDATED" | "REJECTED";
  validatedBy: string | null;
  validatedDate: Date | null;
  createdAt: Date;
}

const router = express.Router();

/**
 * temoignage REGISTER
 */
router.post("/temoignage/register", async (req: Request, res: Response) => {
    try {
        const { description, creatureName, userName } = req.body;

        if (!description || !creatureName || !userName) {
            return res.status(400).json({ message: "Missing fields: description, creatureName and userName are required" });
        }

        const db = getDb();
        const collection = db.collection<Temoignage>("Temoignage");
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        const recentTestimony = await collection.findOne({
            userName: userName,
            creatureName: creatureName,
            createdAt: { $gte: fiveMinutesAgo }
        });

        if (recentTestimony) {
            return res.status(429).json({ message: "Please wait 5 minutes before submitting another testimony for this creature." });
        }
        const id = crypto.randomUUID();
        const newTemoignage: Temoignage = {
            _id: id,
            creatureName,
            userName,
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
 * Recup temoignage entier
 */
router.get("/temoignages", verifyToken, async (req: Request, res: Response) => {
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

/**
 * Recup temoignage par nom creature
 */
router.get("/temoignages/creature/:name", async (req: Request, res: Response) => {
    try {
        const creatureName = req.params.name;
        const db = getDb();
        const collection = db.collection<Temoignage>("Temoignage");
        const temoignages = await collection.find({ creatureName: creatureName }).toArray();
        res.status(200).json(temoignages);
    } catch (err) {
        console.error("FETCH ERROR:", err);
        res.status(500).json({ message: "Failed to fetch temoignages by creature name" });
    }
});

/**
 * Validation temoignage par admin
 */
router.post("/temoignage/validate/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { validatedBy } = req.body; 

        if (!validatedBy) {
            return res.status(400).json({ message: "validatedBy field is required" });
        }

        const db = getDb();
        const collection = db.collection<Temoignage>("Temoignage");
        const temoignage = await collection.findOne({ _id: id });
        
        if (!temoignage) {
            return res.status(404).json({ message: "Temoignage not found" });
        }

        if (temoignage.userName === validatedBy) {
            return res.status(403).json({ message: "Forbidden: You cannot validate your own testimony" });
        }

        await collection.updateOne(
            { _id: id },
            { 
                $set: { 
                    status: "VALIDATED", 
                    validatedBy: validatedBy, 
                    validatedDate: new Date() 
                } 
            }
        );

        res.status(200).json({ message: "Temoignage validated successfully" });
    } catch (err) {
        console.error("VALIDATION ERROR:", err);
        res.status(500).json({ message: "Failed to validate temoignage" });
    }
});

/** 
 * Refuser temoignage par admin
 */
router.post("/temoignage/reject/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const db = getDb();
        const collection = db.collection<Temoignage>("Temoignage");
        const temoignage = await collection.findOne({ _id: id });
        if (!temoignage) {
            return res.status(404).json({ message: "Temoignage not found" });
        }

        await collection.updateOne(
            { _id: id },
            { 
                $set: { 
                    status: "REJECTED", 
                    validatedBy: null, 
                    validatedDate: null 
                } 
            }
        );
        res.status(200).json({ message: "Temoignage rejected successfully" });
    } catch (err) {
        console.error("REJECTION ERROR:", err);
        res.status(500).json({ message: "Failed to reject temoignage" });
    }
});

export default router;