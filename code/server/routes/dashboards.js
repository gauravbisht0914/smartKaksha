import { Router } from 'express'
import { Attempt, Chapter, Lecture, Mastery, Practice, Test, User } from '../models.js'
import { requireAuth } from '../middleware.js'
import { httpError } from '../services/learning.js'
import { aiStatus } from '../ai/index.js'

const router = Router()
const same = (a, b) => String(a) === String(b)
const avg = (nums) => (nums.length ? Math.round(nums.reduce((s, n) => s + n, 0) / nums.length) : null)
const WEAK_MASTERY = 0.6

router.get('/health', (_req, res) => res.json({ ok: true, ai: aiStatus() }))

function summarizeStudent(student, attempts, masteries, chapters) {
  const mine = attempts.filter((a) => same(a.student, student._id)).sort((a, b) => a.createdAt - b.createdAt)
  const weekly = mine.filter((a) => a.kind === 'weekly')
  const retests = mine.filter((a) => a.kind === 'retest' && a.improvement)
  const weakConcepts = masteries
    .filter((m) => same(m.student, student._id) && m.score < WEAK_MASTERY)
    .sort((a, b) => a.score - b.score)
    .map((m) => ({
      concept: m.concept,
      chapter: chapters.find((c) => same(c._id, m.chapter))?.title,
      mastery: Math.round(m.score * 100),
    }))
  const mastery = masteries.filter((m) => same(m.student, student._id))

  return {
    _id: student._id,
    name: student.name,
    email: student.email,
    testsTaken: mine.length,
    averagePercent: avg(weekly.map((a) => a.percent)),
    latestPercent: mine.length ? mine[mine.length - 1].percent : null,
    trend: mine.map((a) => a.percent),
    weakConcepts,
    averageMastery: mastery.length ? Math.round((mastery.reduce((s, m) => s + m.score, 0) / mastery.length) * 100) : null,
    improvement: retests.length ? avg(retests.map((a) => a.improvement.delta)) : null,
    retestCount: retests.length,
  }
}

router.get('/teacher/overview', requireAuth('teacher'), async (_req, res) => {
  const [students, attempts, masteries, chapters, lectures, tests, practices] = await Promise.all([
    User.find({ role: 'student' }).lean(),
    Attempt.find().lean(),
    Mastery.find().lean(),
    Chapter.find().lean(),
    Lecture.find().select('status chapter').lean(),
    Test.find({ kind: 'weekly' }).select('title week chapter published').sort({ week: 1, createdAt: 1 }).lean(),
    Practice.find().select('status').lean(),
  ])

  const summaries = students.map((s) => summarizeStudent(s, attempts, masteries, chapters))
  const retestAttempts = attempts.filter((a) => a.kind === 'retest' && a.improvement)

  const conceptMap = new Map()
  for (const m of masteries) {
    const key = `${m.chapter}:${m.concept}`
    const row = conceptMap.get(key) ?? { concept: m.concept, chapterId: m.chapter, scores: [] }
    row.scores.push(m.score)
    conceptMap.set(key, row)
  }
  const classConcepts = [...conceptMap.values()]
    .map((r) => ({
      concept: r.concept,
      chapter: chapters.find((c) => same(c._id, r.chapterId))?.title,
      mastery: Math.round((r.scores.reduce((s, n) => s + n, 0) / r.scores.length) * 100),
      weakStudents: r.scores.filter((s) => s < WEAK_MASTERY).length,
      students: r.scores.length,
    }))
    .sort((a, b) => a.mastery - b.mastery)

  res.json({
    stats: {
      students: students.length,
      lectures: lectures.filter((l) => l.status === 'ready').length,
      chapters: chapters.length,
      tests: tests.length,
      averageScore: avg(attempts.filter((a) => a.kind === 'weekly').map((a) => a.percent)),
      averageImprovement: avg(retestAttempts.map((a) => a.improvement.delta)),
      practiceCompleted: practices.filter((p) => p.status === 'complete').length,
    },
    testSummaries: tests.map((t) => {
      const forTest = attempts.filter((a) => same(a.test, t._id))
      return {
        _id: t._id,
        title: t.title,
        week: t.week,
        published: t.published,
        attempts: forTest.length,
        averagePercent: avg(forTest.map((a) => a.percent)),
      }
    }),
    classConcepts,
    needsAttention: summaries
      .filter((s) => s.averagePercent != null)
      .sort((a, b) => a.averagePercent - b.averagePercent)
      .slice(0, 4),
    topImprovers: summaries
      .filter((s) => s.improvement != null)
      .sort((a, b) => b.improvement - a.improvement)
      .slice(0, 3),
  })
})

