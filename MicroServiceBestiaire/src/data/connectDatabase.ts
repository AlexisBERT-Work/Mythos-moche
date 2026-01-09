import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_NAME = process.env.MONGODB_NAME!;

const client = new MongoClient(MONGODB_URI);
let db: Db;

/**
 * Connecte à MongoDB et vérifie la connexion
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    await client.connect();
    
    db = client.db(MONGODB_NAME);
    await db.command({ ping: 1 });

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed", error);
    process.exit(1);
  }
};

/**
 * Retourne l'instance de la base de données
 */
export const getDb = (): Db => {
  if (!db) {
    throw new Error("La base de données n'est pas initialisée. Appelez connectDatabase d'abord.");
  }
  return db;
};

export const mongoClient = client;