import { PrismaClient } from "@prisma/client";
// Cloudflare Workers has no filesystem, so the default (Node) Prisma engine
// cannot be used there — it tries to scan disk for a native engine binary.
// `@prisma/client/wasm` is the WebAssembly build, which is what D1 needs.
import { PrismaClient as PrismaClientWasm } from "@prisma/client/wasm";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// The app runs in two very different places:
//
//  • Local dev / seeding  → a plain SQLite file (DATABASE_URL), Node engine.
//  • Cloudflare Workers   → Cloudflare D1 via a request-scoped binding and the
//                           WASM engine, so the client cannot be a module-level
//                           singleton the way it is in Node.
//
// To keep every call site writing plain `prisma.user.findMany()`, we export a
// Proxy that resolves the right client on first property access.

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/** True when executing inside the Cloudflare Workers runtime. */
function isWorkers(): boolean {
  return (
    typeof navigator !== "undefined" &&
    navigator.userAgent === "Cloudflare-Workers"
  );
}

function resolveClient(): PrismaClient {
  if (isWorkers()) {
    const { env } = getCloudflareContext();
    const d1 = (env as unknown as { DB?: D1Database }).DB;
    if (!d1) {
      throw new Error(
        "D1 binding `DB` is missing. Check d1_databases in wrangler.jsonc.",
      );
    }
    // A new client per request: D1 bindings are request-scoped.
    return new PrismaClientWasm({
      adapter: new PrismaD1(d1),
    }) as unknown as PrismaClient;
  }

  // Node: reuse one client across hot reloads.
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log:
        process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = resolveClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
