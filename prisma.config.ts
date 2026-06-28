// ANCHOR: Prisma config — migrations and datasource
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations'
  },
  datasource: {
    // NOTE - Prisma generate needs no live DB; fallback URL for CI when DATABASE_URL unset
    url: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/flowrate'
  }
})
