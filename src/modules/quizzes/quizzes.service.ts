import { prisma } from "../../prisma";

export const quizzesService = {
  async getAllQuestions() {
    return await prisma.fermiQuestion.findMany({
      orderBy: { id: "asc" },
    });
  },

  async createQuestion(text: string, correctAnswer?: number) {
    return await prisma.fermiQuestion.create({
      data: {
        text,
        correctAnswer: correctAnswer ?? null,
      },
    });
  },

  async updateQuestion(id: number, text: string, correctAnswer?: number) {
    return await prisma.fermiQuestion.update({
      where: { id },
      data: {
        text,
        correctAnswer: correctAnswer ?? null,
      },
    });
  },

  async deleteQuestion(id: number) {
    return await prisma.fermiQuestion.delete({
      where: { id },
    });
  },

  async createQuiz(sessionId: number, questionIds: number[]) {
    if (questionIds.length !== 10) {
      throw new Error("EXACTLY_10_QUESTIONS_REQUIRED");
    }

    const existing = await prisma.fermiQuiz.findUnique({
      where: { sessionId },
    });
    if (existing) {
      throw new Error("QUIZ_ALREADY_EXISTS");
    }

    return await prisma.fermiQuiz.create({
      data: {
        sessionId,
        questions: {
          create: questionIds.map((questionId, index) => ({
            questionId,
            order: index + 1,
          })),
        },
      },
      include: {
        questions: {
          include: {
            question: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });
  },

  async getQuizBySessionId(sessionId: number) {
    return await prisma.fermiQuiz.findUnique({
      where: { sessionId },
      include: {
        questions: {
          include: {
            question: {
              select: {
                id: true,
                text: true,
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });
  },

  async submitQuiz(
    participantId: number,
    quizId: number,
    answers: Array<{ questionId: number; answer: number }>
  ) {
    if (answers.length !== 10) {
      throw new Error("EXACTLY_10_ANSWERS_REQUIRED");
    }

    const existing = await prisma.fermiResponse.findUnique({
      where: {
        participantId_quizId: {
          participantId,
          quizId,
        },
      },
    });

    if (existing) {
      throw new Error("ALREADY_SUBMITTED");
    }

    return await prisma.fermiResponse.create({
      data: {
        participantId,
        quizId,
        answers: answers,
      },
    });
  },

  async getResults(quizId: number) {
    const quiz = await prisma.fermiQuiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            question: true,
          },
          orderBy: {
            order: "asc",
          },
        },
        responses: {
          include: {
            participant: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            submittedAt: "asc",
          },
        },
      },
    });

    return quiz;
  },

  async getStatistics(quizId: number) {
    const quiz = await prisma.fermiQuiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            question: true,
          },
          orderBy: {
            order: "asc",
          },
        },
        responses: {
          select: {
            answers: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new Error("QUIZ_NOT_FOUND");
    }

    const stats = quiz.questions.map((q) => {
      const questionId = q.questionId;
      const allAnswers = quiz.responses
        .map((r: any) => {
          const answerObj = (r.answers as any[]).find(
            (a: any) => a.questionId === questionId
          );
          return answerObj?.answer;
        })
        .filter((a) => a !== undefined && a !== null) as number[];

      if (allAnswers.length === 0) {
        return {
          questionId,
          questionText: q.question.text,
          correctAnswer: q.question.correctAnswer,
          count: 0,
          mean: null,
          median: null,
          min: null,
          max: null,
        };
      }

      const sorted = [...allAnswers].sort((a, b) => a - b);
      const sum = sorted.reduce((acc, val) => acc + val, 0);
      const mean = sum / sorted.length;
      const median =
        sorted.length % 2 === 0
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)];

      return {
        questionId,
        questionText: q.question.text,
        correctAnswer: q.question.correctAnswer,
        count: sorted.length,
        mean,
        median,
        min: sorted[0],
        max: sorted[sorted.length - 1],
      };
    });

    return stats;
  },

  async deleteQuiz(quizId: number) {
    await prisma.fermiQuiz.delete({
      where: { id: quizId },
    });
  },

  async updateQuiz(quizId: number, questionIds: number[]) {
    await prisma.fermiQuizQuestion.deleteMany({
      where: { quizId },
    });

    await prisma.fermiQuizQuestion.createMany({
      data: questionIds.map((qId, idx) => ({
        quizId,
        questionId: qId,
        order: idx + 1,
      })),
    });

    return await prisma.fermiQuiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            question: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });
  },
};
