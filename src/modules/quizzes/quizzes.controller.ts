import { Request, Response } from "express";
import { quizzesService } from "./quizzes.service";
import { AuthRequest } from "../../middleware/auth";

export const quizzesController = {
  async getAllQuestions(req: Request, res: Response) {
    try {
      const questions = await quizzesService.getAllQuestions();
      return res.json(questions);
    } catch (error) {
      console.error("Get questions error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  async createQuestion(req: AuthRequest, res: Response) {
    try {
      const { text, correctAnswer } = req.body;

      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Question text required" });
      }

      const question = await quizzesService.createQuestion(text, correctAnswer);
      return res.status(201).json(question);
    } catch (error) {
      console.error("Create question error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  async updateQuestion(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { text, correctAnswer } = req.body;

      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Question text required" });
      }

      const question = await quizzesService.updateQuestion(id, text, correctAnswer);
      return res.json(question);
    } catch (error) {
      console.error("Update question error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  async deleteQuestion(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await quizzesService.deleteQuestion(id);
      return res.status(204).send();
    } catch (error) {
      console.error("Delete question error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  async createQuiz(req: AuthRequest, res: Response) {
    try {
      const { sessionId, questionIds } = req.body;

      if (!sessionId || !questionIds || !Array.isArray(questionIds)) {
        return res.status(400).json({
          error: "sessionId and questionIds (array) are required",
        });
      }

      const quiz = await quizzesService.createQuiz(
        parseInt(sessionId),
        questionIds
      );
      return res.status(201).json(quiz);
    } catch (error: any) {
      console.error("Create quiz error:", error);
      if (error.message === "EXACTLY_10_QUESTIONS_REQUIRED") {
        return res.status(400).json({ error: "Exactly 10 questions required" });
      }
      if (error.message === "QUIZ_ALREADY_EXISTS") {
        return res
          .status(400)
          .json({ error: "Quiz already exists for this session" });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  async getQuizBySessionId(req: Request, res: Response) {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const quiz = await quizzesService.getQuizBySessionId(sessionId);

      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      return res.json(quiz);
    } catch (error) {
      console.error("Get quiz error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  async submit(req: AuthRequest, res: Response) {
    try {
      const quizId = parseInt(req.params.id);
      const { answers } = req.body;
      const userId = req.auth!.userId;

      if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({ error: "Answers array required" });
      }

      const response = await quizzesService.submitQuiz(userId, quizId, answers);
      return res.status(201).json(response);
    } catch (error: any) {
      console.error("Quiz submit error:", error);
      if (error.message === "ALREADY_SUBMITTED") {
        return res.status(400).json({ error: "Quiz already submitted" });
      }
      if (error.message === "EXACTLY_10_ANSWERS_REQUIRED") {
        return res.status(400).json({ error: "Exactly 10 answers required" });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  async getResults(req: Request, res: Response) {
    try {
      const quizId = parseInt(req.params.id);
      const results = await quizzesService.getResults(quizId);

      if (!results) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      return res.json(results);
    } catch (error) {
      console.error("Get results error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  async getStatistics(req: Request, res: Response) {
    try {
      const quizId = parseInt(req.params.id);
      const stats = await quizzesService.getStatistics(quizId);
      return res.json(stats);
    } catch (error: any) {
      console.error("Get statistics error:", error);
      if (error.message === "QUIZ_NOT_FOUND") {
        return res.status(404).json({ error: "Quiz not found" });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  async deleteQuiz(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await quizzesService.deleteQuiz(id);
      return res.status(204).send();
    } catch (error) {
      console.error("Delete quiz error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  async updateQuiz(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { questionIds } = req.body;

      if (!questionIds || !Array.isArray(questionIds)) {
        return res.status(400).json({ error: "questionIds array required" });
      }

      if (questionIds.length !== 10) {
        return res.status(400).json({ error: "Exactly 10 questions required" });
      }

      const quiz = await quizzesService.updateQuiz(id, questionIds);
      return res.json(quiz);
    } catch (error) {
      console.error("Update quiz error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
};
