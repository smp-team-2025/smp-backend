import { prisma } from "../../prisma";

export const quizzesService = {
  async getAllQuestions() {
    const questions = await prisma.fermiQuestion.findMany({
      orderBy: { id: "asc" },
      include: {
        quizQuestions: {
          include: {
            quiz: {
              include: {
                session: {
                  select: {
                    id: true,
                    title: true,
                    startsAt: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Transform to include usage info
    return questions.map((q) => ({
      id: q.id,
      text: q.text,
      correctAnswer: q.correctAnswer,
      correctAnswer2: q.correctAnswer2,
      createdAt: q.createdAt,
      usedIn: q.quizQuestions.map((qq) => ({
        quizId: qq.quiz.id,
        sessionId: qq.quiz.sessionId,
        sessionTitle: qq.quiz.session.title,
        sessionStartsAt: qq.quiz.session.startsAt,
      })),
    }));
  },

  async createQuestion(text: string, correctAnswer?: number, correctAnswer2?: number) {
    return await prisma.fermiQuestion.create({
      data: {
        text,
        correctAnswer: correctAnswer ?? null,
        correctAnswer2: correctAnswer2 ?? null,
      },
    });
  },

  async updateQuestion(id: number, text: string, correctAnswer?: number, correctAnswer2?: number) {
    return await prisma.fermiQuestion.update({
      where: { id },
      data: {
        text,
        correctAnswer: correctAnswer ?? null,
        correctAnswer2: correctAnswer2 ?? null,
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

  async getLeaderboard(quizId: number) {
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
        },
      },
    });

    if (!quiz) {
      throw new Error("QUIZ_NOT_FOUND");
    }

    // Calculate score for each participant
    const leaderboard = quiz.responses.map((response: any) => {
      const answers = response.answers as Array<{ questionId: number; answer: number }>;

      let totalScore = 0;
      const questionScores: Array<{ questionId: number; answer: number | null; score: number }> = [];

      quiz.questions.forEach((q) => {
        const studentAnswer = answers.find((a: any) => a.questionId === q.questionId)?.answer;

        if (studentAnswer === undefined || studentAnswer === null) {
          // No answer = maximum penalty (8 points)
          questionScores.push({ questionId: q.questionId, answer: null, score: 8 });
          totalScore += 8;
          return;
        }

        // Calculate score: |student - correct| using minimum if two correct answers
        let score = 0;
        if (q.question.correctAnswer !== null && q.question.correctAnswer !== undefined) {
          score = Math.abs(studentAnswer - q.question.correctAnswer);

          // If there's a second correct answer, use the minimum
          if (q.question.correctAnswer2 !== null && q.question.correctAnswer2 !== undefined) {
            const score2 = Math.abs(studentAnswer - q.question.correctAnswer2);
            score = Math.min(score, score2);
          }
        }

        // Cap at 8 points maximum
        score = Math.min(score, 8);

        questionScores.push({ questionId: q.questionId, answer: studentAnswer, score });
        totalScore += score;
      });

      return {
        participantId: response.participant.id,
        participantName: response.participant.name,
        participantEmail: response.participant.email,
        totalScore,
        questionScores,
        submittedAt: response.submittedAt,
      };
    });

    // Sort by total score (lower is better)
    leaderboard.sort((a, b) => a.totalScore - b.totalScore);

    // Add rank
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    return rankedLeaderboard;
  },
};
