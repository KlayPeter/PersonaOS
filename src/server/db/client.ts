import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

declare global {
  var __personaPrisma: PrismaClient | undefined;
}

let prismaSingleton: PrismaClient | undefined;

function buildAdapter() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("缺少 DATABASE_URL，无法初始化 Prisma adapter。");
  }

  const parsed = new URL(databaseUrl);

  return new PrismaMariaDb({
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
  });
}

export function getPrismaClient() {
  if (prismaSingleton) {
    return prismaSingleton;
  }

  if (globalThis.__personaPrisma) {
    prismaSingleton = globalThis.__personaPrisma;
    return prismaSingleton;
  }

  prismaSingleton = new PrismaClient({
    adapter: buildAdapter(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalThis.__personaPrisma = prismaSingleton;
  }

  return prismaSingleton;
}
