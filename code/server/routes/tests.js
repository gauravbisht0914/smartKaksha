import { Router } from 'express'
import { z } from 'zod'
import { Attempt, Chapter, Practice, Test, User } from '../models.js'
import { requireAuth } from '../middleware.js'
import { createRetest, createWeeklyTest, httpError, submitAttempt } from '../services/learning.js'
import { publicQuestion } from '../logic/scoring.js'

const router = Router()

const generateSchema = z.object({
  chapterId: z.string().min(1),
  lectureIds: z.array(z.string()).optional(),
  questionsPerConcept: z.coerce.number().int().min(1).max(3).default(2),
  title: z.string().trim().optional(),
  week: z.coerce.number().int().min(1).default(1),
})

const canStudentSee = (test, user) =>
  test.kind === 'weekly' ? test.published : String(test.student) === String(user._id)

router.get('/tests', requireAuth(), async (req, res) => {
  const isTeacher = req.user.role === 'teacher'
  const filter = isTeacher
    ? { kind: 'weekly' }
    : { $or: [{ kind: 'weekly', published: true }, { kind: 'retest', student: req.user._id }] }
  const tests = await Test.find(filter).select('-questions.explanation -questions.distractorNotes').sort({ createdAt: -1 }).lean()
  const chapters = await Chapter.find().select('title subject').lean()
  const attempts = await Attempt.find(isTeacher ? { test: { $in: tests.map((t) => t._id) } } : { student: req.user._id })
    .select('test student percent improvement')
    .lean()

  res.json({
    tests: tests.map((t) => {
      const chapter = chapters.find((c) => String(c._id) === String(t.chapter))
      const forTest = attempts.filter((a) => String(a.test) === String(t._id))
      const mine = forTest.find((a) => String(a.student) === String(req.user._id))
      return {
        _id: t._id,
        title: t.title,
        week: t.week,
        kind: t.kind,
        published: t.published,
        source: t.source,
        chapter: chapter && { _id: chapter._id, title: chapter.title, subject: chapter.subject },
        questionCount: t.questions.length,
        concepts: [...new Set(t.questions.map((q) => q.concept))],
        createdAt: t.createdAt,
        attemptCount: forTest.length,
        averagePercent: forTest.length ? Math.round(forTest.reduce((s, a) => s + a.percent, 0) / forTest.length) : null,
        myAttempt: mine ? { _id: mine._id, percent: mine.percent, improvement: mine.improvement } : null,
      }
    }),
  })
})

router.post('/tests/generate', requireAuth('teacher'), async (req, res) => {
  const parsed = generateSchema.safeParse(req.body)
  if (!parsed.success) throw httpError(400, parsed.error.issues[0].message)
  const { chapterId, lectureIds, questionsPerConcept, title, week } = parsed.data
  const chapter = await Chapter.findById(chapterId).lean()
  if (!chapter) throw httpError(404, 'Chapter not found.')
  const test = await createWeeklyTest({ chapter, lectureIds, perConcept: questionsPerConcept, title, week })
  res.status(201).json({ test })
})

router.get('/tests/:id', requireAuth(), async (req, res) => {
  const test = await Test.findById(req.params.id).lean()
  if (!test) throw httpError(404, 'Test not found.')
  const chapter = await Chapter.findById(test.chapter).select('title subject').lean()
  const base = {
    _id: test._id,
    title: test.title,
    week: test.week,
    kind: test.kind,
    published: test.published,
    source: test.source,
    chapter,
  }

  if (req.user.role === 'teacher') return res.json({ test: { ...base, questions: test.questions } })

  if (!canStudentSee(test, req.user)) throw httpError(404, 'Test not found.')
  const done = await Attempt.findOne({ test: test._id, student: req.user._id }).select('_id').lean()
  res.json({ test: { ...base, questions: test.questions.map(publicQuestion), attemptId: done?._id ?? null } })
})

router.patch('/tests/:id', requireAuth('teacher'), async (req, res) => {
  const update = {}
  if (typeof req.body.published === 'boolean') update.published = req.body.published
  if (typeof req.body.title === 'string' && req.body.title.trim()) update.title = req.body.title.trim()
  const test = await Test.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).select('-questions').lean()
  if (!test) throw httpError(404, 'Test not found.')
  res.json({ test })
})

router.delete('/tests/:id', requireAuth('teacher'), async (req, res) => {
  await Promise.all([Test.findByIdAndDelete(req.params.id), Attempt.deleteMany({ test: req.params.id })])
  res.json({ ok: true })
})

