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

async function updatePasswords() {
  try {
    await prisma.$connect();

    const users = [
      { email: "admin@botanas.com", newPassword: "Admin123456", role: "admin" },
      { email: "vendedor@botanas.com", newPassword: "Vendedor123", role: "vendedor" },
      { email: "consulta@botanas.com", newPassword: "Consulta123", role: "consulta" },
    ];

    for (const { email, newPassword, role } of users) {
      const hashedPassword = await bcryptjs.hash(newPassword, 12);
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
      });
      console.log(`✅ Contraseña actualizada (${role}): ${email}`);
      console.log(`   Nueva contraseña: ${newPassword}`);
    }

    console.log("\n✅ Todas las contraseñas han sido actualizadas");
    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Error al actualizar contraseñas:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

updatePasswords();
