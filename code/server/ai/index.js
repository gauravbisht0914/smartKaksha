import { GEMINI_MODEL, analyzeStudent, generateQuestions, structureLecture, transcribeAudio, audioMimeType } from './gemini.js'
import { demoAnalysis, demoLecture, demoQuestions } from './demo.js'

const hasGatewayAuth = () => Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN)

export function aiStatus() {
  const forced = process.env.DEMO_MODE === 'true'
  const live = !forced && hasGatewayAuth()
  return { mode: live ? 'gemini' : 'demo', model: live ? GEMINI_MODEL : 'Demo AI (sample data)' }
}

const useDemo = (demo) => demo || aiStatus().mode === 'demo'

async function withFallback(label, live, fallback) {
  try {
    return { ...(await live()), source: 'gemini' }
  } catch (error) {
    console.error(`[smart-kaksha] Gemini ${label} failed, using demo fallback:`, error?.message ?? error)
    return { ...(await fallback()), source: 'demo' }
  }
}

function shuffleQuestion(q) {
  const order = q.options.map((_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return {
    ...q,
    options: order.map((i) => q.options[i]),
    distractorNotes: order.map((i) => q.distractorNotes?.[i] ?? ''),
    correctIndex: order.indexOf(q.correctIndex),
  }
}

const validQuestion = (q) =>
  q && typeof q.prompt === 'string' && Array.isArray(q.options) && q.options.length === 4 && q.correctIndex >= 0 && q.correctIndex <= 3

export async function processLecture({ title, chapterTitle, subject, audio, transcript, demo, onStage = () => {} }) {
  const demoPath = async () => {
    onStage('Generating sample notes')
    return demoLecture({ title, chapterTitle, transcript })
  }
  if (useDemo(demo)) return { ...(await demoPath()), source: 'demo' }

  return withFallback(
    'lecture processing',
    async () => {
      let text = transcript?.trim()
      if (!text && audio) {
        onStage('Transcribing audio with Gemini')
        text = await transcribeAudio({ buffer: audio.buffer, mediaType: audioMimeType(audio) })
      }
      if (!text) throw new Error('No audio or transcript provided')
      onStage('Writing notes and extracting concepts')
      const notes = await structureLecture({ transcript: text, title, subject })
      return { transcript: text, ...notes }
    },
    demoPath,
  )
}

export async function makeQuestions({ subject, chapterTitle, concepts, plan, avoid = [], focus = {}, demo }) {
  const fromDemo = async () => ({ questions: demoQuestions({ concepts, plan, avoid }) })
  const result = useDemo(demo)
    ? { ...(await fromDemo()), source: 'demo' }
    : await withFallback(
        'question generation',
        async () => {
          const raw = await generateQuestions({ subject, chapterTitle, concepts, plan, avoid, focus })
          const questions = plan
            .map((p, i) => (validQuestion(raw[i]) ? { ...raw[i], concept: p.concept, difficulty: p.difficulty } : null))
            .filter(Boolean)
          if (questions.length < Math.ceil(plan.length / 2)) throw new Error('Too few valid questions returned')
          return { questions }
        },
        fromDemo,
      )
  return { questions: result.questions.map(shuffleQuestion), source: result.source }
}

export async function analyzeAnswers({ subject, chapterTitle, percent, graded, weak, questions, concepts, demo }) {
  const fromDemo = async () => demoAnalysis({ percent, graded, weak, questions, concepts })
  if (!weak.length || useDemo(demo)) return { ...(await fromDemo()), source: 'demo' }

  const result = await withFallback(
    'misconception analysis',
    async () => {
      const out = await analyzeStudent({ subject, chapterTitle, percent, graded, weak, questions })
      const backup = demoAnalysis({ percent, graded, weak, questions, concepts })
      const weakConcepts = weak.map((name) => {
        const found = out.weakConcepts.find((w) => w.concept.toLowerCase() === name.toLowerCase())
        return found ? { ...found, concept: name } : backup.weakConcepts.find((w) => w.concept === name)
      })
      return { ...out, weakConcepts }
    },
    fromDemo,
  )
  return result
}
