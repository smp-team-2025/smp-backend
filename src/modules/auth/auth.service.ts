import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../prisma";
import { generateRandomPassword } from "../../utils/password";
import { sendForgotPasswordEmail } from "./auth.mail.service";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export const authService = {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    console.log("DEBUG user from DB:", user);

    if (!user) {
      const error = new Error("INVALID_CREDENTIALS");
      throw error;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      const error = new Error("INVALID_CREDENTIALS");
      throw error;
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );
    console.log("DEBUG payload role:", user.role);

    const { passwordHash, ...safeUser } = user;

    return { user: safeUser, token };
  },

  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) return;

    const newPlainPassword = generateRandomPassword(12);
    const newPasswordHash = await bcrypt.hash(newPlainPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
      },
    });

    await sendForgotPasswordEmail(user.email, user.name, newPlainPassword);
  },
};