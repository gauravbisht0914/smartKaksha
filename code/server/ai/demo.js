import { DEMO_LECTURES, QUESTION_BANK } from './demoData.js'

const PAD_DISTRACTORS = [
  'It describes a process that only happens in special laboratory conditions.',
  'It is a measurement unit rather than a scientific idea.',
  'It has no connection to the topic covered in this chapter.',
]

function pickLecture(title, hint = '') {
  const text = `${title} ${hint}`.toLowerCase()
  let best = null
  let bestScore = 0
  for (const lecture of DEMO_LECTURES) {
    const score = lecture.keywords.reduce((s, k) => s + (text.includes(k) ? 1 : 0), 0)
    if (score > bestScore) {
      best = lecture
      bestScore = score
    }
  }
  if (best) return best
  const hash = [...text].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7)
  return DEMO_LECTURES[hash % DEMO_LECTURES.length]
}

export function demoLecture({ title, chapterTitle, transcript }) {
  const sample = pickLecture(title, chapterTitle)
  return {
    transcript: transcript?.trim() || sample.transcript,
    summary: sample.summary,
    sections: sample.sections,
    keyTerms: sample.keyTerms,
    concepts: sample.concepts,
  }
}

function genericQuestion(concept, concepts) {
  const target = concepts.find((c) => c.name === concept)
  const distractors = concepts.filter((c) => c.name !== concept).map((c) => c.description)
  for (const pad of PAD_DISTRACTORS) if (distractors.length < 3) distractors.push(pad)
  const options = [target?.description ?? concept, ...distractors.slice(0, 3)]
  return {
    concept,
    difficulty: 1,
    prompt: `Which statement best describes "${concept}"?`,
    options,
    correctIndex: 0,
    explanation: `${concept}: ${target?.description ?? 'review your lecture notes for this idea.'}`,
    distractorNotes: ['', ...options.slice(1).map(() => 'Mixes this concept up with a different idea from the chapter.')],
  }
}

/** Pick questions from the demo bank, falling back to a generic concept-definition question. */
export function demoQuestions({ concepts, plan, avoid = [] }) {
  const usedPrompts = new Set()
  const out = []
  for (const { concept, difficulty } of plan) {
    const candidates = QUESTION_BANK.filter((q) => q.concept === concept && !usedPrompts.has(q.prompt)).sort(
      (a, b) =>
        Number(avoid.includes(a.prompt)) - Number(avoid.includes(b.prompt)) ||
        Math.abs(a.difficulty - difficulty) - Math.abs(b.difficulty - difficulty),
    )
    const copy = (q) => ({ ...q, options: [...q.options], distractorNotes: [...q.distractorNotes] })
    const fresh = candidates.find((q) => !avoid.includes(q.prompt))
    if (fresh) {
      usedPrompts.add(fresh.prompt)
      out.push(copy(fresh))
      continue
    }
    const key = `generic:${concept}`
    if (!usedPrompts.has(key)) {
      usedPrompts.add(key)
      out.push(genericQuestion(concept, concepts))
    } else if (candidates[0]) {
      usedPrompts.add(candidates[0].prompt)
      out.push(copy(candidates[0]))
    }
  }
  return out
}

export function demoAnalysis({ percent, graded, weak, questions, concepts }) {
  const strengths = graded.conceptBreakdown.filter((c) => c.accuracy >= 0.6).map((c) => c.concept)
  const weakConcepts = weak.map((concept) => {
    const wrong = graded.answers.filter((a) => a.concept === concept && !a.correct)
    const firstWrong = wrong[0]
    const question = firstWrong && questions.find((q) => String(q._id) === String(firstWrong.questionId))
    const note = question?.distractorNotes?.[firstWrong.selectedIndex]
    const description = concepts.find((c) => c.name === concept)?.description
    return {
      concept,
      misconception: note || `Answers on "${concept}" suggest the core idea is not yet secure.`,
      fix: question?.explanation || description || `Re-read the lecture notes on ${concept} and try the practice set.`,
    }
  })

  const summary = weak.length
    ? `You scored ${percent}%. You are secure on ${strengths.length ? strengths.join(', ') : 'a few ideas'}, but ${weak.join(' and ')} need${weak.length === 1 ? 's' : ''} attention. Targeted practice will close the gap.`
    : `You scored ${percent}%. Excellent work: every concept in this test looks secure.`

  return {
    summary,
    strengths,
    weakConcepts,
    studyTip: weak.length
      ? 'Re-read the notes for your weak concepts, then explain each one aloud in your own words before practising.'
      : 'Try explaining each concept to a classmate to lock in your understanding.',
  }
}
