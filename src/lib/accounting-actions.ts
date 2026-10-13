"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { getSession } from "./session";
import { can } from "./rbac";
import { PAYMENT_METHODS } from "./constants";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

async function assertCanManage() {
  const session = await getSession();
  if (!session || !can(session.role, "accounting:manage")) {
    throw new Error("Not authorized");
  }
}

export interface PaymentFormState {
  error?: string;
}

export async function recordPayment(
  invoiceId: string,
  _prev: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  await assertCanManage();

  const amount = round2(parseFloat(String(formData.get("amount") ?? "0")));
  const method = String(formData.get("method") ?? "Bank Transfer");
  const reference = String(formData.get("reference") ?? "").trim() || null;

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a payment amount greater than zero." };
  }
  if (!(PAYMENT_METHODS as readonly string[]).includes(method)) {
    return { error: "Choose a valid payment method." };
  }

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return { error: "Invoice not found." };

  const remaining = round2(invoice.amount - invoice.amountPaid);
  if (remaining <= 0) return { error: "This invoice is already fully paid." };

  const applied = Math.min(amount, remaining);
  const newPaid = round2(invoice.amountPaid + applied);
  const status = newPaid >= invoice.amount - 0.005 ? "PAID" : "PARTIAL";

  // Cloudflare D1 does not support transactions, so these run sequentially.
  // The invoice total is updated last: if it fails, the payment row still
  // exists and the balance can be recomputed, which is the safer ordering.
  await prisma.payment.create({
    data: {
      invoiceId,
      customerId: invoice.customerId,
      amount: applied,
      method,
      reference,
    },
  });
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { amountPaid: newPaid, status },
  });

  revalidatePath("/accounting");
  revalidatePath(`/accounting/invoices/${invoiceId}`);
  return {};
}

export async function createTransaction(formData: FormData) {
  await assertCanManage();

  const type = String(formData.get("type") ?? "EXPENSE");
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const amount = round2(parseFloat(String(formData.get("amount") ?? "0")));

  if (!category || !Number.isFinite(amount) || amount <= 0) return;
  if (type !== "INCOME" && type !== "EXPENSE") return;

  await prisma.transaction.create({
    data: { type, category, description, amount },
  });
  revalidatePath("/accounting");
}
