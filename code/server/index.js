import './env.js'
import http from 'node:http'
import path from 'node:path'
import express from 'express'
import { connectDb } from './db.js'
import { errorHandler } from './middleware.js'
import { seedIfEmpty } from './seed.js'
import { aiStatus } from './ai/index.js'
import authRoutes from './routes/auth.js'
import contentRoutes from './routes/content.js'
import testRoutes from './routes/tests.js'
import practiceRoutes from './routes/practice.js'
import dashboardRoutes from './routes/dashboards.js'

const isProd = process.env.NODE_ENV === 'production'
const port = Number(process.env.PORT) || 3000

const app = express()
const server = http.createServer(app)

app.use(express.json({ limit: '1mb' }))

const api = express.Router()
api.use('/auth', authRoutes)
api.use(contentRoutes)
api.use(testRoutes)
api.use(practiceRoutes)
api.use(dashboardRoutes)
api.use((_req, res) => res.status(404).json({ error: 'Not found.' }))
app.use('/api', api)
app.use('/api', errorHandler)

if (isProd) {
  const dist = path.resolve('dist')
  app.use(express.static(dist))
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')))
} else {
  const { createServer } = await import('vite')
  const vite = await createServer({
    root: path.resolve('client'),
    appType: 'spa',
    server: { middlewareMode: true, hmr: { server }, allowedHosts: true },
  })
  app.use(vite.middlewares)
}

const dbMode = await connectDb()
await seedIfEmpty()

server.listen(port, '0.0.0.0', () => {
  const ai = aiStatus()
  console.log(`[smart-kaksha] http://localhost:${port}  |  db: ${dbMode}  |  ai: ${ai.mode} (${ai.model})`)
})
