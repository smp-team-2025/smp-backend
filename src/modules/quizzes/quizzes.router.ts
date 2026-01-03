import { Router } from "express";
import { quizzesController } from "./quizzes.controller";
import { requireAuth, requireRole } from "../../middleware/auth";
import { UserRole } from "@prisma/client";

export const quizzesRouter = Router();

quizzesRouter.get(
  "/questions",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  quizzesController.getAllQuestions
);

quizzesRouter.post(
  "/questions",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  quizzesController.createQuestion
);

quizzesRouter.put(
  "/questions/:id",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  quizzesController.updateQuestion
);

quizzesRouter.delete(
  "/questions/:id",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  quizzesController.deleteQuestion
);

quizzesRouter.post(
  "/",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  quizzesController.createQuiz
);

quizzesRouter.get(
  "/session/:sessionId",
  requireAuth,
  quizzesController.getQuizBySessionId
);

quizzesRouter.post(
  "/:id/submit",
  requireAuth,
  requireRole(UserRole.PARTICIPANT),
  quizzesController.submit
);

quizzesRouter.get(
  "/:id/results",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  quizzesController.getResults
);

quizzesRouter.get(
  "/:id/statistics",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  quizzesController.getStatistics
);

export default quizzesRouter;
