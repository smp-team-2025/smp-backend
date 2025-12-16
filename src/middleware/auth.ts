import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";

//types
export type AuthPayload = {
  userId: number;
  role: UserRole;
};

export type AuthRequest = Request & {
  auth?: AuthPayload;
};


//Helpers
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}


//Middleware
export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, getJwtSecret()) as AuthPayload;
    req.auth = payload;
    next();
  } catch {
    return res.status(401).json({ error: "INVALID_TOKEN" });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    if (!allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    next();
  };
}