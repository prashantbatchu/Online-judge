import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

type SessionPayload = {
  userId: string;
  role: "user" | "admin";
};

/**
 * Signs a session JWT (embedding userId + role so API routes can authorize
 * requests without trusting anything the client sends) and sets it as an
 * httpOnly cookie.
 */
export const setCookie = async (userId: string, role: "user" | "admin" = "user") => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  const payload: SessionPayload = { userId, role };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return token;
};
