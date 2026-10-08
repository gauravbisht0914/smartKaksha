import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

for (const file of ['.env', '.env.local', '.env.development.local']) {
  const path = resolve(process.cwd(), file)
  if (!existsSync(path)) continue
  try {
    process.loadEnvFile(path)
  } catch {
    // unreadable env file: fall back to the process environment
  }
}
