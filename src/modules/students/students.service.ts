import { prisma } from "../../prisma";
import { eventsService } from "../events/events.service";

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
};