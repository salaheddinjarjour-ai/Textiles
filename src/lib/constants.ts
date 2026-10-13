// Domain option lists. SQLite has no enums, so these are validated in code.

export const CATEGORIES = [
  "Cotton",
  "Linen",
  "Denim",
  "Satin",
  "Polyester",
  "Silk",
  "Wool",
] as const;

export const UNITS = ["Roll", "Meter", "Yard"] as const;

export const ORDER_STATUSES = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "CANCELLED",
] as const;

export const PO_STATUSES = ["PENDING", "RECEIVED", "CANCELLED"] as const;

export const INVOICE_STATUSES = ["UNPAID", "PARTIAL", "PAID"] as const;

export const PAYMENT_METHODS = [
  "Bank Transfer",
  "Check",
  "Card",
  "Cash",
] as const;

export const DEFAULT_TAX_RATE = 0.085; // 8.5%
