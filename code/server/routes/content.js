import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { Attempt, Chapter, Lecture, Mastery, Practice, Test, User } from '../models.js'
import { requireAuth } from '../middleware.js'
import { httpError } from '../services/learning.js'
import { aiStatus, processLecture } from '../ai/index.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 18 * 1024 * 1024 } })

const chapterSchema = z.object({
  title: z.string().trim().min(2, 'Chapter title is required'),
  subject: z.string().trim().min(1).default('General'),
  description: z.string().trim().default(''),
})

router.get('/chapters', requireAuth(), async (req, res) => {
  const isTeacher = req.user.role === 'teacher'
  const chapters = await Chapter.find().sort({ createdAt: 1 }).lean()
  const lectureFilter = isTeacher ? {} : { status: 'ready' }
  const [lectures, tests] = await Promise.all([
    Lecture.find(lectureFilter).select('chapter status').lean(),
    Test.find({ kind: 'weekly', ...(isTeacher ? {} : { published: true }) }).select('chapter').lean(),
  ])
  res.json({
    chapters: chapters.map((c) => ({
      ...c,
      lectureCount: lectures.filter((l) => String(l.chapter) === String(c._id)).length,
      testCount: tests.filter((t) => String(t.chapter) === String(c._id)).length,
    })),
  })
})

router.post('/chapters', requireAuth('teacher'), async (req, res) => {
  const parsed = chapterSchema.safeParse(req.body)
  if (!parsed.success) throw httpError(400, parsed.error.issues[0].message)
  const chapter = await Chapter.create({ ...parsed.data, createdBy: req.user._id })
  res.status(201).json({ chapter })
})

router.get('/chapters/:id', requireAuth(), async (req, res) => {
  const isTeacher = req.user.role === 'teacher'
  const chapter = await Chapter.findById(req.params.id).lean()
  if (!chapter) throw httpError(404, 'Chapter not found.')

  const lectures = await Lecture.find({ chapter: chapter._id, ...(isTeacher ? {} : { status: 'ready' }) })
    .select('-transcript -sections -keyTerms')
    .sort({ week: 1, createdAt: 1 })
    .lean()

  const tests = await Test.find({ chapter: chapter._id, kind: 'weekly', ...(isTeacher ? {} : { published: true }) })
    .select('-questions.explanation -questions.distractorNotes')
    .sort({ week: 1, createdAt: 1 })
    .lean()
  const attempts = await Attempt.find({ test: { $in: tests.map((t) => t._id) } }).select('test student percent').lean()

  res.json({
    chapter,
    lectures,
    tests: tests.map((t) => {
      const mine = attempts.filter((a) => String(a.test) === String(t._id))
      const own = mine.find((a) => String(a.student) === String(req.user._id))
      return {
        _id: t._id,
        title: t.title,
        week: t.week,
        published: t.published,
        source: t.source,
        questionCount: t.questions.length,
        concepts: [...new Set(t.questions.map((q) => q.concept))],
        attemptCount: mine.length,
        averagePercent: mine.length ? Math.round(mine.reduce((s, a) => s + a.percent, 0) / mine.length) : null,
        myAttempt: own ? { _id: own._id, percent: own.percent } : null,
      }
    }),
  })
})

router.delete('/chapters/:id', requireAuth('teacher'), async (req, res) => {
  const id = req.params.id
  const tests = await Test.find({ chapter: id }).select('_id').lean()
  await Promise.all([
    Lecture.deleteMany({ chapter: id }),
    Test.deleteMany({ chapter: id }),
    Attempt.deleteMany({ chapter: id }),
    Practice.deleteMany({ chapter: id }),
    Mastery.deleteMany({ chapter: id }),
    Chapter.findByIdAndDelete(id),
  ])
  res.json({ ok: true, removedTests: tests.length })
})

async function runLectureJob(lectureId, input) {
  const patch = (fields) => Lecture.updateOne({ _id: lectureId }, { $set: fields })
  try {
    if (aiStatus().mode === 'demo') await new Promise((r) => setTimeout(r, 1500))
    const result = await processLecture({ ...input, onStage: (stage) => patch({ stage }) })
    await patch({
      status: 'ready',
      stage: 'Ready',
      transcript: result.transcript,
      summary: result.summary,
      sections: result.sections,
      keyTerms: result.keyTerms,
      concepts: result.concepts,
      source: result.source,
    })
  } catch (error) {
    console.error('[smart-kaksha] lecture processing failed:', error)
    await patch({ status: 'failed', stage: 'Failed', error: error.message || 'Processing failed' })
  }
}

router.post('/chapters/:id/lectures', requireAuth('teacher'), upload.single('audio'), async (req, res) => {
  const chapter = await Chapter.findById(req.params.id).lean()
  if (!chapter) throw httpError(404, 'Chapter not found.')

  const title = String(req.body.title ?? '').trim()
  if (title.length < 2) throw httpError(400, 'Lecture title is required.')
  const week = Math.max(1, Number(req.body.week) || 1)
  const transcript = String(req.body.transcript ?? '').trim()

  const lecture = await Lecture.create({
    chapter: chapter._id,
    title,
    week,
    status: 'processing',
    stage: 'Queued',
    fileName: req.file?.originalname,
    transcript,
  })

  runLectureJob(lecture._id, {
    title,
    chapterTitle: chapter.title,
    subject: chapter.subject,
    audio: req.file,
    transcript,
  })

  res.status(202).json({ lecture })
})

router.get('/lectures/:id', requireAuth(), async (req, res) => {
  const lecture = await Lecture.findById(req.params.id).lean()
  if (!lecture || (req.user.role === 'student' && lecture.status !== 'ready')) throw httpError(404, 'Lecture not found.')
  const chapter = await Chapter.findById(lecture.chapter).lean()
  const user = await User.findById(req.user._id).select('missedLectures').lean()
  res.json({
    lecture,
    chapter: { _id: chapter._id, title: chapter.title, subject: chapter.subject },
    missed: (user.missedLectures ?? []).some((id) => String(id) === String(lecture._id)),
  })
})

router.delete('/lectures/:id', requireAuth('teacher'), async (req, res) => {
  await Lecture.findByIdAndDelete(req.params.id)
  res.json({ ok: true })
})

export default router
