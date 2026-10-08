import { generateText, Output } from 'ai'
import { z } from 'zod'

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'google/gemini-3.5-flash-lite'

const MIME_BY_EXT = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
  aac: 'audio/aac',
  ogg: 'audio/ogg',
  flac: 'audio/flac',
  webm: 'audio/webm',
}

export function audioMimeType(file) {
  if (file.mimetype?.startsWith('audio/') || file.mimetype === 'video/webm') return file.mimetype
  const ext = file.originalname?.split('.').pop()?.toLowerCase()
  return MIME_BY_EXT[ext] ?? 'audio/mpeg'
}

async function askObject({ instructions, prompt, schema, timeoutMs = 90_000 }) {
  const { output } = await generateText({
    model: GEMINI_MODEL,
    instructions,
    prompt,
    output: Output.object({ schema }),
    abortSignal: AbortSignal.timeout(timeoutMs),
  })
  return output
}

export async function transcribeAudio({ buffer, mediaType }) {
  const { text } = await generateText({
    model: GEMINI_MODEL,
    instructions:
      'You are a precise transcription engine for classroom lectures. Output only the spoken words as plain text paragraphs, with no timestamps, speaker labels or commentary. Keep the original language of the speaker.',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Transcribe this lecture recording.' },
          { type: 'file', mediaType, data: buffer },
        ],
      },
    ],
    abortSignal: AbortSignal.timeout(180_000),
  })
  return text.trim()
}

const lectureSchema = z.object({
  summary: z.string().describe('Two to three sentence summary of the lecture'),
  sections: z
    .array(z.object({ heading: z.string(), body: z.string().describe('Clear student-friendly explanation, 2-4 sentences') }))
    .describe('3 to 6 study-note sections in teaching order'),
  keyTerms: z.array(z.object({ term: z.string(), definition: z.string() })).describe('4 to 8 key terms'),
  concepts: z
    .array(z.object({ name: z.string().describe('Short concept name, 2-5 words'), description: z.string().describe('One precise sentence') }))
    .describe('3 to 6 distinct, testable concepts taught in this lecture'),
})

export async function structureLecture({ transcript, title, subject }) {
  return askObject({
    instructions:
      'You are an expert teacher creating study notes for students who missed a lecture. Write the notes in clear English even if the lecture was in another language. Be accurate and only use what the lecture teaches.',
    prompt: `Subject: ${subject}\nLecture title: ${title}\n\nTranscript:\n"""\n${transcript.slice(0, 60_000)}\n"""\n\nProduce lecture notes, key terms and the list of testable concepts.`,
    schema: lectureSchema,
  })
}

const questionSchema = z.object({
  questions: z.array(
    z.object({
      prompt: z.string(),
      options: z.array(z.string()).length(4),
      correctIndex: z.number().int().min(0).max(3),
      explanation: z.string().describe('Why the correct answer is right, 1-2 sentences'),
      distractorNotes: z
        .array(z.string())
        .length(4)
        .describe('For each option, the misconception that makes it tempting. Use an empty string for the correct option.'),
    }),
  ),
})

const DIFFICULTY_LABEL = { 1: 'easy (recall)', 2: 'medium (apply)', 3: 'hard (multi-step reasoning or a tricky misconception)' }

export async function generateQuestions({ subject, chapterTitle, concepts, plan, avoid = [], focus = {} }) {
  const conceptList = concepts.map((c) => `- ${c.name}: ${c.description}`).join('\n')
  const planList = plan
    .map((p, i) => {
      const note = focus[p.concept] ? ` (student misconception to target: ${focus[p.concept]})` : ''
      return `${i + 1}. concept "${p.concept}", difficulty ${DIFFICULTY_LABEL[p.difficulty]}${note}`
    })
    .join('\n')
  const avoidText = avoid.length ? `\nDo not repeat or closely paraphrase these existing questions:\n${avoid.map((a) => `- ${a}`).join('\n')}\n` : ''

  const output = await askObject({
    instructions:
      'You write high quality multiple-choice questions for school students. Each question has exactly 4 options and one unambiguously correct answer. Distractors must reflect realistic student misconceptions, not silly answers. Keep wording concise.',
    prompt: `Subject: ${subject}\nChapter: ${chapterTitle}\n\nConcepts taught:\n${conceptList}\n\nWrite exactly ${plan.length} questions, one per line of this plan, in the same order:\n${planList}\n${avoidText}`,
    schema: questionSchema,
  })
  return output.questions
}

const analysisSchema = z.object({
  summary: z.string().describe('2-3 encouraging, specific sentences addressed to the student'),
  strengths: z.array(z.string()).describe('Concept names the student handled well'),
  weakConcepts: z.array(
    z.object({
      concept: z.string().describe('Exactly one of the provided weak concept names'),
      misconception: z.string().describe('The specific wrong belief the answers reveal, 1-2 sentences'),
      fix: z.string().describe('Concrete correction the student can apply, 1-2 sentences'),
    }),
  ),
  studyTip: z.string(),
})

export async function analyzeStudent({ subject, chapterTitle, percent, graded, weak, questions }) {
  const lines = graded.answers
    .map((a, i) => {
      const q = questions.find((x) => String(x._id) === String(a.questionId))
      const chosen = a.selectedIndex >= 0 ? q.options[a.selectedIndex] : '(no answer)'
      const note = a.selectedIndex >= 0 ? q.distractorNotes?.[a.selectedIndex] : ''
      return `Q${i + 1} [${a.concept}] ${a.correct ? 'CORRECT' : 'WRONG'}\n  Question: ${q.prompt}\n  Student chose: ${chosen}\n  Correct answer: ${q.options[q.correctIndex]}${a.correct ? '' : `\n  Why that distractor is tempting: ${note || 'n/a'}`}`
    })
    .join('\n')

  return askObject({
    instructions:
      'You are a supportive tutor diagnosing a student\'s misconceptions from their test answers. Be specific about the wrong belief, never blame the student, and give actionable fixes. Scoring has already been computed; do not recompute it.',
    prompt: `Subject: ${subject}\nChapter: ${chapterTitle}\nScore: ${percent}%\nWeak concepts to diagnose (use these exact names): ${weak.join('; ')}\n\nAnswers:\n${lines}`,
    schema: analysisSchema,
  })
}
