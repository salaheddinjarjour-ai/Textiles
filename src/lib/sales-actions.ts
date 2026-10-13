"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { getSession } from "./session";
import { can } from "./rbac";
import { ORDER_STATUSES, DEFAULT_TAX_RATE } from "./constants";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

async function requireSales() {
  const session = await getSession();
  if (!session || !can(session.role, "sales:manage")) {
    throw new Error("Not authorized");
  }
  return session;
}

export interface OrderFormState {
  error?: string;
}

interface LineInput {
  productId: string;
  quantity: number;
}

export async function createSalesOrder(
  _prev: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const session = await requireSales();

  const customerId = String(formData.get("customerId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const taxRate = DEFAULT_TAX_RATE;

  let parsed: LineInput[] = [];
  try {
    parsed = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Could not read the order items." };
  }

  if (!customerId) return { error: "Please choose a customer." };
  const lines = parsed.filter((l) => l.productId && l.quantity > 0);
  if (lines.length === 0) {
    return { error: "Add at least one product with a quantity." };
  }

  const products = await prisma.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) } },
  });
  const map = new Map(products.map((p) => [p.id, p]));

  const items = lines.map((l) => {
    const p = map.get(l.productId)!;
    const quantity = Math.max(1, Math.round(l.quantity));
    const unitPrice = p.sellPrice;
    const lineTotal = round2(unitPrice * quantity);
    return {
      productId: p.id,
      quantity,
      unitPrice,
      unitCost: p.costPrice,
      lineTotal,
    };
  });

  const subtotal = round2(items.reduce((s, i) => s + i.lineTotal, 0));
  const taxAmount = round2(subtotal * taxRate);
  const total = round2(subtotal + taxAmount);

  const count = await prisma.salesOrder.count();
  const now = new Date();
  const ym = `${now.getFullYear().toString().slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const orderNumber = `SO-${ym}-${1001 + count}`;

  // Resolve the author defensively — the session user could have been removed.
  const author = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true },
  });

  const order = await prisma.salesOrder.create({
    data: {
      orderNumber,
      customerId,
      status: "PENDING",
      subtotal,
      taxRate,
      taxAmount,
      total,
      notes,
      createdById: author?.id ?? null,
      items: { create: items },
    },
  });

  revalidatePath("/sales");
  redirect(`/sales/${order.id}`);
}

export async function updateOrderStatus(formData: FormData) {
  await requireSales();
  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) return;

  await prisma.salesOrder.update({ where: { id: orderId }, data: { status } });
  revalidatePath("/sales");
  revalidatePath(`/sales/${orderId}`);
}

/** Create an invoice from an order (accounting permission required). */
export async function createInvoiceForOrder(formData: FormData) {
  const session = await getSession();
  if (!session || !can(session.role, "accounting:manage")) {
    throw new Error("Not authorized");
  }
  const orderId = String(formData.get("orderId") ?? "");

  const order = await prisma.salesOrder.findUnique({
    where: { id: orderId },
    include: { invoice: true },
  });
  if (!order || order.invoice) return;

  const now = new Date();
  // Each order has exactly one invoice, so deriving the invoice number from the
  // (unique) order number guarantees a unique invoice number without collisions.
  const invoiceNumber = `INV-${order.orderNumber.replace(/^SO-/, "")}`;

  await prisma.invoice.create({
    data: {
      invoiceNumber,
      salesOrderId: order.id,
      customerId: order.customerId,
      amount: order.total,
      amountPaid: 0,
      status: "UNPAID",
      dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  revalidatePath(`/sales/${orderId}`);
  revalidatePath("/accounting");
}
