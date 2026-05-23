import dotenv from "dotenv";

dotenv.config();

export const PORT = Number(process.env.PORT ?? 4000);
export const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
export const MONGODB_URI = process.env.MONGODB_URI ?? "";
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "rumon@mail.com";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "00000000";
export const JWT_SECRET = process.env.JWT_SECRET ?? "change-this-jwt-secret";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "1d";
