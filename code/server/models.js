import mongoose from 'mongoose'

const { Schema, model } = mongoose
const ObjectId = Schema.Types.ObjectId

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['teacher', 'student'], required: true },
    missedLectures: [{ type: ObjectId, ref: 'Lecture' }],
  },
  { timestamps: true },
)

const chapterSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, default: 'General', trim: true },
    description: { type: String, default: '' },
    createdBy: { type: ObjectId, ref: 'User' },
  },
  { timestamps: true },
)

const lectureSchema = new Schema(
  {
    chapter: { type: ObjectId, ref: 'Chapter', required: true, index: true },
    title: { type: String, required: true, trim: true },
    week: { type: Number, default: 1 },
    status: { type: String, enum: ['processing', 'ready', 'failed'], default: 'processing' },
    stage: { type: String, default: 'Queued' },
    error: String,
    fileName: String,
    transcript: { type: String, default: '' },
    summary: { type: String, default: '' },
    sections: [{ heading: String, body: String }],
    keyTerms: [{ term: String, definition: String }],
    concepts: [{ name: String, description: String }],
    source: { type: String, enum: ['gemini', 'demo'], default: 'demo' },
  },
  { timestamps: true },
)

export const questionSchema = new Schema({
  concept: { type: String, required: true },
  prompt: { type: String, required: true },
  options: [String],
  correctIndex: { type: Number, required: true },
  explanation: { type: String, default: '' },
  difficulty: { type: Number, min: 1, max: 3, default: 2 },
  distractorNotes: [String],
  served: { type: Boolean, default: false },
})

const testSchema = new Schema(
  {
    chapter: { type: ObjectId, ref: 'Chapter', required: true, index: true },
    title: { type: String, required: true },
    week: { type: Number, default: 1 },
    kind: { type: String, enum: ['weekly', 'retest'], default: 'weekly' },
    student: { type: ObjectId, ref: 'User' },
    parentAttempt: { type: ObjectId, ref: 'Attempt' },
    lectures: [{ type: ObjectId, ref: 'Lecture' }],
    questions: [questionSchema],
    published: { type: Boolean, default: false },
    source: { type: String, enum: ['gemini', 'demo'], default: 'demo' },
  },
  { timestamps: true },
)

const attemptSchema = new Schema(
  {
    student: { type: ObjectId, ref: 'User', required: true, index: true },
    test: { type: ObjectId, ref: 'Test', required: true, index: true },
    chapter: { type: ObjectId, ref: 'Chapter', required: true },
    kind: { type: String, enum: ['weekly', 'retest'], default: 'weekly' },
    answers: [
      {
        questionId: ObjectId,
        selectedIndex: Number,
        correct: Boolean,
        concept: String,
        difficulty: Number,
      },
    ],
    score: Number,
    total: Number,
    percent: Number,
    conceptBreakdown: [{ concept: String, correct: Number, total: Number, accuracy: Number }],
    analysis: {
      summary: String,
      strengths: [String],
      weakConcepts: [{ concept: String, misconception: String, fix: String }],
      studyTip: String,
      source: String,
    },
    baselineAttempt: { type: ObjectId, ref: 'Attempt' },
    improvement: Schema.Types.Mixed,
  },
  { timestamps: true },
)

const practiceSchema = new Schema(
  {
    student: { type: ObjectId, ref: 'User', required: true, index: true },
    attempt: { type: ObjectId, ref: 'Attempt', required: true, index: true },
    chapter: { type: ObjectId, ref: 'Chapter', required: true },
    concepts: [{ name: String, misconception: String, fix: String }],
    pool: [questionSchema],
    answers: [
      {
        questionId: ObjectId,
        concept: String,
        difficulty: Number,
        selectedIndex: Number,
        correct: Boolean,
        masteryAfter: Number,
      },
    ],
    levels: [{ concept: String, level: Number, correctStreak: { type: Number, default: 0 }, wrongStreak: { type: Number, default: 0 } }],
    startMastery: [{ concept: String, score: Number }],
    endMastery: [{ concept: String, score: Number }],
    currentQuestionId: ObjectId,
    maxItems: { type: Number, default: 8 },
    status: { type: String, enum: ['active', 'complete'], default: 'active' },
    source: { type: String, enum: ['gemini', 'demo'], default: 'demo' },
  },
  { timestamps: true },
)

const masterySchema = new Schema(
  {
    student: { type: ObjectId, ref: 'User', required: true },
    chapter: { type: ObjectId, ref: 'Chapter', required: true },
    concept: { type: String, required: true },
    score: { type: Number, default: 0.5 },
    attempts: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    history: [{ at: Date, score: Number }],
  },
  { timestamps: true },
)
masterySchema.index({ student: 1, chapter: 1, concept: 1 }, { unique: true })

export const User = model('User', userSchema)
export const Chapter = model('Chapter', chapterSchema)
export const Lecture = model('Lecture', lectureSchema)
export const Test = model('Test', testSchema)
export const Attempt = model('Attempt', attemptSchema)
export const Practice = model('Practice', practiceSchema)
export const Mastery = model('Mastery', masterySchema)
