import express, { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma/"; // Attention au chemin d'import défini dans le schema

// Instance Prisma pour MongoDB
const prisma = new PrismaClient();
const router = express.Router();

// --- MOCK MIDDLEWARE (À remplacer par ton vrai middleware d'auth) ---
interface AuthRequest extends Request { user?: any; }
const authenticate = (req: AuthRequest, res: Response, next: any) => {
    if (!req.headers.authorization) return res.status(401).json({ message: "No token" });
    // Simulation: Normalement ceci vient de verifyToken
    // req.user = { id: "user_123", role: "USER" }; 
    next();
};

// --- ROUTES CREATURES ---

/**
 * POST /creatures
 */
router.post("/creatures", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, origin } = req.body;
    const authorId = req.user.id;

    if (!name) return res.status(400).json({ message: "Name is required" });

    const newCreature = await prisma.creature.create({
      data: {
        name,
        origin,
        authorId
      }
    });

    res.status(201).json(newCreature);

  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: "Creature name already exists" });
    }
    console.error(err);
    res.status(500).json({ message: "Error creating creature" });
  }
});

/**
 * GET /creatures
 */
router.get("/creatures", authenticate, async (req: Request, res: Response) => {
  try {
    const creatures = await prisma.creature.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(creatures);
  } catch (err) {
    res.status(500).json({ message: "Error fetching creatures" });
  }
});

/**
 * GET /creatures/:id
 */
router.get("/creatures/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const creature = await prisma.creature.findUnique({
      where: { id }
    });

    if (!creature) return res.status(404).json({ message: "Creature not found" });
    res.json(creature);
  } catch (err) {
    res.status(500).json({ message: "Error fetching creature" });
  }
});


// --- ROUTES TESTIMONIES ---

/**
 * POST /testimonies
 * Vérification d'existence de la créature
 * Règle : Pas de double post en moins de 5 minutes
 */
router.post("/testimonies", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { creatureId, description } = req.body;
    const authorId = req.user.id;

    if (!creatureId || !description) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const creature = await prisma.creature.findUnique({ where: { id: creatureId } });
    if (!creature) {
      return res.status(404).json({ message: "Creature not found" });
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const recentTestimony = await prisma.testimony.findFirst({
      where: {
        authorId: authorId,
        creatureId: creatureId,
        createdAt: { gte: fiveMinutesAgo }
      }
    });

    if (recentTestimony) {
      return res.status(429).json({ message: "Wait 5 minutes before posting again." });
    }

    const testimony = await prisma.testimony.create({
      data: {
        description,
        creatureId,
        authorId,
        status: "PENDING"
      }
    });

    res.status(201).json(testimony);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating testimony" });
  }
});

/**
 * GET /creatures/:id/testimonies
 */
router.get("/creatures/:id/testimonies", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const testimonies = await prisma.testimony.findMany({
      where: { creatureId: id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(testimonies);
  } catch (err) {
    res.status(500).json({ message: "Error fetching testimonies" });
  }
});


// --- VALIDATION / REJET ---

/**
 * Fonction utilitaire pour Update
 */
const updateStatus = async (id: string, status: "VALIDATED" | "REJECTED", req: AuthRequest, res: Response) => {

    const testimony = await prisma.testimony.findUnique({ where: { id } });
    
    if (!testimony) return res.status(404).json({ message: "Testimony not found" });

    if (testimony.authorId === req.user.id) {
        return res.status(403).json({ message: "Cannot validate/reject your own testimony" });
    }

    const updated = await prisma.testimony.update({
        where: { id },
        data: {
            status: status,
            validatedBy: req.user.id,
            validatedAt: new Date()
        }
    });

    res.json({ message: `Testimony ${status}`, testimony: updated });
};

router.post("/testimonies/:id/validate", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await updateStatus(req.params.id, "VALIDATED", req, res);
  } catch (err) {
    res.status(500).json({ message: "Validation failed" });
  }
});

router.post("/testimonies/:id/reject", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await updateStatus(req.params.id, "REJECTED", req, res);
  } catch (err) {
    res.status(500).json({ message: "Rejection failed" });
  }
});

export default router;