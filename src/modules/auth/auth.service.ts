import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../prisma";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function makeResetToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const pepper = process.env.RESET_TOKEN_PEPPER || "dev-pepper";
  const tokenHash = sha256(token + pepper);
  return { token, tokenHash };
}

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


  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const { token, tokenHash } = makeResetToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 dk

  await prisma.passwordResetToken.create({
    data: { tokenHash, userId: user.id, expiresAt },
  });

  const frontend = process.env.FRONTEND_URL || "http://localhost:5173";

  const link = `${frontend}/reset-password?token=${token}`;


  console.log("[RESET LINK]", link);
},

async resetPassword(token: string, newPassword: string) {
  const pepper = process.env.RESET_TOKEN_PEPPER || "dev-pepper";

  const tokenHash = crypto
    .createHash("sha256")
    .update(token + pepper)
    .digest("hex");

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!record) throw new Error("INVALID_TOKEN");
  if (record.usedAt) throw new Error("TOKEN_USED");
  if (record.expiresAt < new Date()) throw new Error("TOKEN_EXPIRED");

  const newHash = await bcrypt.hash(newPassword, 10);

  
  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash: newHash },
  });

  await prisma.passwordResetToken.update({
    where: { tokenHash },
    data: { usedAt: new Date() },
  });
}

};