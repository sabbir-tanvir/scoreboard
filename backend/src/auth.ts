import jwt from "jsonwebtoken";
import { JWT_EXPIRES_IN, JWT_SECRET } from "./config/env.js";

type AuthPayload = {
  email: string;
  role: "admin";
};

export function createAdminToken(email: string): string {
  const payload: AuthPayload = { email, role: "admin" };
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAdminToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    if (decoded.role !== "admin") {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function getBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}
