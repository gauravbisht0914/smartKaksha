import jwt from 'jsonwebtoken'
import { User } from './models.js'

const SECRET = process.env.JWT_SECRET || 'smart-kaksha-dev-secret-change-me'

export const signToken = (user) => jwt.sign({ id: String(user._id) }, SECRET, { expiresIn: '14d' })

export const publicUser = (u) => ({ _id: u._id, name: u.name, email: u.email, role: u.role })

export function requireAuth(...roles) {
  return async (req, res, next) => {
    const header = req.headers.authorization ?? ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) return res.status(401).json({ error: 'Please sign in.' })
    try {
      const { id } = jwt.verify(token, SECRET)
      const user = await User.findById(id).lean()
      if (!user) return res.status(401).json({ error: 'Account not found.' })
      if (roles.length && !roles.includes(user.role)) return res.status(403).json({ error: 'Not allowed for your role.' })
      req.user = user
      next()
    } catch {
      res.status(401).json({ error: 'Session expired. Please sign in again.' })
    }
  }
}

export function errorHandler(err, _req, res, _next) {
  if (err.name === 'CastError') return res.status(404).json({ error: 'Not found.' })
  const status = err.status ?? (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500)
  if (status >= 500) console.error('[smart-kaksha]', err)
  const message = err.code === 'LIMIT_FILE_SIZE' ? 'Audio file is too large (max 18 MB).' : err.message
  res.status(status).json({ error: status >= 500 ? 'Something went wrong on the server.' : message })
}
