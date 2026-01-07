import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config(
    { 
        quiet: true 
    }
);

const pool = new Pool({
  host: process.env.POSTGRESQL_HOST,
  port: Number(process.env.POSTGRESQL_PORT),
  user: process.env.POSTGRESQL_USER,
  password: process.env.POSTGRESQL_PWD,
  database: process.env.POSTGRESQL_NAME,
});

/**
 * Connects to PostgreSQL and verifies the connection
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();

    console.log("✅ PostgreSQL connected successfully");
  } catch (error) {
    console.error("❌ PostgreSQL connection failed", error);
    process.exit(1);
  }
};

export default pool;
