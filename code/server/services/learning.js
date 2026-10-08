import { Attempt, Chapter, Lecture, Mastery, Practice, Test } from '../models.js'
import { analyzeAnswers, makeQuestions } from '../ai/index.js'
import { computeImprovement, findWeakConcepts, gradeAnswers, publicQuestion } from '../logic/scoring.js'
import { applyMastery, baseLevel, pickNext, stepLevel } from '../logic/adaptive.js'

export const httpError = (status, message) => Object.assign(new Error(message), { status })

/** Distinct concepts taught across a chapter's ready lectures (optionally limited to some lectures). */
export async function chapterConcepts(chapterId, lectureIds) {
  const filter = { chapter: chapterId, status: 'ready' }
  if (lectureIds?.length) filter._id = { $in: lectureIds }
  const lectures = await Lecture.find(filter).sort({ week: 1, createdAt: 1 }).lean()
  const seen = new Map()
  for (const lecture of lectures) {
    for (const c of lecture.concepts) if (!seen.has(c.name)) seen.set(c.name, { name: c.name, description: c.description })
  }
  return [...seen.values()]
}

const DIFFICULTY_CYCLE = [2, 1, 3]

export async function createWeeklyTest({ chapter, lectureIds, perConcept, title, week, demo }) {
  const concepts = (await chapterConcepts(chapter._id, lectureIds)).slice(0, 8)
  if (!concepts.length) throw httpError(400, 'Add at least one processed lecture to this chapter first.')

  const plan = concepts.flatMap((c) =>
    Array.from({ length: perConcept }, (_, i) => ({ concept: c.name, difficulty: DIFFICULTY_CYCLE[i % 3] })),
  )
  const { questions, source } = await makeQuestions({
    subject: chapter.subject,
    chapterTitle: chapter.title,
    concepts,
    plan,
    demo,
  })

  return Test.create({
    chapter: chapter._id,
    title: title || `Week ${week} Test: ${chapter.title}`,
    week,
    kind: 'weekly',
    lectures: lectureIds ?? [],
    questions,
    published: false,
    source,
  })
}

export async function submitAttempt({ student, test, answers, demo, createdAt }) {
  const graded = gradeAnswers(test, answers)
  const weak = findWeakConcepts(graded.conceptBreakdown)
  const chapter = await Chapter.findById(test.chapter).lean()
  const concepts = await chapterConcepts(test.chapter)

  const analysis = await analyzeAnswers({
    subject: chapter.subject,
    chapterTitle: chapter.title,
    percent: graded.percent,
    graded,
    weak,
    questions: test.questions,
    concepts,
    demo,
  })

  for (const a of graded.answers) {
    await applyMastery(student, test.chapter, a.concept, a.correct, a.difficulty ?? 2, createdAt)
  }

  let improvement = null
  let baselineAttempt
  if (test.kind === 'retest' && test.parentAttempt) {
    const baseline = await Attempt.findById(test.parentAttempt).lean()
    if (baseline) {
      baselineAttempt = baseline._id
      improvement = computeImprovement(baseline, graded)
    }
  }

  return Attempt.create({
    student,
    test: test._id,
    chapter: test.chapter,
    kind: test.kind,
    answers: graded.answers,
    score: graded.score,
    total: graded.total,
    percent: graded.percent,
    conceptBreakdown: graded.conceptBreakdown,
    analysis,
    baselineAttempt,
    improvement,
    ...(createdAt ? { createdAt } : {}),
  })
}

async function masteryMap(student, chapter, names) {
  const docs = await Mastery.find({ student, chapter, concept: { $in: names } }).lean()
  return Object.fromEntries(docs.map((d) => [d.concept, d.score]))
}

const focusFrom = (attempt) => Object.fromEntries(attempt.analysis.weakConcepts.map((w) => [w.concept, w.misconception]))

/** Create (or return) the retest that targets this attempt's weak concepts at their current adaptive level. */
export async function createRetest(attempt, { demo } = {}) {
  const existing = await Test.findOne({ parentAttempt: attempt._id, kind: 'retest', student: attempt.student })
  if (existing) return existing

  const weak = attempt.analysis.weakConcepts.map((w) => w.concept)
  if (!weak.length) throw httpError(400, 'No weak concepts to retest. Great job!')

  const [chapter, baselineTest, scores] = await Promise.all([
    Chapter.findById(attempt.chapter).lean(),
    Test.findById(attempt.test).lean(),
    masteryMap(attempt.student, attempt.chapter, weak),
  ])
  const concepts = await chapterConcepts(attempt.chapter)

  const plan = weak.flatMap((concept) => {
    const level = baseLevel(scores[concept] ?? 0.5)
    return [
      { concept, difficulty: level },
      { concept, difficulty: Math.max(1, level - 1) },
    ]
  })

  const { questions, source } = await makeQuestions({
    subject: chapter.subject,
    chapterTitle: chapter.title,
    concepts,
    plan,
    avoid: baselineTest.questions.map((q) => q.prompt),
    focus: focusFrom(attempt),
    demo,
  })

  return Test.create({
    chapter: attempt.chapter,
    title: `Retest: ${baselineTest.title.replace(/^Retest:\s*/, '')}`,
    week: baselineTest.week,
    kind: 'retest',
    student: attempt.student,
    parentAttempt: attempt._id,
    questions,
    published: true,
    source,
  })
}

