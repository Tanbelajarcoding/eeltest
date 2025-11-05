import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Creating admin and user accounts...");

  const adminPassword = await bcrypt.hash("admin123", 10);
  const userPassword = await bcrypt.hash("user123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@gmf.co.id" },
    update: {},
    create: {
      email: "admin@gmf.co.id",
      name: "Admin GMF",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "user@gmf.co.id" },
    update: {},
    create: {
      email: "user@gmf.co.id",
      name: "User GMF",
      password: userPassword,
      role: "USER",
    },
  });

  console.log("✅ Admin user created:", admin.email);
  console.log("✅ Regular user created:", user.email);
  console.log("\nLogin credentials:");
  console.log("Admin - Email: admin@gmf.co.id, Password: admin123");
  console.log("User - Email: user@gmf.co.id, Password: user123");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
