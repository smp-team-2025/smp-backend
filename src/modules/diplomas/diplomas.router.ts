import { Router } from "express";
import { diplomasController } from "./diplomas.controller";
import { requireAuth, requireRole } from "../../middleware/auth";
import { UserRole } from "@prisma/client";

export const diplomasRouter = Router();

// POST /api/diplomas/issue - Issue diploma (Organizer only)
diplomasRouter.post(
  "/issue",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  diplomasController.issue
);

// GET /api/diplomas/check-eligibility/:participantId/:eventId
// Check eligibility (Organizer or own)
diplomasRouter.get(
  "/check-eligibility/:participantId/:eventId",
  requireAuth,
  diplomasController.checkEligibility
);

// GET /api/diplomas/certificate/:certificateNumber
// Verify certificate (Public - for verification purposes)
diplomasRouter.get(
  "/certificate/:certificateNumber",
  requireAuth,
  diplomasController.getByCertificateNumber
);

// GET /api/diplomas/event/:eventId/eligible
// List eligible participants for event (Organizer only)
diplomasRouter.get(
  "/event/:eventId/eligible",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  diplomasController.listEligible
);

// GET /api/diplomas/event/:eventId/issued
// List issued diplomas for event (Organizer only)
diplomasRouter.get(
  "/event/:eventId/issued",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  diplomasController.listIssued
);

// GET /api/diplomas/event/:eventId/statistics
// Get statistics for event (Organizer only)
diplomasRouter.get(
  "/event/:eventId/statistics",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  diplomasController.getStatistics
);

// GET /api/diplomas/participant/:participantId
// Get all diplomas for participant (Organizer or own)
diplomasRouter.get(
  "/participant/:participantId",
  requireAuth,
  diplomasController.getParticipantDiplomas
);

// GET /api/diplomas/:participantId/:eventId
// Download diploma PDF (Organizer or own diploma)
diplomasRouter.get(
  "/:participantId/:eventId",
  requireAuth,
  diplomasController.download
);

// DELETE /api/diplomas/:participantId/:eventId
// Delete/revoke diploma (Organizer only)
diplomasRouter.delete(
  "/:participantId/:eventId",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  diplomasController.delete
);

diplomasRouter.get(
  "/event/:eventId/issued.csv",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  diplomasController.exportIssuedCsv
);