router.get('/teacher/students', requireAuth('teacher'), async (_req, res) => {
  const [students, attempts, masteries, chapters] = await Promise.all([
    User.find({ role: 'student' }).sort({ name: 1 }).lean(),
    Attempt.find().lean(),
    Mastery.find().lean(),
    Chapter.find().lean(),
  ])
  res.json({ students: students.map((s) => summarizeStudent(s, attempts, masteries, chapters)) })
})

router.get('/teacher/students/:id', requireAuth('teacher'), async (req, res) => {
  const student = await User.findOne({ _id: req.params.id, role: 'student' }).lean()
  if (!student) throw httpError(404, 'Student not found.')
  const [attempts, masteries, chapters, tests, practices] = await Promise.all([
    Attempt.find({ student: student._id }).sort({ createdAt: 1 }).lean(),
    Mastery.find({ student: student._id }).lean(),
    Chapter.find().lean(),
    Test.find().select('title kind week').lean(),
    Practice.find({ student: student._id }).select('attempt status answers').lean(),
  ])

  const summary = summarizeStudent(student, attempts, masteries, chapters)
  const latestWithWeakness = [...attempts].reverse().find((a) => a.analysis?.weakConcepts?.length)

  res.json({
    student: summary,
    attempts: attempts.map((a) => ({
      _id: a._id,
      title: tests.find((t) => same(t._id, a.test))?.title ?? 'Test',
      kind: a.kind,
      percent: a.percent,
      score: a.score,
      total: a.total,
      improvement: a.improvement,
      createdAt: a.createdAt,
      weakConcepts: (a.analysis?.weakConcepts ?? []).map((w) => w.concept),
      practice: (() => {
        const p = practices.find((x) => same(x.attempt, a._id))
        return p ? { status: p.status, answered: p.answers.length } : null
      })(),
    })),
    mastery: masteries
      .map((m) => ({
        concept: m.concept,
        chapter: chapters.find((c) => same(c._id, m.chapter))?.title,
        mastery: Math.round(m.score * 100),
        attempts: m.attempts,
        history: m.history.map((h) => Math.round(h.score * 100)),
      }))
      .sort((a, b) => a.mastery - b.mastery),
    latestAnalysis: latestWithWeakness
      ? { summary: latestWithWeakness.analysis.summary, weakConcepts: latestWithWeakness.analysis.weakConcepts, studyTip: latestWithWeakness.analysis.studyTip }
      : null,
  })
})

