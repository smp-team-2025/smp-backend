import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../../prisma";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export const authService = {
  async login(email: string, password: string) {
    //Email Check
    const user = await prisma.user.findUnique({
      where: { email },
    });
    console.log("DEBUG user from DB:", user);  // ← EKLE


    if (!user) {
      const error = new Error("INVALID_CREDENTIALS");
      throw error;
    }

    //Password Check
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      const error = new Error("INVALID_CREDENTIALS");
      throw error;
    }

    //JWT Token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );
    console.log("DEBUG payload role:", user.role); // ← EKLE


    const { passwordHash, ...safeUser } = user;

    return { user: safeUser, token };
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return;

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256(rawToken);
    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: expires,
      },
    });

    //TODO: implement email instead of console
    const link = `http://localhost:5173/login/forgot-password?token=${rawToken}`;
    console.log("[FORGOT_PASSWORD] reset link:", link);
  },

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = sha256(token);

    const user = await prisma.user.findFirst({
      where: {
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: { gt: new Date() },
      },
    });
    if (!user) return false;

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
      },
    });

    return true;
  },
};