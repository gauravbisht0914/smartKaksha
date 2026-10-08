import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import useSWR from 'swr'
import { ArrowLeft, ArrowRight, Send, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { api } from '../../lib/api.js'
import { Alert, Badge, Button, Card, EmptyState, ProgressBar, Spinner } from '../../components/ui.jsx'
import { difficultyLabel } from '../../lib/format.js'

export default function TakeTest() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, error } = useSWR(`/tests/${id}`, { revalidateOnFocus: false })
  const [answers, setAnswers] = useState({})
  const [index, setIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  if (error) return <EmptyState title="Test not available">{error.message}</EmptyState>
  if (!data) return <Spinner label="Loading test" />
  const { test } = data
  if (test.attemptId) return <Navigate to={`/student/results/${test.attemptId}`} replace />

  const questions = test.questions
  const q = questions[index]
  const answeredCount = Object.keys(answers).length
  const isLast = index === questions.length - 1

  const submit = async () => {
    const unanswered = questions.length - answeredCount
    if (unanswered > 0 && !window.confirm(`${unanswered} question(s) are unanswered and will be marked wrong. Submit anyway?`)) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const body = { answers: questions.map((x) => ({ questionId: x._id, selectedIndex: answers[x._id] ?? -1 })) }
      const res = await api(`/tests/${test._id}/attempt`, { method: 'POST', body })
      navigate(`/student/results/${res.attemptId}`, { replace: true })
    } catch (err) {
      if (err.data?.attemptId) navigate(`/student/results/${err.data.attemptId}`, { replace: true })
      setSubmitError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/student/tests" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Back to tests
      </Link>
      <div className="mb-5">
        <p className="text-xs font-semibold tracking-wide text-brand uppercase">
          {test.kind === 'retest' ? 'Personalized retest' : `Week ${test.week} test`} · {test.chapter?.title}
        </p>
        <h1 className="text-3xl font-semibold text-balance">{test.title}</h1>
      </div>

      <div className="mb-5">
        <div className="mb-1.5 flex justify-between text-sm text-muted">
          <span>
            Question {index + 1} of {questions.length}
          </span>
          <span>{answeredCount} answered</span>
        </div>
        <ProgressBar value={((index + 1) / questions.length) * 100} label="Test progress" />
      </div>

      <Card className="p-6">
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge tone="brand">{q.concept}</Badge>
          <Badge>{difficultyLabel(q.difficulty)}</Badge>
        </div>
        <fieldset>
          <legend className="text-lg leading-snug font-semibold">{q.prompt}</legend>
          <div className="mt-4 space-y-2.5">
            {q.options.map((opt, oi) => {
              const checked = answers[q._id] === oi
              return (
                <label
                  key={oi}
                  className={clsx(
                    'flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm transition focus-within:ring-2 focus-within:ring-brand/30',
                    checked ? 'border-brand bg-brand-soft' : 'border-line hover:bg-paper',
                  )}
                >
                  <input
                    type="radio"
                    name={`q-${q._id}`}
                    checked={checked}
                    onChange={() => setAnswers((a) => ({ ...a, [q._id]: oi }))}
                    className="mt-0.5 accent-brand"
                  />
                  <span>
                    <span className="mr-2 font-semibold text-muted">{String.fromCharCode(65 + oi)}.</span>
                    {opt}
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>
      </Card>

      <nav aria-label="Question navigation" className="mt-4 flex flex-wrap justify-center gap-1.5">
        {questions.map((x, i) => (
          <button
            key={x._id}
            onClick={() => setIndex(i)}
            aria-label={`Go to question ${i + 1}${answers[x._id] != null ? ' (answered)' : ''}`}
            aria-current={i === index}
            className={clsx(
              'size-8 rounded-md text-xs font-semibold transition',
              i === index ? 'bg-brand text-white' : answers[x._id] != null ? 'bg-brand-soft text-brand-dark' : 'border border-line bg-white text-muted',
            )}
          >
            {i + 1}
          </button>
        ))}
      </nav>

      {submitError && (
        <div className="mt-4">
          <Alert>{submitError}</Alert>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="secondary" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0 || submitting}>
          <ArrowLeft className="size-4" aria-hidden /> Previous
        </Button>
        {isLast ? (
          <Button onClick={submit} loading={submitting}>
            {submitting ? (
              'Analyzing your answers…'
            ) : (
              <>
                <Send className="size-4" aria-hidden /> Submit test
              </>
            )}
          </Button>
        ) : (
          <Button onClick={() => setIndex((i) => i + 1)}>
            Next <ArrowRight className="size-4" aria-hidden />
          </Button>
        )}
      </div>
      {submitting && (
        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted">
          <Sparkles className="size-4 text-accent" aria-hidden /> Scoring your test and finding misconceptions. This takes a few seconds.
        </p>
      )}
    </div>
  )
}
