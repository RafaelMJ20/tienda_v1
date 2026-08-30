import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcryptjs from "bcryptjs";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ 
  adapter,
  log: ["error", "warn"],
});

async function createAdminUser() {
  try {
    await prisma.$connect();

    // Función auxiliar para crear usuario si no existe
    async function ensureUser(email, plainPassword, name, role) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        console.log(`✅ Ya existe usuario (${role}): ${email}`);
        return existing;
      }
      const hashed = await bcryptjs.hash(plainPassword, 12);
      const user = await prisma.user.create({
        data: { email, password: hashed, name, role },
      });
      console.log(`✅ Usuario creado (${role}): ${email}`);
      console.log(`   Contraseña temporal: ${plainPassword}`);
      return user;
    }

    // Crear/asegurar admin, vendedor y consulta con contraseñas más seguras
    // Formato: 1 mayúscula, 1 minúscula, 1 número, mínimo 8 caracteres
    await ensureUser("admin@botanas.com", "Admin123456", "Administrador", "admin");
    await ensureUser("vendedor@botanas.com", "Vendedor123", "Vendedor", "vendedor");
    await ensureUser("consulta@botanas.com", "Consulta123", "Consulta", "consulta");

    console.log("\n⚠️  IMPORTANTE: Cambia estas contraseñas por defecto después del primer login");

    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Error al crear usuario admin:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createAdminUser();
