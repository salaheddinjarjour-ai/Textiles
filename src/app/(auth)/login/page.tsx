import type { Metadata } from "next";
import { LogoMark } from "@/components/logo";
import { LoginForm } from "./login-form";
import { LanguageSwitcher } from "@/components/app-shell/language-switcher";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("Sign in")} · ${t("TextileHub")}` };
}

const DEMO_ACCOUNTS = [
  { role: "Administrator", email: "admin@textilehub.com" },
  { role: "Manager", email: "manager@textilehub.com" },
  { role: "Sales", email: "sales@textilehub.com" },
  { role: "Warehouse Staff", email: "warehouse@textilehub.com" },
  { role: "Accountant", email: "accounts@textilehub.com" },
];

export default async function LoginPage() {
  const t = await getT();

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="flex items-center gap-3 text-white">
          <div className="rounded-xl bg-white/15 p-1.5 backdrop-blur">
            <LogoMark size={34} />
          </div>
          <div>
            <div className="text-lg font-bold">{t("TextileHub")}</div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-200">
              {t("ERP")}
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-md text-white">
          <h1 className="text-3xl font-bold leading-tight">
            {t("Run your textile business from one place.")}
          </h1>
          <p className="mt-4 text-blue-100">
            {t(
              "Sales, inventory, purchasing and accounting — with role-based access for your whole team.",
            )}
          </p>
          <ul className="mt-6 space-y-2 text-sm text-blue-100">
            <li>• {t("Real-time stock & low-stock alerts")}</li>
            <li>• {t("Orders, invoicing and payments in USD")}</li>
            <li>• {t("Dashboards and reports for every role")}</li>
          </ul>
        </div>

        <div className="text-xs text-blue-200">
          © {new Date().getFullYear()} {t("TextileHub")} {t("ERP")}
        </div>

        {/* decorative rings */}
        <div className="pointer-events-none absolute -end-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -end-10 h-96 w-96 rounded-full border border-white/10" />
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 lg:hidden">
              <LogoMark size={34} />
              <span className="text-lg font-bold text-slate-900">
                {t("TextileHub")}
              </span>
            </div>
            <div className="ms-auto">
              <LanguageSwitcher />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">
            {t("Welcome back")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t("Sign in to your TextileHub account.")}
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>

          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("Demo accounts — password:")}{" "}
              <span className="font-mono text-slate-700" dir="ltr">
                password123
              </span>
            </p>
            <div className="mt-2.5 grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
              {DEMO_ACCOUNTS.map((a) => (
                <div key={a.email} className="flex items-center gap-1.5">
                  <span className="inline-block w-24 shrink-0 font-medium text-slate-700">
                    {t(a.role)}
                  </span>
                  <span
                    className="truncate font-mono text-slate-500"
                    dir="ltr"
                  >
                    {a.email}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
