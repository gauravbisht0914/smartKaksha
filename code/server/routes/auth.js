import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { User } from '../models.js'
import { publicUser, requireAuth, signToken } from '../middleware.js'
import { httpError } from '../services/learning.js'

const router = Router()

const signupSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name'),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['teacher', 'student']),
})

router.post('/signup', async (req, res) => {
  const parsed = signupSchema.safeParse(req.body)
  if (!parsed.success) throw httpError(400, parsed.error.issues[0].message)
  const { name, email, password, role } = parsed.data
  if (await User.exists({ email })) throw httpError(409, 'An account with this email already exists.')
  const user = await User.create({ name, email, role, passwordHash: await bcrypt.hash(password, 10) })
  res.status(201).json({ token: signToken(user), user: publicUser(user) })
})

router.post('/login', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const user = await User.findOne({ email })
  const ok = user && (await bcrypt.compare(String(req.body?.password ?? ''), user.passwordHash))
  if (!ok) throw httpError(401, 'Incorrect email or password.')
  res.json({ token: signToken(user), user: publicUser(user) })
})

router.get('/me', requireAuth(), (req, res) => res.json({ user: publicUser(req.user) }))

export default router
