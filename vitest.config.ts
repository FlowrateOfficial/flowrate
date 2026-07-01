import { createRequire } from 'node:module'
import { config } from 'dotenv'
import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

config({ path: resolve(__dirname, '.env.dev') })

const require = createRequire(import.meta.url)

export default defineConfig({
  resolve: {
    alias: {
      '#shared': resolve(__dirname, 'shared'),
      '~~': resolve(__dirname),
      h3: require.resolve('h3')
    }
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', '.nuxt', '.output', 'dist']
  }
})
