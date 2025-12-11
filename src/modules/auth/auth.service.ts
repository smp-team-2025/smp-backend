import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../prisma";

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
};