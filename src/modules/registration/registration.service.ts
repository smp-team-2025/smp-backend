import { prisma } from "../../prisma";

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