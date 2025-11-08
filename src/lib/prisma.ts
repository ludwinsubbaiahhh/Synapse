import { PrismaClient } from "@/generated/prisma";

type GlobalWithPrisma = typeof globalThis & {
  prisma?: PrismaClient;
};

const globalWithPrisma = globalThis as GlobalWithPrisma;

export const prisma =
  globalWithPrisma.prisma ??
  (globalWithPrisma.prisma = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  }));

