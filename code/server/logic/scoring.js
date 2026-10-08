export const WEAK_THRESHOLD = 0.6

const round = (n, digits = 0) => {
  const f = 10 ** digits
  return Math.round(n * f) / f
}

/** Grade submitted answers against a test. Pure backend logic, no AI involved. */
export function gradeAnswers(test, submitted) {
  const byId = new Map(submitted.map((a) => [String(a.questionId), a.selectedIndex]))
  const answers = test.questions.map((q) => {
    const selectedIndex = byId.has(String(q._id)) ? Number(byId.get(String(q._id))) : -1
    return {
      questionId: q._id,
      selectedIndex,
      correct: selectedIndex === q.correctIndex,
      concept: q.concept,
      difficulty: q.difficulty,
    }
  })

  const score = answers.filter((a) => a.correct).length
  const total = answers.length
  const percent = total ? round((score / total) * 100) : 0

  const map = new Map()
  for (const a of answers) {
    const row = map.get(a.concept) ?? { concept: a.concept, correct: 0, total: 0 }
    row.total += 1
    if (a.correct) row.correct += 1
    map.set(a.concept, row)
  }
  const conceptBreakdown = [...map.values()].map((r) => ({ ...r, accuracy: round(r.correct / r.total, 2) }))

  return { answers, score, total, percent, conceptBreakdown }
}

/** Concepts under the weak threshold. If nothing is weak but the score is imperfect, flag the lowest concept. */
export function findWeakConcepts(conceptBreakdown) {
  const weak = conceptBreakdown.filter((c) => c.accuracy < WEAK_THRESHOLD)
  if (weak.length) return weak.sort((a, b) => a.accuracy - b.accuracy).map((c) => c.concept)
  const imperfect = conceptBreakdown.filter((c) => c.accuracy < 1).sort((a, b) => a.accuracy - b.accuracy)
  return imperfect.length ? [imperfect[0].concept] : []
}

const accuracyOn = (breakdown, concepts) => {
  const rows = breakdown.filter((b) => concepts.includes(b.concept))
  const total = rows.reduce((s, r) => s + r.total, 0)
  const correct = rows.reduce((s, r) => s + r.correct, 0)
  return total ? (correct / total) * 100 : null
}

/**
 * Improvement score: change in accuracy on the concepts that were weak in the baseline attempt.
 * Also reports Hake's normalized gain (share of the possible headroom that was recovered).
 */
export function computeImprovement(baseline, retest) {
  const weak = (baseline.analysis?.weakConcepts ?? []).map((w) => w.concept)
  const shared = weak.filter((c) => retest.conceptBreakdown.some((b) => b.concept === c))
  if (!shared.length) return null

  const pre = accuracyOn(baseline.conceptBreakdown, shared)
  const post = accuracyOn(retest.conceptBreakdown, shared)
  if (pre == null || post == null) return null

  const delta = post - pre
  const headroom = 100 - pre
  const normalizedGain = headroom > 0 ? delta / headroom : post >= pre ? 0 : -1

  return {
    concepts: shared,
    pre: round(pre),
    post: round(post),
    delta: round(delta),
    normalizedGain: round(normalizedGain, 2),
    conceptDeltas: shared.map((c) => {
      const p = accuracyOn(baseline.conceptBreakdown, [c])
      const q = accuracyOn(retest.conceptBreakdown, [c])
      return { concept: c, pre: round(p), post: round(q), delta: round(q - p) }
    }),
  }
}

/** Remove answer keys before sending a question to a student. */
export function publicQuestion(q) {
  return {
    _id: q._id,
    concept: q.concept,
    prompt: q.prompt,
    options: q.options,
    difficulty: q.difficulty,
  }
}
