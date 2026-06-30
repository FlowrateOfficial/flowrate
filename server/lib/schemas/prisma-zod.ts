// ANCHOR: Zod helpers for Prisma enum objects
import { z } from 'zod'
import { enumValues } from '#shared/prisma-enums'

export function zodPrismaEnum<T extends Record<string, string>>(enumObj: T) {
  return z.enum(enumValues(enumObj))
}
