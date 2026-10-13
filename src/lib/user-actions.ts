"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { getSession } from "./session";
import { hashPassword } from "./auth";
import { can, isRole, ROLES } from "./rbac";

async function assertAdmin() {
  const session = await getSession();
  if (!session || !can(session.role, "users:manage")) {
    throw new Error("Not authorized");
  }
  return session;
}

export interface UserFormState {
  error?: string;
  success?: string;
}

export async function createUser(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  await assertAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const role = String(formData.get("role") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !role || !password) {
    return { error: "All fields are required." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  if (!isRole(role)) {
    return { error: "Choose a valid role." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "A user with that email already exists." };
  }

  await prisma.user.create({
    data: { name, email, role, passwordHash: await hashPassword(password) },
  });

  revalidatePath("/users");
  // Static string so it can be translated on the client.
  return { success: "User created successfully." };
}

export async function setUserActive(formData: FormData) {
  const session = await assertAdmin();
  const userId = String(formData.get("userId") ?? "");
  const active = String(formData.get("active") ?? "") === "true";

  if (userId === session.id) return; // never deactivate yourself
  await prisma.user.update({ where: { id: userId }, data: { active } });
  revalidatePath("/users");
}

export async function setUserRole(formData: FormData) {
  const session = await assertAdmin();
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!isRole(role)) return;
  if (userId === session.id) return; // don't change your own role (lockout guard)
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/users");
}

export const ROLE_OPTIONS = ROLES;
