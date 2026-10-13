import { redirect } from "next/navigation";

// Middleware normally handles "/", but this is a safe fallback.
export default function RootPage() {
  redirect("/dashboard");
}
