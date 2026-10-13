export type StockLevel = "OUT" | "VERY_LOW" | "LOW" | "OK";

export function stockLevel(qty: number, reorder: number): StockLevel {
  if (qty <= 0) return "OUT";
  if (qty <= reorder * 0.5) return "VERY_LOW";
  if (qty <= reorder) return "LOW";
  return "OK";
}

export const STOCK_LEVEL_META: Record<
  StockLevel,
  { label: string; cls: string }
> = {
  OUT: { label: "Out of stock", cls: "bg-red-100 text-red-700" },
  VERY_LOW: { label: "Very Low", cls: "bg-red-50 text-red-600" },
  LOW: { label: "Low", cls: "bg-amber-50 text-amber-600" },
  OK: { label: "In stock", cls: "bg-green-50 text-green-600" },
};
