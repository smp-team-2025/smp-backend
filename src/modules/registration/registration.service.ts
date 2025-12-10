import { prisma } from "../../prisma";
import bcrypt from "bcryptjs";

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
  // Issue #32: Get all registrations
  async getAllRegistrations() {
    const registrations = await prisma.registration.findMany({
      orderBy: { createdAt: "desc" },
    });
    return registrations;
  },

  // Issue #33: Get registration by ID
  async getRegistrationById(id: number) {
    const registration = await prisma.registration.findUnique({
      where: { id },
    });
    return registration;
  },

  // Issue #34: Approve registration
  // Issue #22: Create User with random password on approve
  async approveRegistration(id: number) {
    // 1. Get registration data
    const registration = await prisma.registration.findUnique({
      where: { id },
    });

    if (!registration) {
      throw new Error("Registration not found");
    }

    // 2. Update status to APPROVED
    const updatedRegistration = await prisma.registration.update({
      where: { id },
      data: { status: "APPROVED" },
    });

    // 3. Generate random password (8 characters)
    const randomPassword = Math.random().toString(36).slice(-8);

    // 4. Hash the password
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    // 5. Create User account
    const user = await prisma.user.create({
      data: {
        name: `${registration.firstName} ${registration.lastName}`,
        email: registration.email,
        passwordHash: passwordHash,
        role: "participant",
      },
    });

    // Issue #23: Log password to console (later: send via email)
    console.log("========================================");
    console.log("NEW USER CREATED:");
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${randomPassword}`);
    console.log("========================================");

    return updatedRegistration;
  },

  // Issue #35: Reject registration
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