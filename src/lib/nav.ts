import type { Permission } from "./rbac";

export interface NavItem {
  label: string;
  href: string;
  /** Permission required to see this item. */
  permission: Permission;
  /** lucide-react icon name (resolved in the Sidebar component). */
  icon: string;
}

// Primary navigation, mirroring the modules in the reference design.
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", permission: "dashboard:view", icon: "LayoutDashboard" },
  { label: "Sales", href: "/sales", permission: "sales:view", icon: "TrendingUp" },
  { label: "Inventory", href: "/inventory", permission: "inventory:view", icon: "Boxes" },
  { label: "Customers", href: "/customers", permission: "customers:view", icon: "Users" },
  { label: "Suppliers", href: "/suppliers", permission: "suppliers:view", icon: "Truck" },
  { label: "Purchases", href: "/purchases", permission: "purchases:view", icon: "ShoppingCart" },
  { label: "Accounting", href: "/accounting", permission: "accounting:view", icon: "DollarSign" },
  { label: "Reports", href: "/reports", permission: "reports:view", icon: "BarChart3" },
];

// Admin-only navigation shown in a separate group.
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Users", href: "/users", permission: "users:view", icon: "UserCog" },
  { label: "Settings", href: "/settings", permission: "settings:view", icon: "Settings" },
];
