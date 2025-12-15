import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('⏳ Seeding hiwi user...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  try {
    const newHiwi = await prisma.user.create({
      data: {
        email: 'hiwi@smp.de',
        passwordHash: hashedPassword, 
        name: 'Hiwi 1',
        role: UserRole.HIWI, 
        hiwi: {
          create: {
            clothingSize: "M",
      },
    },
      },
    });

    console.log('✅ Hiwi user created successfully!');
    console.log('-----------------------------------');
    console.log(`📧 Email:    ${newHiwi.email}`);
    console.log(`🔑 Password: 123456`);
    console.log('-----------------------------------');

  } catch (error) {
    console.error('❌ Error creating organizer user:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });