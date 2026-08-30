import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Importar middlewares de seguridad
import { loginLimiter, strictLimiter } from "./src/middleware/rateLimitMiddleware.js";

// Importar rutas
import authRoutes from "./src/routes/authRoutes.js";
import categoryRoutes from "./src/routes/categoryRoutes.js";
import productRoutes from "./src/routes/productRoutes.js";
import { saleRoutes } from "./src/routes/saleRoutes.js";
import { creditRoutes } from "./src/routes/creditRoutes.js";
import { reportRoutes } from "./src/routes/reportRoutes.js";

const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 3000;

// Crear instancia de Prisma
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ 
  adapter,
  log: ["error", "warn"],
});

// Conectar a la base de datos
await prisma.$connect()
  .then(() => console.log("Prisma conectado a la BD"))
  .catch((err) => {
    console.error("❌ Error conectando a la BD:", err);
    process.exit(1);
  });

// Middleware
app.use(cors());
app.use(express.json());

// Pasar prisma a través de req.app.locals
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "Server is running ✓" });
});

// Test Prisma connection
app.get("/api/test-db", async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "Database connection successful ✓" });
  } catch (error) {
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Rutas de API
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/credits", creditRoutes);
app.use("/api/reports", reportRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Test DB: http://localhost:${PORT}/api/test-db`);
  console.log(`Auth: http://localhost:${PORT}/api/auth`);
  console.log(`Categories: http://localhost:${PORT}/api/categories`);
  console.log(`Products: http://localhost:${PORT}/api/products`);
  console.log(`Sales: http://localhost:${PORT}/api/sales`);
  console.log(`Credits: http://localhost:${PORT}/api/credits`);
  console.log(`Reports: http://localhost:${PORT}/api/reports`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
