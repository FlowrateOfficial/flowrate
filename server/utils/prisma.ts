/// <reference types="node" />
// ANCHOR: Prisma client singleton — avoids pool exhaustion on hot reload
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '~~/generated/prisma/client'

// NOTE - Singleton across HMR in development
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  // NOTE - PrismaNeon v7 accepts PoolConfig object directly
  const adapter = new PrismaNeon({ connectionString })
  return new PrismaClient({ adapter })
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

