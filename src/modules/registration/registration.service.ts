import { RegistrationStatus, UserRole } from "@prisma/client";
import { prisma } from "../../prisma";
import bcrypt from "bcryptjs";
import { sendApprovalEmail } from "./registration.mail.service";
import crypto from "crypto";
import { eventsService } from "../events/events.service";


export type RegistrationInput = {
  salutation: string;
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  street: string;
  addressExtra?: string;
  zipCode: string;
  city: string;
  school: string;
  grade: string;
  motivation?: string;
  comments?: string;
};

export const registrationService = {
  async createRegistration(input: RegistrationInput) {
    if (input.email !== input.confirmEmail) throw new Error("EMAIL_MISMATCH");

    const activeEventId = await eventsService.getActiveEventId();

    return prisma.registration.create({
      data: {
        salutation: input.salutation,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        confirmEmail: input.confirmEmail,
        street: input.street,
        addressExtra: input.addressExtra ?? null,
        zipCode: input.zipCode,
        city: input.city,
        school: input.school,
        grade: input.grade,
        motivation: input.motivation ?? null,
        comments: input.comments ?? null,
        status: RegistrationStatus.PENDING,

        eventId: activeEventId,
      },
    });
  },

  async getAllRegistrations(eventId?: number) {
    const effectiveEventId = eventId ?? (await eventsService.getActiveEventId());

    return prisma.registration.findMany({
      where: { eventId: effectiveEventId },
      orderBy: { createdAt: "desc" },
    });
  },

  async approveAllPendingRegistrations(eventId?: number) {
    const effectiveEventId = eventId ?? (await eventsService.getActiveEventId());

    const result = await prisma.registration.updateMany({
      where: {
        eventId: effectiveEventId,
        status: RegistrationStatus.PENDING,
      },
      data: { status: RegistrationStatus.APPROVED },
    });

    return result.count;
  },



  async getRegistrationById(id: number) {
    const registration = await prisma.registration.findUnique({
      where: { id },
    });
    return registration;
  },

  async approveRegistration(id: number) {
    const registration = await prisma.registration.findUnique({
      where: { id },
    });

    if (!registration) {
      throw new Error("Registration not found");
    }

    const updatedRegistration = await prisma.registration.update({
      where: { id },
      data: { status: "APPROVED" },
    });

    const randomPassword = crypto.randomBytes(12).toString("base64url");
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    //Generating QR ID
    const qrId = crypto.randomUUID();

    const user = await prisma.user.create({
      data: {
        name: `${registration.firstName} ${registration.lastName}`.trim(),
        email: registration.email,
        passwordHash: passwordHash,
        role: UserRole.PARTICIPANT,
        registrationId: registration.id,
        qrId: qrId,
      },
    });

    await sendApprovalEmail(user.email, user.name, randomPassword);

    return updatedRegistration;
  },

  async rejectRegistration(id: number) {
    const registration = await prisma.registration.update({
      where: { id },
      data: { status: "REJECTED" },
    });
    return registration;
  },


};