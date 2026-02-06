/**This script is used to create a demo account. Do not use it to create a real account! */

import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('⏳ Seeding organizer user...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  try {
    const newOrganizer = await prisma.user.create({
      data: {
        email: 'organizer@smp.de',
        passwordHash: hashedPassword, 
        name: 'Organizer 1',
        role: UserRole.ORGANIZER, 
      },
    });

    console.log('✅ Organizer user created successfully!');
    console.log('-----------------------------------');
    console.log(`📧 Email:    ${newOrganizer.email}`);
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