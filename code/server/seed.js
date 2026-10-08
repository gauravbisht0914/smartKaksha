import bcrypt from 'bcryptjs'
import { Attempt, Chapter, Lecture, User } from './models.js'
import { C, DEMO_LECTURES } from './ai/demoData.js'
import { answerPractice, createPractice, createRetest, createWeeklyTest, submitAttempt } from './services/learning.js'

export const DEMO_PASSWORD = 'demo1234'
const DAY = 24 * 60 * 60 * 1000
const daysAgo = (n) => new Date(Date.now() - n * DAY)

function rng(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function simulateAnswers(test, random, { weak = [], strongAccuracy = 1 }) {
  return test.questions.map((q) => {
    const isWeak = weak.includes(q.concept)
    const correct = isWeak ? random() < 0.12 : random() < strongAccuracy
    const wrong = q.options.map((_, i) => i).filter((i) => i !== q.correctIndex)
    return { questionId: q._id, selectedIndex: correct ? q.correctIndex : wrong[Math.floor(random() * wrong.length)] }
  })
}

const STUDENTS = [
  {
    name: 'Riya Sharma',
    email: 'student@smartkaksha.demo',
    plan: { w1: [C.calvin, C.limiting], w2: null },
  },
  {
    name: 'Aarav Mehta',
    email: 'aarav@smartkaksha.demo',
    plan: { w1: [C.light], w2: [C.third], remediate: { accuracy: 0.9, day: 8 } },
  },
  {
    name: 'Diya Patel',
    email: 'diya@smartkaksha.demo',
    plan: { w1: [C.calvin, C.chlorophyll], w2: [C.friction], remediate: { accuracy: 0.8, day: 7 } },
  },
  {
    name: 'Kabir Singh',
    email: 'kabir@smartkaksha.demo',
    plan: { w1: [C.limiting, C.light, C.calvin], w2: [C.second, C.friction] },
  },
  {
    name: 'Meera Nair',
    email: 'meera@smartkaksha.demo',
    plan: { w1: [], w2: [C.second] },
  },
  {
    name: 'Rohan Gupta',
    email: 'rohan@smartkaksha.demo',
    plan: { w1: [C.chlorophyll], w2: [C.inertia, C.third], remediate: { accuracy: 0.6, day: 6 } },
  },
]

export async function seedIfEmpty() {
  if (await User.estimatedDocumentCount()) return false

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)
  const teacher = await User.create({ name: 'Ms. Anita Rao', email: 'teacher@smartkaksha.demo', role: 'teacher', passwordHash })
  const students = await User.insertMany(STUDENTS.map((s) => ({ name: s.name, email: s.email, role: 'student', passwordHash })))

  const bio = await Chapter.create({
    title: 'Photosynthesis',
    subject: 'Biology',
    description: 'How plants convert light energy into chemical energy.',
    createdBy: teacher._id,
  })
  const physics = await Chapter.create({
    title: 'Laws of Motion',
    subject: 'Physics',
    description: "Newton's three laws, friction and net force.",
    createdBy: teacher._id,
  })

  const makeLecture = (chapter, week, sample, ago) =>
    Lecture.create({
      chapter: chapter._id,
      title: sample.title,
      week,
      status: 'ready',
      stage: 'Ready',
      fileName: `${sample.key}.mp3`,
      transcript: sample.transcript,
      summary: sample.summary,
      sections: sample.sections,
      keyTerms: sample.keyTerms,
      concepts: sample.concepts,
      source: 'demo',
      createdAt: daysAgo(ago),
    })

  const bioLectures = [await makeLecture(bio, 1, DEMO_LECTURES[0], 15), await makeLecture(bio, 1, DEMO_LECTURES[1], 14)]
  const physLectures = [await makeLecture(physics, 2, DEMO_LECTURES[2], 8), await makeLecture(physics, 2, DEMO_LECTURES[3], 7)]

  const test1 = await createWeeklyTest({ chapter: bio, lectureIds: bioLectures.map((l) => l._id), perConcept: 2, week: 1, demo: true })
  const test2 = await createWeeklyTest({ chapter: physics, lectureIds: physLectures.map((l) => l._id), perConcept: 2, week: 2, demo: true })
  test1.published = true
  test2.published = true
  await Promise.all([test1.save(), test2.save()])

  for (const [index, profile] of STUDENTS.entries()) {
    const student = students[index]
    const random = rng(1000 + index * 77)

    const base = await submitAttempt({
      student: student._id,
      test: test1,
      answers: simulateAnswers(test1, random, { weak: profile.plan.w1 }),
      demo: true,
      createdAt: daysAgo(12),
    })

    if (profile.plan.w2) {
      await submitAttempt({
        student: student._id,
        test: test2,
        answers: simulateAnswers(test2, random, { weak: profile.plan.w2 }),
        demo: true,
        createdAt: daysAgo(5),
      })
    }

    const remediate = profile.plan.remediate
    if (remediate && base.analysis.weakConcepts.length) {
      const practice = await createPractice(base, { demo: true })
      while (practice.status === 'active') {
        const q = practice.pool.id(practice.currentQuestionId)
        const wrong = q.options.map((_, i) => i).filter((i) => i !== q.correctIndex)
        const selected = random() < remediate.accuracy ? q.correctIndex : wrong[0]
        await answerPractice(practice, q._id, selected, daysAgo(remediate.day + 1))
      }
      const retest = await createRetest(base, { demo: true })
      await submitAttempt({
        student: student._id,
        test: retest,
        answers: retest.questions.map((q) => {
          const wrong = q.options.map((_, i) => i).filter((i) => i !== q.correctIndex)
          return { questionId: q._id, selectedIndex: random() < remediate.accuracy ? q.correctIndex : wrong[0] }
        }),
        demo: true,
        createdAt: daysAgo(remediate.day),
      })
    }
  }

  console.log(`[smart-kaksha] Seeded demo class: 1 teacher, ${students.length} students, ${await Attempt.countDocuments()} attempts`)
  return true
}
