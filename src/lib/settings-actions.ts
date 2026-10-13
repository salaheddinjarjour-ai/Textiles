"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { getSession } from "./session";
import { can } from "./rbac";

async function assertCanManageSettings() {
  const session = await getSession();
  // Settings (incl. warehouses) are managed by roles that can view settings —
  // Admin and Manager in the default hierarchy.
  if (!session || !can(session.role, "settings:view")) {
    throw new Error("Not authorized");
  }
}

export async function createWarehouse(formData: FormData) {
  await assertCanManageSettings();
  const name = String(formData.get("name") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim() || null;
  if (!name) return;
  await prisma.warehouse.create({ data: { name, location } });
  revalidatePath("/settings");
}
