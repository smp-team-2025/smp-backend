import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "readline";

const prisma = new PrismaClient();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function ask(question: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(question, (answer) => resolve(answer.trim()));
    });
}

async function main() {
    console.log("Organizer erstellen");
    console.log("------------------------");

    const name = await ask("Name: ");
    const email = await ask("E-Mail: ");
    const password = await ask("Passwort: ");

    if (!name || !email || !password) {
        console.error("Alle Felder müssen ausgefüllt sein.");
        process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    try {
        const newOrganizer = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                role: UserRole.ORGANIZER,
            },
        });

        console.log("\nOrganizer erfolgreich erstellt!");
        console.log("-----------------------------------");
        console.log(`Name:     ${newOrganizer.name}`);
        console.log(`Email:    ${newOrganizer.email}`);
        console.log(`Rolle:    ${newOrganizer.role}`);
        console.log("-----------------------------------");
    } catch (error: any) {
        if (error.code === "P2002") {
            console.error("❌ Diese E-Mail existiert bereits.");
        } else {
            console.error("❌ Fehler beim Erstellen:", error);
        }
    } finally {
        rl.close();
        await prisma.$disconnect();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});