// Role-based access control for TextileHub.
//
// Five roles form the access hierarchy. Each role is granted a set of
// permissions. Permissions gate both the navigation (what a user sees) and
// server-side data access (what a user can do). Always check permissions on
// the server — the UI gating is only a convenience.

export const ROLES = [
  "ADMIN",
  "MANAGER",
  "SALES",
  "WAREHOUSE",
  "ACCOUNTANT",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  MANAGER: "Manager",
  SALES: "Sales",
  // "Warehouse Staff" rather than "Warehouse" so the role label never collides
  // with the warehouse *location* label when translated.
  WAREHOUSE: "Warehouse Staff",
  ACCOUNTANT: "Accountant",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  ADMIN: "Full access to every module plus user management and settings.",
  MANAGER: "All operational modules and reports. Cannot manage users.",
  SALES: "Sales orders, invoicing and customers.",
  WAREHOUSE: "Inventory, stock receiving, suppliers and purchases.",
  ACCOUNTANT: "Accounting, payments and financial reports.",
};

export type Permission =
  | "dashboard:view"
  | "sales:view"
  | "sales:manage"
  | "customers:view"
  | "customers:manage"
  | "inventory:view"
  | "inventory:manage"
  | "suppliers:view"
  | "suppliers:manage"
  | "purchases:view"
  | "purchases:manage"
  | "accounting:view"
  | "accounting:manage"
  | "reports:view"
  | "users:view"
  | "users:manage"
  | "settings:view";

const ALL_PERMISSIONS: Permission[] = [
  "dashboard:view",
  "sales:view",
  "sales:manage",
  "customers:view",
  "customers:manage",
  "inventory:view",
  "inventory:manage",
  "suppliers:view",
  "suppliers:manage",
  "purchases:view",
  "purchases:manage",
  "accounting:view",
  "accounting:manage",
  "reports:view",
  "users:view",
  "users:manage",
  "settings:view",
];

const PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: ALL_PERMISSIONS,
  MANAGER: [
    "dashboard:view",
    "sales:view",
    "sales:manage",
    "customers:view",
    "customers:manage",
    "inventory:view",
    "inventory:manage",
    "suppliers:view",
    "suppliers:manage",
    "purchases:view",
    "purchases:manage",
    "accounting:view",
    "accounting:manage",
    "reports:view",
    "settings:view",
  ],
  SALES: [
    "dashboard:view",
    "sales:view",
    "sales:manage",
    "customers:view",
    "customers:manage",
    "reports:view",
  ],
  WAREHOUSE: [
    "dashboard:view",
    "inventory:view",
    "inventory:manage",
    "suppliers:view",
    "suppliers:manage",
    "purchases:view",
    "purchases:manage",
  ],
  ACCOUNTANT: [
    "dashboard:view",
    "accounting:view",
    "accounting:manage",
    "sales:view",
    "customers:view",
    "reports:view",
  ],
};

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

/** Returns true if the given role is granted the permission. */
export function can(role: string, permission: Permission): boolean {
  if (!isRole(role)) return false;
  return PERMISSIONS[role].includes(permission);
}

/** Returns every permission a role holds (useful for debugging / UI). */
export function permissionsFor(role: Role): Permission[] {
  return PERMISSIONS[role];
}
