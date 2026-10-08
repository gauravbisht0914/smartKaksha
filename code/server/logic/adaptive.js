import { Mastery } from '../models.js'

export const MASTERY_GOAL = 0.85
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))

/** Map a 0-1 mastery score to a starting difficulty (1 easy, 2 medium, 3 hard). */
export const baseLevel = (mastery) => (mastery < 0.4 ? 1 : mastery < 0.7 ? 2 : 3)

/**
 * Exponential-moving-average mastery update weighted by difficulty:
 * hard correct answers lift mastery more, wrong answers on easy items cost more.
 */
export function nextMastery(score, correct, difficulty) {
  const rate = correct ? 0.18 + 0.08 * difficulty : 0.42 - 0.08 * difficulty
  return clamp(score + rate * ((correct ? 1 : 0) - score), 0.02, 0.99)
}

export async function applyMastery(student, chapter, concept, correct, difficulty, at = new Date()) {
  const doc =
    (await Mastery.findOne({ student, chapter, concept })) ?? new Mastery({ student, chapter, concept, score: 0.5 })
  doc.score = nextMastery(doc.score, correct, difficulty)
  doc.attempts += 1
  if (correct) doc.correct += 1
  doc.history.push({ at, score: doc.score })
  if (doc.history.length > 60) doc.history.shift()
  await doc.save()
  return doc.score
}

/** Two right in a row steps difficulty up; two wrong in a row steps it down. */
export function stepLevel(state, correct) {
  if (correct) {
    state.correctStreak += 1
    state.wrongStreak = 0
    if (state.correctStreak >= 2) {
      state.level = Math.min(3, state.level + 1)
      state.correctStreak = 0
    }
  } else {
    state.wrongStreak += 1
    state.correctStreak = 0
    if (state.wrongStreak >= 2) {
      state.level = Math.max(1, state.level - 1)
      state.wrongStreak = 0
    }
  }
  return state
}

/**
 * Choose the next practice question: the least-mastered concept that still has unserved
 * questions, at that concept's current adaptive level.
 */
export function pickNext(practice, scores) {
  const answered = practice.answers.length
  if (answered >= practice.maxItems) return null

  const names = practice.concepts.map((c) => c.name)
  const hasQuestions = (name) => practice.pool.some((q) => q.concept === name && !q.served)
  let open = names.filter((n) => hasQuestions(n) && (scores[n] ?? 0.5) < MASTERY_GOAL)
  if (!open.length && answered < 3) open = names.filter(hasQuestions)
  if (!open.length) return null

  const served = (name) => practice.answers.filter((a) => a.concept === name).length
  open.sort((a, b) => (scores[a] ?? 0.5) - (scores[b] ?? 0.5) || served(a) - served(b))
  const concept = open[0]

  const level = practice.levels.find((l) => l.concept === concept)?.level ?? 2
  const candidates = practice.pool
    .filter((q) => q.concept === concept && !q.served)
    .sort((a, b) => Math.abs(a.difficulty - level) - Math.abs(b.difficulty - level))
  return candidates[0] ?? null
}
