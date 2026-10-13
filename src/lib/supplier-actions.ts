"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { getSession } from "./session";
import { can } from "./rbac";

async function assertCanManage() {
  const session = await getSession();
  if (!session || !can(session.role, "suppliers:manage")) {
    throw new Error("Not authorized");
  }
}

export interface SupplierFormState {
  error?: string;
}

function readSupplier(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    company: String(formData.get("company") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
  };
}

export async function createSupplier(
  _prev: SupplierFormState,
  formData: FormData,
): Promise<SupplierFormState> {
  await assertCanManage();
  const data = readSupplier(formData);
  if (!data.name) return { error: "Supplier name is required." };

  const supplier = await prisma.supplier.create({ data });
  revalidatePath("/suppliers");
  redirect(`/suppliers/${supplier.id}`);
}

export async function updateSupplier(
  id: string,
  _prev: SupplierFormState,
  formData: FormData,
): Promise<SupplierFormState> {
  await assertCanManage();
  const data = readSupplier(formData);
  if (!data.name) return { error: "Supplier name is required." };

  await prisma.supplier.update({ where: { id }, data });
  revalidatePath("/suppliers");
  revalidatePath(`/suppliers/${id}`);
  redirect(`/suppliers/${id}`);
}
