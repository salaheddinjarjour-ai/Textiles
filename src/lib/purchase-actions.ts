"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { getSession } from "./session";
import { can } from "./rbac";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

async function requirePurchasing() {
  const session = await getSession();
  if (!session || !can(session.role, "purchases:manage")) {
    throw new Error("Not authorized");
  }
  return session;
}

export interface POFormState {
  error?: string;
}

interface LineInput {
  productId: string;
  quantity: number;
}

export async function createPurchaseOrder(
  _prev: POFormState,
  formData: FormData,
): Promise<POFormState> {
  const session = await requirePurchasing();

  const supplierId = String(formData.get("supplierId") ?? "");
  let parsed: LineInput[] = [];
  try {
    parsed = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Could not read the order items." };
  }

  if (!supplierId) return { error: "Please choose a supplier." };
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
    const unitCost = p.costPrice;
    return { productId: p.id, quantity, unitCost, lineTotal: round2(unitCost * quantity) };
  });
  const total = round2(items.reduce((s, i) => s + i.lineTotal, 0));

  const count = await prisma.purchaseOrder.count();
  const now = new Date();
  const ym = `${now.getFullYear().toString().slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const poNumber = `PO-${ym}-${1001 + count}`;

  const author = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true },
  });

  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber,
      supplierId,
      status: "PENDING",
      total,
      createdById: author?.id ?? null,
      items: { create: items },
    },
  });

  revalidatePath("/purchases");
  redirect(`/purchases/${po.id}`);
}

/** Receive a PO: add each line's quantity into a warehouse and mark RECEIVED. */
export async function receivePurchaseOrder(poId: string, formData: FormData) {
  await requirePurchasing();
  const warehouseId = String(formData.get("warehouseId") ?? "");
  if (!warehouseId) return;

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: { items: { include: { product: true } } },
  });
  if (!po || po.status !== "PENDING") return;

  for (const item of po.items) {
    const lotNumber = `${po.poNumber}-${item.product.sku}`;
    const existing = await prisma.stock.findFirst({
      where: { productId: item.productId, warehouseId, lotNumber },
    });
    if (existing) {
      await prisma.stock.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + item.quantity },
      });
    } else {
      await prisma.stock.create({
        data: {
          productId: item.productId,
          warehouseId,
          lotNumber,
          quantity: item.quantity,
        },
      });
    }
  }

  await prisma.purchaseOrder.update({
    where: { id: poId },
    data: { status: "RECEIVED" },
  });

  revalidatePath("/purchases");
  revalidatePath(`/purchases/${poId}`);
  revalidatePath("/inventory");
}

export async function cancelPurchaseOrder(formData: FormData) {
  await requirePurchasing();
  const poId = String(formData.get("poId") ?? "");
  const po = await prisma.purchaseOrder.findUnique({ where: { id: poId } });
  if (!po || po.status !== "PENDING") return;
  await prisma.purchaseOrder.update({ where: { id: poId }, data: { status: "CANCELLED" } });
  revalidatePath("/purchases");
  revalidatePath(`/purchases/${poId}`);
}
