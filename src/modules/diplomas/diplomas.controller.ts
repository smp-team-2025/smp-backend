import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { diplomaService } from "./diplomas.service";
import { diplomaPdfService } from "./diplomas.pdf.service";
import { UserRole } from "@prisma/client";

export const diplomasController = {
  /**
   * POST /api/diplomas/issue
   * Issue diploma for a participant in an event
   * Organizer only
   */
  async issue(req: AuthRequest, res: Response) {
    const { participantId, eventId } = req.body;

    if (!participantId || !eventId) {
      return res.status(400).json({
        error: "PARTICIPANT_ID_AND_EVENT_ID_REQUIRED",
      });
    }

    try {
      const diploma = await diplomaService.issueDiploma(participantId, eventId);

      return res.status(201).json(diploma);
    } catch (error: any) {
      console.error("Issue diploma error:", error);
      if (error.message === "INVALID_PARTICIPANT") {
        return res.status(404).json({ error: "PARTICIPANT_NOT_FOUND" });
      }
      if (error.message === "EVENT_NOT_FOUND") {
        return res.status(404).json({ error: "EVENT_NOT_FOUND" });
      }
      if (error.message === "PARTICIPANT_NOT_ELIGIBLE") {
        return res.status(400).json({ error: "PARTICIPANT_NOT_ELIGIBLE" });
      }
      if (error.message === "DIPLOMA_ALREADY_ISSUED") {
        return res.status(400).json({ error: "DIPLOMA_ALREADY_ISSUED" });
      }
      return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
  },

  /**
   * GET /api/diplomas/check-eligibility/:participantId/:eventId
   * Check if participant is eligible for diploma
   * Organizer or own eligibility
   */
  async checkEligibility(req: AuthRequest, res: Response) {
    const participantId = parseInt(req.params.participantId);
    const eventId = parseInt(req.params.eventId);
    const auth = req.auth;

    if (isNaN(participantId) || isNaN(eventId)) {
      return res.status(400).json({ error: "INVALID_PARAMETERS" });
    }

    if (!auth) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    // Participants can only check their own eligibility
    if (auth.role === UserRole.PARTICIPANT && auth.userId !== participantId) {
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    try {
      const eligibility = await diplomaService.checkEligibility(
        participantId,
        eventId
      );
      return res.json(eligibility);
    } catch (error: any) {
      console.error("Check eligibility error:", error);
      if (error.message === "INVALID_PARTICIPANT") {
        return res.status(404).json({ error: "PARTICIPANT_NOT_FOUND" });
      }
      if (error.message === "EVENT_NOT_FOUND") {
        return res.status(404).json({ error: "EVENT_NOT_FOUND" });
      }
      return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
  },

  /**
   * GET /api/diplomas/:participantId/:eventId
   * Get diploma info and download PDF
   * Organizer or own diploma
   */
  async download(req: AuthRequest, res: Response) {
    const participantId = parseInt(req.params.participantId);
    const eventId = parseInt(req.params.eventId);
    const auth = req.auth;

    if (isNaN(participantId) || isNaN(eventId)) {
      return res.status(400).json({ error: "INVALID_PARAMETERS" });
    }

    if (!auth) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    // Participants can only download their own diploma
    if (auth.role === UserRole.PARTICIPANT && auth.userId !== participantId) {
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    try {
      // Check if diploma exists
      const diploma = await diplomaService.getDiploma(participantId, eventId);

      if (!diploma) {
        return res.status(404).json({ error: "DIPLOMA_NOT_ISSUED" });
      }

      // Generate PDF
      const { pdf, fileName } = await diplomaPdfService.generateDiplomaPdf(
        participantId,
        eventId
      );

      // Send PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
      return res.status(200).send(pdf);
    } catch (error: any) {
      console.error("Download diploma error:", error);
      if (error.message === "DIPLOMA_NOT_FOUND") {
        return res.status(404).json({ error: "DIPLOMA_NOT_FOUND" });
      }
      return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
  },

  /**
   * GET /api/diplomas/certificate/:certificateNumber
   * Get diploma by certificate number (for verification)
   * Public endpoint
   */
  async getByCertificateNumber(req: AuthRequest, res: Response) {
    const { certificateNumber } = req.params;

    if (!certificateNumber) {
      return res.status(400).json({ error: "CERTIFICATE_NUMBER_REQUIRED" });
    }

    try {
      const diploma = await diplomaService.getDiplomaByCertificateNumber(
        certificateNumber
      );

      if (!diploma) {
        return res.status(404).json({ error: "CERTIFICATE_NOT_FOUND" });
      }

      // Return basic info for verification
      return res.json({
        certificateNumber: diploma.certificateNumber,
        participantName: diploma.participant.name,
        eventTitle: diploma.event.title,
        issuedAt: diploma.issuedAt,
        valid: true,
      });
    } catch (error) {
      console.error("Get diploma by certificate error:", error);
      return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
  },

  /**
   * GET /api/diplomas/event/:eventId/eligible
   * List eligible participants for an event
   * Organizer only
   */
  async listEligible(req: AuthRequest, res: Response) {
    const eventId = parseInt(req.params.eventId);

    if (isNaN(eventId)) {
      return res.status(400).json({ error: "INVALID_EVENT_ID" });
    }

    try {
      const eligible = await diplomaService.listEligibleParticipants(eventId);
      return res.json(eligible);
    } catch (error) {
      console.error("List eligible error:", error);
      return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
  },

  /**
   * GET /api/diplomas/event/:eventId/issued
   * List issued diplomas for an event
   * Organizer only
   */
  async listIssued(req: AuthRequest, res: Response) {
    const eventId = parseInt(req.params.eventId);

    if (isNaN(eventId)) {
      return res.status(400).json({ error: "INVALID_EVENT_ID" });
    }

    try {
      const diplomas = await diplomaService.listIssuedDiplomas(eventId);
      return res.json(diplomas);
    } catch (error) {
      console.error("List issued diplomas error:", error);
      return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
  },

  /**
   * GET /api/diplomas/event/:eventId/statistics
   * Get diploma statistics for an event
   * Organizer only
   */
  async getStatistics(req: AuthRequest, res: Response) {
    const eventId = parseInt(req.params.eventId);

    if (isNaN(eventId)) {
      return res.status(400).json({ error: "INVALID_EVENT_ID" });
    }

    try {
      const stats = await diplomaService.getEventStatistics(eventId);
      return res.json(stats);
    } catch (error) {
      console.error("Get statistics error:", error);
      return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
  },

  /**
   * GET /api/diplomas/participant/:participantId
   * Get all diplomas for a participant
   * Organizer or own diplomas
   */
  async getParticipantDiplomas(req: AuthRequest, res: Response) {
    const participantId = parseInt(req.params.participantId);
    const auth = req.auth;

    if (isNaN(participantId)) {
      return res.status(400).json({ error: "INVALID_PARTICIPANT_ID" });
    }

    if (!auth) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    // Participants can only view their own diplomas
    if (auth.role === UserRole.PARTICIPANT && auth.userId !== participantId) {
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    try {
      const diplomas = await diplomaService.getParticipantDiplomas(
        participantId
      );
      return res.json(diplomas);
    } catch (error) {
      console.error("Get participant diplomas error:", error);
      return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
  },

  /**
   * DELETE /api/diplomas/:participantId/:eventId
   * Delete/revoke a diploma
   * Organizer only
   */
  async delete(req: AuthRequest, res: Response) {
    const participantId = parseInt(req.params.participantId);
    const eventId = parseInt(req.params.eventId);

    if (isNaN(participantId) || isNaN(eventId)) {
      return res.status(400).json({ error: "INVALID_PARAMETERS" });
    }

    try {
      await diplomaService.deleteDiploma(participantId, eventId);
      return res.status(204).send();
    } catch (error: any) {
      console.error("Delete diploma error:", error);
      if (error.message === "DIPLOMA_NOT_FOUND") {
        return res.status(404).json({ error: "DIPLOMA_NOT_FOUND" });
      }
      return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
  },
};