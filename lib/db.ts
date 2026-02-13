import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/* eslint-disable no-var */
declare global {
    var prisma: PrismaClient | undefined;
}
/* eslint-enable no-var */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
export const db = globalThis.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
