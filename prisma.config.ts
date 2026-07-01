// ANCHOR: Prisma config — migrations and datasource
import { config } from 'dotenv'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'prisma/config'

const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.dev'
const envPath = resolve(process.cwd(), envFile)
if (existsSync(envPath)) {
  config({ path: envPath })
}

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
