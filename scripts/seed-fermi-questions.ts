import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const questions = [
  {
    text: "Wie viele Stunden verbringt ein gewissenhafter Mensch in seinem Leben mit Zähneputzen?",
    correctAnswer: null,
  },
  {
    text: "Wie viele Päckchen Druckerpapier werden benötigt, die Körperfläche aller Einwohner Deutschlands zu bedecken?",
    correctAnswer: null,
  },
  {
    text: "Wie viele Kubikmeter umfasst das Volumen eines mittelschweren Atomkerns?",
    correctAnswer: null,
  },
  {
    text: "Welcher Bruchteil der von uns genutzten elektrischen Energie wird zum Laden unserer Smartphones benötigt?",
    correctAnswer: null,
  },
  {
    text: "Welche Länge in Lichtjahren nehmen die Atome einer Büroklammer ein, wenn man sie bündig aneinander legen würde?",
    correctAnswer: null,
  },
  {
    text: "Aus wie vielen Quarks insgesamt bestehen alle Teilnehmenden von SMP in diesem Jahr?",
    correctAnswer: null,
  },
  {
    text: "Welchen Anteil an der Erdoberfläche nimmt der Hörsaal ein, in dem Sie sich gerade befinden?",
    correctAnswer: null,
  },
  {
    text: "Wie groß ist die kinetische Energie eines Radfahrers bei einer Geschwindigkeit von 10 m/s in Elektronenvolt?",
    correctAnswer: null,
  },
  {
    text: "Mit wie vielen Tennisbällen müsste man gegen ein Auto werfen, um es aus einer Geschwindigkeit von 10 m/s durch den Aufprall der Bälle zum Stehen zu bringen?",
    correctAnswer: null,
  },
  {
    text: "Welche Masse an Luft in Kilogramm wird jeder Einzelne von uns heute während der Veranstaltung geatmet haben?",
    correctAnswer: null,
  },
];

async function main() {
  console.log("Seeding Fermi questions...");

  for (const question of questions) {
    await prisma.fermiQuestion.create({
      data: question,
    });
  }

  console.log(`✅ Added ${questions.length} Fermi questions`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
