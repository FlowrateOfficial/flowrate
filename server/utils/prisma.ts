/// <reference types="node" />
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '~/generated/prisma/client'

// Singleton pattern — avoids exhausting the connection pool during hot reloads.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  // PrismaNeon v7 accepts a PoolConfig object directly
  const adapter = new PrismaNeon({ connectionString })
  return new PrismaClient({ adapter })
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

