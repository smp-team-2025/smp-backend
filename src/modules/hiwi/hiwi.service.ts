import { prisma } from "../../prisma";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

type CreateHiwiInput = {
  email: string;
  name: string;
  clothingSize?: string | null;
};

type UpdateHiwiInput = {
  name?: string | null;
  clothingSize?: string | null;
};

function generatePassword(length = 10) {
  return crypto.randomBytes(32).toString("base64url").slice(0, length);
}

export const hiwiService = {
  async list() {
    return prisma.hiWi.findMany({
      include: {
        user: { select: { id: true, email: true, name: true, role: true, createdAt: true } },
      },
      orderBy: { id: "asc" },
    });
  },

  async getById(hiwiId: number) {
    return prisma.hiWi.findUnique({
      where: { id: hiwiId },
      include: {
        user: { select: { id: true, email: true, name: true, role: true, createdAt: true } },
      },
    });
  },

  async create(input: CreateHiwiInput) {
    //Email Check
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    const plainPassword = generatePassword(10);
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const createdUser = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        role: UserRole.HIWI,
        hiwi: {
          create: {
            clothingSize: input.clothingSize ?? null,
          },
        },
      },
      include: {
        hiwi: true,
      },
    });

    // TODO: Change this as email
    console.log("======================================");
    console.log("[HIWI CREATED]");
    console.log("email:", createdUser.email);
    console.log("password:", plainPassword);
    console.log("======================================");

    return {
      user: { id: createdUser.id, email: createdUser.email, name: createdUser.name, role: createdUser.role },
      hiwi: createdUser.hiwi,
    };
  },

  async update(hiwiId: number, input: UpdateHiwiInput) {
    const hiwi = await prisma.hiWi.findUnique({ where: { id: hiwiId }, include: { user: true } });
    if (!hiwi) return null;

    const [updatedUser, updatedHiwi] = await prisma.$transaction([
      prisma.user.update({
        where: { id: hiwi.userId },
        data: {
          ...(input.name !== undefined ? { name: input.name ?? "" } : {}),
        },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      }),
      prisma.hiWi.update({
        where: { id: hiwiId },
        data: {
          ...(input.clothingSize !== undefined ? { clothingSize: input.clothingSize ?? null } : {}),
        },
      }),
    ]);

    return { user: updatedUser, hiwi: updatedHiwi };
  },

  async remove(hiwiId: number) {
    const hiwi = await prisma.hiWi.findUnique({ where: { id: hiwiId } });
    if (!hiwi) return false;

    await prisma.$transaction([
      prisma.hiWi.delete({ where: { id: hiwiId } }),
      prisma.user.delete({ where: { id: hiwi.userId } }),
    ]);

    return true;
  },
};