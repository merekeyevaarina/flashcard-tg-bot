
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL не найден");
}

const adapter = new PrismaNeon({ connectionString });

const prismaGlobal = globalThis as typeof globalThis & {
    prisma?: PrismaClient;
};

export const prisma =
    prismaGlobal.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
    prismaGlobal.prisma = prisma;
}
