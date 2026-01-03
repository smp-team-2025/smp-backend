import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const sessionId = 1;

  const existingQuiz = await prisma.fermiQuiz.findUnique({
    where: { sessionId },
  });

  if (existingQuiz) {
    console.log(`✅ Quiz already exists for session ${sessionId}, ID: ${existingQuiz.id}`);
    return;
  }

  const questions = await prisma.fermiQuestion.findMany({
    orderBy: { id: "asc" },
    take: 10,
  });

  if (questions.length < 10) {
    console.log("❌ Not enough questions in database");
    return;
  }

  const quiz = await prisma.fermiQuiz.create({
    data: {
      sessionId,
      questions: {
        create: questions.map((q, index) => ({
          questionId: q.id,
          order: index + 1,
        })),
      },
    },
  });

  console.log(`✅ Created quiz ID ${quiz.id} for session ${sessionId}`);
  console.log(`📝 Added 10 questions`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
