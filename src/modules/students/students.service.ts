import { prisma } from "../../prisma";
import { eventsService } from "../events/events.service";
import {
  capitalizeName,
  determineParticipantType,
} from "../registration/registration.service";

export type ParticipantUpdateInput = {
  salutation?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  street?: string;
  addressExtra?: string | null;
  zipCode?: string;
  city?: string;
  school?: string;
  grade?: string;
};

// Only these fields may be edited by an organizer
const EDITABLE_FIELDS = [
  "salutation",
  "firstName",
  "lastName",
  "email",
  "street",
  "addressExtra",
  "zipCode",
  "city",
  "school",
  "grade",
] as const;

export const studentsService = {
  async listApprovedStudents(eventId?: number) {
    const effectiveEventId = eventId ?? (await eventsService.getActiveEventId());

    const regs = await prisma.registration.findMany({
      where: {
        status: "APPROVED",
        eventId: effectiveEventId,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        salutation: true,
        firstName: true,
        lastName: true,
        school: true,
        grade: true,
        city: true,
        zipCode: true,
        street: true,
        addressExtra: true,
        createdAt: true,
        status: true,
      },
    });

    const emails = regs.map((r) => r.email);

    const users = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    const userByEmail = new Map(users.map((u) => [u.email, u]));

    return regs.map((r) => ({
      registrationId: r.id,
      userId: userByEmail.get(r.email)?.id ?? null,
      email: r.email,
      firstName: r.firstName,
      lastName: r.lastName,
      school: r.school,
      grade: r.grade,
      city: r.city,
      zipCode: r.zipCode,
      street: r.street,
      addressExtra: r.addressExtra,
      createdAt: r.createdAt,
      status: r.status,
    }));
  },

  async updateParticipant(registrationId: number, input: ParticipantUpdateInput) {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) throw new Error("NOT_FOUND");

    const data: Record<string, string | null> = {};

    for (const field of EDITABLE_FIELDS) {
      const value = input[field];
      if (value === undefined) continue;

      if (field === "addressExtra") {
        const trimmed = typeof value === "string" ? value.trim() : "";
        data.addressExtra = trimmed === "" ? null : trimmed;
        continue;
      }

      const trimmed = String(value ?? "").trim();
      if (trimmed === "") throw new Error("EMPTY_FIELD");
      data[field] = trimmed;
    }

    if (Object.keys(data).length === 0) throw new Error("NO_FIELDS");

    const nextEmail = data.email;
    if (nextEmail && nextEmail !== registration.email) {
      const [registrationTaken, userTaken] = await Promise.all([
        prisma.registration.findUnique({ where: { email: nextEmail } }),
        prisma.user.findUnique({ where: { email: nextEmail } }),
      ]);
      if (registrationTaken || userTaken) throw new Error("EMAIL_ALREADY_REGISTERED");

      // confirmEmail mirrors the e-mail address in the registration form
      data.confirmEmail = nextEmail;
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.registration.update({
        where: { id: registrationId },
        data,
      });

      // Keep the linked login account in sync (name, login e-mail, participant type)
      const user = await tx.user.findUnique({ where: { registrationId } });
      if (user) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            name: capitalizeName(`${updated.firstName} ${updated.lastName}`),
            email: updated.email,
            participantType: determineParticipantType(updated.school, updated.grade),
          },
        });
      }

      return updated;
    });
  },

  async deleteParticipant(registrationId: number) {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { user: { select: { id: true } } },
    });

    if (!registration) throw new Error("NOT_FOUND");

    await prisma.$transaction(async (tx) => {
      // The user has to go first, it references the registration
      if (registration.user) {
        await tx.user.delete({ where: { id: registration.user.id } });
      }
      await tx.registration.delete({ where: { id: registrationId } });
    });
  },
};