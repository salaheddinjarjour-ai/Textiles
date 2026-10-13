"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { getSession } from "./session";
import { can } from "./rbac";
import { CATEGORIES, UNITS } from "./constants";

async function assertCanManage() {
  const session = await getSession();
  if (!session || !can(session.role, "inventory:manage")) {
    throw new Error("Not authorized");
  }
}

export interface ProductFormState {
  error?: string;
}

function num(value: FormDataEntryValue | null): number {
  const n = parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : 0;
}

export async function createProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await assertCanManage();

  const name = String(formData.get("name") ?? "").trim();
  const sku = String(formData.get("sku") ?? "")
    .trim()
    .toUpperCase();
  const category = String(formData.get("category") ?? "");
  const unit = String(formData.get("unit") ?? "");
  const color = String(formData.get("color") ?? "").trim() || null;
  const costPrice = num(formData.get("costPrice"));
  const sellPrice = num(formData.get("sellPrice"));
  const reorderLevel = Math.max(0, Math.round(num(formData.get("reorderLevel"))));

  const initialQty = Math.max(0, Math.round(num(formData.get("initialQty"))));
  const warehouseId = String(formData.get("warehouseId") ?? "");
  const lotNumber = String(formData.get("lotNumber") ?? "").trim();

  if (!name || !sku) return { error: "Name and SKU are required." };
  if (!(CATEGORIES as readonly string[]).includes(category)) {
    return { error: "Choose a valid category." };
  }
  if (!(UNITS as readonly string[]).includes(unit)) {
    return { error: "Choose a valid unit." };
  }
  if (sellPrice < 0 || costPrice < 0) {
    return { error: "Prices cannot be negative." };
  }

  const existing = await prisma.product.findUnique({ where: { sku } });
  if (existing) return { error: `SKU "${sku}" is already in use.` };

  const product = await prisma.product.create({
    data: { name, sku, category, unit, color, costPrice, sellPrice, reorderLevel },
  });

  if (initialQty > 0 && warehouseId) {
    await prisma.stock.create({
      data: {
        productId: product.id,
        warehouseId,
        lotNumber: lotNumber || `${sku}-${Date.now().toString().slice(-6)}`,
        quantity: initialQty,
      },
    });
  }

  revalidatePath("/inventory");
  redirect(`/inventory/${product.id}`);
}

/** Add (or remove, via negative delta) stock for a product lot. */
export async function adjustStock(productId: string, formData: FormData) {
  await assertCanManage();

  const warehouseId = String(formData.get("warehouseId") ?? "");
  const lotNumber = String(formData.get("lotNumber") ?? "").trim();
  const delta = Math.round(num(formData.get("delta")));

  if (!warehouseId || !lotNumber || delta === 0) return;

  const existing = await prisma.stock.findFirst({
    where: { productId, warehouseId, lotNumber },
  });

  if (existing) {
    const next = Math.max(0, existing.quantity + delta);
    await prisma.stock.update({
      where: { id: existing.id },
      data: { quantity: next },
    });
  } else if (delta > 0) {
    await prisma.stock.create({
      data: { productId, warehouseId, lotNumber, quantity: delta },
    });
  }

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${productId}`);
}
