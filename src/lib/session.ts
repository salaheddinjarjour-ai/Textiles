import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  verifySessionToken,
  type SessionUser,
} from "./session-token";
import { can, type Permission } from "./rbac";

/** Reads and verifies the current session, or returns null if not logged in. */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Requires a logged-in user; redirects to /login otherwise. */
export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/**
 * Requires a logged-in user who holds the given permission.
 * Redirects to /login if not authenticated, or /dashboard if not authorized.
 */
export async function requirePermission(
  permission: Permission,
): Promise<SessionUser> {
  const session = await requireSession();
  if (!can(session.role, permission)) redirect("/dashboard");
  return session;
}
