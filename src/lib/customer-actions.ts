"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { getSession } from "./session";
import { can } from "./rbac";

async function assertCanManage() {
  const session = await getSession();
  if (!session || !can(session.role, "customers:manage")) {
    throw new Error("Not authorized");
  }
}

export interface CustomerFormState {
  error?: string;
}

function readCustomer(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    company: String(formData.get("company") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    city: String(formData.get("city") ?? "").trim() || null,
    country: String(formData.get("country") ?? "").trim() || "USA",
  };
}

export async function createCustomer(
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  await assertCanManage();
  const data = readCustomer(formData);
  if (!data.name) return { error: "Customer name is required." };

  const customer = await prisma.customer.create({ data });
  revalidatePath("/customers");
  redirect(`/customers/${customer.id}`);
}

export async function updateCustomer(
  id: string,
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  await assertCanManage();
  const data = readCustomer(formData);
  if (!data.name) return { error: "Customer name is required." };

  await prisma.customer.update({ where: { id }, data });
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  redirect(`/customers/${id}`);
}