router.get('/student/dashboard', requireAuth('student'), async (req, res) => {
  const me = req.user
  const [tests, attempts, masteries, practices, chapters, lectures, user] = await Promise.all([
    Test.find({ $or: [{ kind: 'weekly', published: true }, { kind: 'retest', student: me._id }] })
      .select('title kind week chapter parentAttempt questions.concept')
      .sort({ week: 1, createdAt: 1 })
      .lean(),
    Attempt.find({ student: me._id }).sort({ createdAt: -1 }).lean(),
    Mastery.find({ student: me._id }).lean(),
    Practice.find({ student: me._id }).select('attempt status answers maxItems').lean(),
    Chapter.find().select('title subject').lean(),
    Lecture.find({ status: 'ready' }).select('title chapter week createdAt').sort({ createdAt: -1 }).lean(),
    User.findById(me._id).select('missedLectures').lean(),
  ])

  const attempted = new Set(attempts.map((a) => String(a.test)))
  const chapterTitle = (id) => chapters.find((c) => same(c._id, id))?.title
  const retests = tests.filter((t) => t.kind === 'retest')

  const pendingTests = tests
    .filter((t) => !attempted.has(String(t._id)))
    .map((t) => ({
      _id: t._id,
      title: t.title,
      kind: t.kind,
      week: t.week,
      chapter: chapterTitle(t.chapter),
      questionCount: t.questions.length,
      concepts: [...new Set(t.questions.map((q) => q.concept))],
    }))

  const nextSteps = attempts
    .filter((a) => a.analysis?.weakConcepts?.length)
    .slice(0, 4)
    .map((a) => {
      const practice = practices.find((p) => same(p.attempt, a._id))
      const retest = retests.find((t) => same(t.parentAttempt, a._id))
      const retestDone = retest && attempted.has(String(retest._id))
      return {
        attemptId: a._id,
        title: tests.find((t) => same(t._id, a.test))?.title ?? 'Test',
        percent: a.percent,
        weakConcepts: a.analysis.weakConcepts.map((w) => w.concept),
        practice: practice ? { _id: practice._id, status: practice.status, answered: practice.answers.length, maxItems: practice.maxItems } : null,
        retest: retest ? { testId: retest._id, done: Boolean(retestDone) } : null,
      }
    })
    .filter((s) => !s.retest?.done)

  const weak = masteries
    .filter((m) => m.score < WEAK_MASTERY)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
    .map((m) => ({ concept: m.concept, chapter: chapterTitle(m.chapter), mastery: Math.round(m.score * 100) }))

  const withImprovement = attempts.filter((a) => a.improvement)
  const missedIds = new Set((user.missedLectures ?? []).map(String))

  res.json({
    stats: {
      testsTaken: attempts.length,
      averagePercent: avg(attempts.filter((a) => a.kind === 'weekly').map((a) => a.percent)),
      averageMastery: masteries.length ? Math.round((masteries.reduce((s, m) => s + m.score, 0) / masteries.length) * 100) : null,
      improvement: withImprovement.length ? avg(withImprovement.map((a) => a.improvement.delta)) : null,
    },
    pendingTests,
    nextSteps,
    weakConcepts: weak,
    recentAttempts: attempts.slice(0, 4).map((a) => ({
      _id: a._id,
      title: tests.find((t) => same(t._id, a.test))?.title ?? 'Test',
      kind: a.kind,
      percent: a.percent,
      improvement: a.improvement,
      createdAt: a.createdAt,
    })),
    missedLectures: lectures
      .filter((l) => missedIds.has(String(l._id)))
      .slice(0, 3)
      .map((l) => ({ _id: l._id, title: l.title, chapter: chapterTitle(l.chapter) })),
  })
})

router.get('/student/progress', requireAuth('student'), async (req, res) => {
  const [attempts, masteries, chapters, tests] = await Promise.all([
    Attempt.find({ student: req.user._id }).sort({ createdAt: 1 }).lean(),
    Mastery.find({ student: req.user._id }).lean(),
    Chapter.find().select('title').lean(),
    Test.find().select('title').lean(),
  ])
  res.json({
    attempts: attempts.map((a) => ({
      _id: a._id,
      title: tests.find((t) => same(t._id, a.test))?.title ?? 'Test',
      kind: a.kind,
      percent: a.percent,
      improvement: a.improvement,
      createdAt: a.createdAt,
    })),
    mastery: masteries
      .map((m) => ({
        concept: m.concept,
        chapter: chapters.find((c) => same(c._id, m.chapter))?.title,
        mastery: Math.round(m.score * 100),
        attempts: m.attempts,
        history: m.history.map((h) => Math.round(h.score * 100)),
      }))
      .sort((a, b) => a.mastery - b.mastery),
  })
})

router.get('/student/lectures', requireAuth('student'), async (req, res) => {
  const [lectures, chapters, user] = await Promise.all([
    Lecture.find({ status: 'ready' }).select('title chapter week summary concepts createdAt source').sort({ week: -1, createdAt: -1 }).lean(),
    Chapter.find().select('title subject').lean(),
    User.findById(req.user._id).select('missedLectures').lean(),
  ])
  const missed = new Set((user.missedLectures ?? []).map(String))
  res.json({
    lectures: lectures.map((l) => {
      const chapter = chapters.find((c) => same(c._id, l.chapter))
      return {
        _id: l._id,
        title: l.title,
        week: l.week,
        summary: l.summary,
        concepts: l.concepts.map((c) => c.name),
        source: l.source,
        chapter: chapter && { _id: chapter._id, title: chapter.title, subject: chapter.subject },
        missed: missed.has(String(l._id)),
      }
    }),
  })
})

router.post('/student/lectures/:id/missed', requireAuth('student'), async (req, res) => {
  const lecture = await Lecture.exists({ _id: req.params.id })
  if (!lecture) throw httpError(404, 'Lecture not found.')
  const user = await User.findById(req.user._id)
  const has = user.missedLectures.some((id) => same(id, req.params.id))
  if (has) user.missedLectures.pull(req.params.id)
  else user.missedLectures.push(req.params.id)
  await user.save()
  res.json({ missed: !has })
})

export default router
