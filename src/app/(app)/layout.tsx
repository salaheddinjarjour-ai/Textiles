import { requireSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { NAV_ITEMS, ADMIN_NAV_ITEMS } from "@/lib/nav";
import { Sidebar } from "@/components/app-shell/sidebar";
import { Topbar } from "@/components/app-shell/topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSession();

  const items = NAV_ITEMS.filter((i) => can(user.role, i.permission));
  const adminItems = ADMIN_NAV_ITEMS.filter((i) => can(user.role, i.permission));

  return (
    <div className="flex min-h-screen w-full bg-[var(--background)]">
      <Sidebar items={items} adminItems={adminItems} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
