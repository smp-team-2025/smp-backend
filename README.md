# SMP Backend

This repo is the **backend** of the SMP Web App.  
Built with **Node.js**, **Express**, **TypeScript**, **Prisma**, and **PostgreSQL**.

# How to Set Up:

1. Go to project folder in Terminal
2. Run "npm install" to install required packages
3. Make sure PostgreSQL is installed in your system and run "createdb smp_dev" to create the database
4. Copy the example environment file by running "cp .env.example .env"
5. Edit inside .env: "DB_USER=DB_USER_NAME" and "DATABASE_URL="postgresql://DB_USER_NAME@localhost:5432/smp_dev?schema=public"
6. Run prisma migrations: "npx prisma migrate dev"
7. Start the development server: "npm run dev"
8. Backend will run at http://localhost:3000