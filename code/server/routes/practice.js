import { Router } from 'express'
import { Attempt, Practice } from '../models.js'
import { requireAuth } from '../middleware.js'
import { answerPractice, createPractice, httpError, practiceView } from '../services/learning.js'

const router = Router()

router.post('/attempts/:id/practice', requireAuth('student'), async (req, res) => {
  const attempt = await Attempt.findOne({ _id: req.params.id, student: req.user._id })
  if (!attempt) throw httpError(404, 'Result not found.')
  const practice = await createPractice(attempt)
  res.status(201).json({ practiceId: practice._id })
})

router.get('/practice/:id', requireAuth('student'), async (req, res) => {
  const practice = await Practice.findOne({ _id: req.params.id, student: req.user._id })
  if (!practice) throw httpError(404, 'Practice session not found.')
  res.json({ practice: await practiceView(practice) })
})

router.post('/practice/:id/answer', requireAuth('student'), async (req, res) => {
  const practice = await Practice.findOne({ _id: req.params.id, student: req.user._id })
  if (!practice) throw httpError(404, 'Practice session not found.')
  const { questionId, selectedIndex } = req.body ?? {}
  if (!questionId || !Number.isInteger(selectedIndex)) throw httpError(400, 'Choose an answer first.')
  res.json(await answerPractice(practice, questionId, selectedIndex))
})

export default router