export async function createPractice(attempt, { demo } = {}) {
  const existing = await Practice.findOne({ attempt: attempt._id, student: attempt.student })
  if (existing) return existing

  const weakConcepts = attempt.analysis.weakConcepts
  if (!weakConcepts.length) throw httpError(400, 'No weak concepts to practise. Great job!')

  const names = weakConcepts.map((w) => w.concept)
  const [chapter, scores] = await Promise.all([
    Chapter.findById(attempt.chapter).lean(),
    masteryMap(attempt.student, attempt.chapter, names),
  ])
  const concepts = await chapterConcepts(attempt.chapter)

  const plan = names.slice(0, 3).flatMap((concept) => [1, 1, 2, 2, 3, 3].map((difficulty) => ({ concept, difficulty })))
  const { questions, source } = await makeQuestions({
    subject: chapter.subject,
    chapterTitle: chapter.title,
    concepts,
    plan,
    focus: focusFrom(attempt),
    demo,
  })

  const practice = new Practice({
    student: attempt.student,
    attempt: attempt._id,
    chapter: attempt.chapter,
    concepts: weakConcepts.slice(0, 3),
    pool: questions,
    levels: names.slice(0, 3).map((concept) => ({ concept, level: baseLevel(scores[concept] ?? 0.5) })),
    startMastery: names.slice(0, 3).map((concept) => ({ concept, score: scores[concept] ?? 0.5 })),
    maxItems: Math.min(10, questions.length),
    source,
  })
  const first = pickNext(practice, scores)
  practice.currentQuestionId = first?._id
  if (!first) practice.status = 'complete'
  await practice.save()
  return practice
}

export async function answerPractice(practice, questionId, selectedIndex, at = new Date()) {
  if (practice.status !== 'active') throw httpError(400, 'This practice session is already complete.')
  if (String(practice.currentQuestionId) !== String(questionId)) throw httpError(400, 'That is not the current question.')

  const question = practice.pool.id(questionId)
  const correct = Number(selectedIndex) === question.correctIndex
  question.served = true

  const masteryAfter = await applyMastery(practice.student, practice.chapter, question.concept, correct, question.difficulty, at)
  const state = practice.levels.find((l) => l.concept === question.concept)
  const before = state.level
  stepLevel(state, correct)

  practice.answers.push({
    questionId,
    concept: question.concept,
    difficulty: question.difficulty,
    selectedIndex: Number(selectedIndex),
    correct,
    masteryAfter,
  })

  const names = practice.concepts.map((c) => c.name)
  const scores = await masteryMap(practice.student, practice.chapter, names)
  const next = pickNext(practice, scores)
  practice.currentQuestionId = next?._id
  if (!next) {
    practice.status = 'complete'
    practice.endMastery = names.map((concept) => ({ concept, score: scores[concept] ?? 0.5 }))
  }
  await practice.save()

  return {
    correct,
    correctIndex: question.correctIndex,
    explanation: question.explanation,
    masteryAfter,
    levelChange: state.level - before,
    complete: !next,
    next: next ? publicQuestion(next) : null,
  }
}

export async function practiceView(practice) {
  const names = practice.concepts.map((c) => c.name)
  const scores = await masteryMap(practice.student, practice.chapter, names)
  const chapter = await Chapter.findById(practice.chapter).lean()
  const current = practice.currentQuestionId ? practice.pool.id(practice.currentQuestionId) : null

  return {
    _id: practice._id,
    attemptId: practice.attempt,
    chapterTitle: chapter?.title,
    status: practice.status,
    answered: practice.answers.length,
    maxItems: practice.maxItems,
    concepts: practice.concepts.map((c) => ({
      name: c.name,
      misconception: c.misconception,
      fix: c.fix,
      mastery: scores[c.name] ?? 0.5,
      startMastery: practice.startMastery.find((s) => s.concept === c.name)?.score ?? 0.5,
      level: practice.levels.find((l) => l.concept === c.name)?.level ?? 2,
    })),
    history: practice.answers.map((a) => ({ concept: a.concept, difficulty: a.difficulty, correct: a.correct, masteryAfter: a.masteryAfter })),
    current: current ? publicQuestion(current) : null,
    accuracy: practice.answers.length
      ? Math.round((practice.answers.filter((a) => a.correct).length / practice.answers.length) * 100)
      : null,
  }
}