router.get('/tests/:id/results', requireAuth('teacher'), async (req, res) => {
  const test = await Test.findById(req.params.id).select('title questions.concept').lean()
  if (!test) throw httpError(404, 'Test not found.')
  const attempts = await Attempt.find({ test: test._id }).sort({ percent: -1 }).lean()
  const students = await User.find({ _id: { $in: attempts.map((a) => a.student) } }).select('name').lean()
  res.json({
    results: attempts.map((a) => ({
      attemptId: a._id,
      studentId: a.student,
      studentName: students.find((s) => String(s._id) === String(a.student))?.name ?? 'Student',
      score: a.score,
      total: a.total,
      percent: a.percent,
      weakConcepts: (a.analysis?.weakConcepts ?? []).map((w) => w.concept),
      createdAt: a.createdAt,
    })),
  })
})

const answersSchema = z.object({
  answers: z.array(z.object({ questionId: z.string(), selectedIndex: z.number().int().min(-1).max(3) })),
})

router.post('/tests/:id/attempt', requireAuth('student'), async (req, res) => {
  const test = await Test.findById(req.params.id)
  if (!test || !canStudentSee(test, req.user)) throw httpError(404, 'Test not found.')
  const parsed = answersSchema.safeParse(req.body)
  if (!parsed.success) throw httpError(400, 'Invalid answers.')

  const existing = await Attempt.findOne({ test: test._id, student: req.user._id }).select('_id').lean()
  if (existing) return res.status(409).json({ error: 'You have already submitted this test.', attemptId: existing._id })

  const attempt = await submitAttempt({ student: req.user._id, test, answers: parsed.data.answers })
  res.status(201).json({ attemptId: attempt._id })
})

router.get('/attempts/:id', requireAuth(), async (req, res) => {
  const attempt = await Attempt.findById(req.params.id).lean()
  if (!attempt) throw httpError(404, 'Result not found.')
  const isOwner = String(attempt.student) === String(req.user._id)
  if (!isOwner && req.user.role !== 'teacher') throw httpError(404, 'Result not found.')

  const [test, chapter, student, practice, retestTest, baseline] = await Promise.all([
    Test.findById(attempt.test).lean(),
    Chapter.findById(attempt.chapter).select('title subject').lean(),
    User.findById(attempt.student).select('name').lean(),
    Practice.findOne({ attempt: attempt._id }).select('status answers maxItems').lean(),
    Test.findOne({ parentAttempt: attempt._id, kind: 'retest' }).select('_id').lean(),
    attempt.baselineAttempt ? Attempt.findById(attempt.baselineAttempt).select('percent test').lean() : null,
  ])
  const retestAttempt = retestTest ? await Attempt.findOne({ test: retestTest._id }).select('percent improvement').lean() : null

  res.json({
    attempt: {
      _id: attempt._id,
      kind: attempt.kind,
      score: attempt.score,
      total: attempt.total,
      percent: attempt.percent,
      conceptBreakdown: attempt.conceptBreakdown,
      analysis: attempt.analysis,
      improvement: attempt.improvement,
      createdAt: attempt.createdAt,
    },
    test: { _id: test._id, title: test.title, kind: test.kind, week: test.week },
    chapter,
    student,
    review: test.questions.map((q) => {
      const a = attempt.answers.find((x) => String(x.questionId) === String(q._id))
      return {
        _id: q._id,
        concept: q.concept,
        difficulty: q.difficulty,
        prompt: q.prompt,
        options: q.options,
        selectedIndex: a?.selectedIndex ?? -1,
        correctIndex: q.correctIndex,
        correct: Boolean(a?.correct),
        explanation: q.explanation,
      }
    }),
    practice: practice && { _id: practice._id, status: practice.status, answered: practice.answers.length, maxItems: practice.maxItems },
    retest: retestTest && { testId: retestTest._id, attemptId: retestAttempt?._id ?? null, percent: retestAttempt?.percent ?? null },
    baseline: baseline && { _id: baseline._id, percent: baseline.percent },
  })
})

router.post('/attempts/:id/retest', requireAuth('student'), async (req, res) => {
  const attempt = await Attempt.findOne({ _id: req.params.id, student: req.user._id })
  if (!attempt) throw httpError(404, 'Result not found.')
  const test = await createRetest(attempt)
  res.status(201).json({ testId: test._id })
})

export default router
