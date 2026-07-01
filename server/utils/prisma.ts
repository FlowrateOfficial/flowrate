/// <reference types="node" />
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '~~/generated/prisma/client'

// NOTE - Singleton across HMR in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient
  prismaReplica?: PrismaClient
}

function createPrismaClient(connectionString: string): PrismaClient {
  const adapter = new PrismaNeon({ connectionString })
  return new PrismaClient({ adapter })
}

function primaryUrl(): string {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  return connectionString
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient(primaryUrl())

export const prismaRead: PrismaClient = globalForPrisma.prismaReplica
  ?? (process.env.DATABASE_URL_REPLICA
    ? createPrismaClient(process.env.DATABASE_URL_REPLICA)
    : prisma)

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  if (process.env.DATABASE_URL_REPLICA) {
    globalForPrisma.prismaReplica = prismaRead
  }
}
