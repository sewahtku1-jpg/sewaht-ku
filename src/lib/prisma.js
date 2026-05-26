import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

const prismaClientSingleton = () => {
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }
  const pool = new Pool({ 
    connectionString,
    connectionTimeoutMillis: 30000,
    max: 15
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
