import { UserRole } from "@prisma/client";
import { prisma } from "../../prisma";
import bcrypt from "bcryptjs";
import { sendApprovalEmail } from "./registration.mail.service";
import crypto from "crypto";


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
  async getAllRegistrations() {
    const registrations = await prisma.registration.findMany({
      orderBy: { createdAt: "desc" },
    });
    return registrations;
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
        name: `${registration.firstName} ${registration.lastName}`,
        email: registration.email,
        passwordHash: passwordHash,
        role: UserRole.PARTICIPANT,
        registrationId: registration.id,
        qrId: qrId,
      },
    });

    await sendApprovalEmail(user.email,user.name,randomPassword);

    return updatedRegistration;
  },

  async rejectRegistration(id: number) {
    const registration = await prisma.registration.update({
      where: { id },
      data: { status: "REJECTED" },
    });
    return registration;
  },

  async createRegistration(data: RegistrationInput) {
    if (data.email !== data.confirmEmail) {
      const error = new Error("EMAIL_MISMATCH");
      throw error;
    }

    //TODO: check if email already exists

    const registration = await prisma.registration.create({
      data: {
        salutation: data.salutation,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        confirmEmail: data.confirmEmail,
        street: data.street,
        addressExtra: data.addressExtra ?? null,
        zipCode: data.zipCode,
        city: data.city,
        school: data.school,
        grade: data.grade,
        motivation: data.motivation ?? null,
        comments: data.comments ?? null,
        // status = PENDING (default)
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    return registration;
  },
};