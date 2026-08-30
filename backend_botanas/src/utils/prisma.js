import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

// Crear conexión a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (err) => {
  console.error("Pool error:", err);
});

const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ 
  adapter,
  log: ["error", "warn"],
});

// Conectar a la base de datos
prisma.$connect()
  .then(() => console.log("✅ Prisma conectado a la BD"))
  .catch((err) => {
    console.error("❌ Error conectando a la BD:", err);
    process.exit(1);
  });

