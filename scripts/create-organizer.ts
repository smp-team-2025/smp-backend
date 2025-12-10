import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Creating organizer user...");

  // Şifre: admin123
  const passwordHash = await bcrypt.hash("admin123", 10);

  try {
    const organizer = await prisma.user.create({
      data: {
        name: "Admin Organizer",
        email: "admin@smp.de",
        passwordHash: passwordHash,
        role: "organizer",
      },
    });

    console.log("✅ Organizer created successfully!");
    console.log("========================================");
    console.log("Email: admin@smp.de");
    console.log("Password: admin123");
    console.log("Role: organizer");
    console.log("========================================");
  } catch (error: any) {
    if (error.code === "P2002") {
      console.log("⚠️  Organizer with this email already exists!");
    } else {
      console.error("❌ Error:", error);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
