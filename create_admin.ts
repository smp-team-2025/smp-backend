import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('⏳ Seeding admin user...');

  // 1. Hash the password
  const hashedPassword = await bcrypt.hash('123456', 10);

  try {
    // 2. Create the user
    const newAdmin = await prisma.user.create({
      data: {
        email: 'admin@smp.de',
        // YOUR SCHEMA USES 'passwordHash', NOT 'password'
        passwordHash: hashedPassword, 
        name: 'System Admin',
        // Setting the role to admin
        role: 'organizer', 
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('-----------------------------------');
    console.log(`📧 Email:    ${newAdmin.email}`);
    console.log(`🔑 Password: 123456`);
    console.log('-----------------------------------');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
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