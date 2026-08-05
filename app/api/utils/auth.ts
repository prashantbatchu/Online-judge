import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export type SessionUser = {
  userId: string;
  role: "user" | "admin";
};

/**
 * Reads and verifies the session cookie. Returns null if there is no
 * session or the token is invalid/expired — callers decide how to respond
 * (401, redirect, etc). This is the ONLY source of truth for "who is making
 * this request" — routes must never trust a userId/role passed in the
 * request body or query string.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token || !process.env.JWT_SECRET) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      userId: string;
      role?: "user" | "admin";
    };

    if (!decoded?.userId) return null;

    return { userId: decoded.userId, role: decoded.role ?? "user" };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<
  { ok: true; user: SessionUser } | { ok: false; status: number; message: string }
> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, status: 401, message: "You must be logged in to do this." };
  }
  return { ok: true, user };
}

export async function requireAdmin(): Promise<
  { ok: true; user: SessionUser } | { ok: false; status: number; message: string }
> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, status: 401, message: "You must be logged in to do this." };
  }
  if (user.role !== "admin") {
    return { ok: false, status: 403, message: "Admin access required." };
  }
  return { ok: true, user };
}
