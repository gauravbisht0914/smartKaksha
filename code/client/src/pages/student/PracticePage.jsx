import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import useSWR from 'swr'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, RotateCcw, Trophy, X } from 'lucide-react'
import clsx from 'clsx'
import { api } from '../../lib/api.js'
import { Alert, Badge, Button, Card, EmptyState, MasteryBar, ProgressBar, Spinner } from '../../components/ui.jsx'
import { difficultyLabel } from '../../lib/format.js'

const pct = (v) => Math.round((v ?? 0) * 100)

function ConceptPanel({ concepts, currentConcept }) {
  return (
    <Card>
      <h2 className="mb-1 text-lg font-semibold">Live mastery</h2>
      <p className="mb-4 text-sm text-muted">Updates after every answer.</p>
      <div className="space-y-5">
        {concepts.map((c) => (
          <div key={c.name} className={clsx('rounded-lg', currentConcept === c.name && 'bg-brand-soft/60 p-2 -m-2')}>
            <MasteryBar concept={c.name} mastery={pct(c.mastery)} sub={`Started at ${pct(c.startMastery)}% · now ${difficultyLabel(c.level)}`} />
          </div>
        ))}
      </div>
    </Card>
  )
}

function Summary({ practice }) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const retest = async () => {
    setBusy(true)
    setError('')
    try {
      const res = await api(`/attempts/${practice.attemptId}/retest`, { method: 'POST' })
      navigate(`/student/tests/${res.testId}`)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="text-center">
        <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-good-soft text-good">
          <Trophy className="size-7" aria-hidden />
        </div>
        <h1 className="text-3xl font-semibold">Practice complete</h1>
        <p className="mt-1 text-muted">
          You answered {practice.answered} questions with {practice.accuracy}% accuracy.
        </p>
        <ul className="mt-6 space-y-3 text-left">
          {practice.concepts.map((c) => {
            const gain = pct(c.mastery) - pct(c.startMastery)
            return (
              <li key={c.name} className="rounded-lg border border-line p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{c.name}</span>
                  <Badge tone={gain > 0 ? 'good' : gain < 0 ? 'bad' : 'neutral'}>
                    {pct(c.startMastery)}% → {pct(c.mastery)}%
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted">{c.fix}</p>
              </li>
            )
          })}
        </ul>
        {error && (
          <div className="mt-4">
            <Alert>{error}</Alert>
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="accent" onClick={retest} loading={busy}>
            <RotateCcw className="size-4" aria-hidden /> Take retest to measure growth
          </Button>
          <Link to="/student/progress">
            <Button variant="secondary">See my progress</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

export default function PracticePage() {
  const { id } = useParams()
  const { data, error, mutate } = useSWR(`/practice/${id}`, { revalidateOnFocus: false })
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState('')

  if (error) return <EmptyState title="Practice not available">{error.message}</EmptyState>
  if (!data) return <Spinner label="Loading practice" />
  const { practice } = data

  if (practice.status === 'complete' && !feedback) return <Summary practice={practice} />

  const q = practice.current
  const submit = async () => {
    setBusy(true)
    setSubmitError('')
    try {
      const res = await api(`/practice/${practice._id}/answer`, { method: 'POST', body: { questionId: q._id, selectedIndex: selected } })
      setFeedback(res)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setBusy(false)
    }
  }
  const next = async () => {
    setFeedback(null)
    setSelected(null)
    await mutate()
  }

  const progress = (practice.answered + (feedback ? 0 : 0)) / practice.maxItems
  const guidance = practice.concepts.find((c) => c.name === q?.concept)

  return (
    <div className="mx-auto max-w-5xl">
      <Link to={`/student/results/${practice.attemptId}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Back to analysis
      </Link>
      <div className="mb-5">
        <p className="text-xs font-semibold tracking-wide text-brand uppercase">Adaptive practice · {practice.chapterTitle}</p>
        <h1 className="text-3xl font-semibold">Personalized practice</h1>
      </div>
      <div className="mb-6">
        <div className="mb-1.5 flex justify-between text-sm text-muted">
          <span>
            {practice.answered} of up to {practice.maxItems} questions
          </span>
          {practice.accuracy != null && <span>{practice.accuracy}% accurate</span>}
        </div>
        <ProgressBar value={progress * 100} label="Practice progress" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {q && (
            <Card className="p-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge tone="brand">{q.concept}</Badge>
                <Badge tone={q.difficulty === 3 ? 'bad' : q.difficulty === 2 ? 'accent' : 'good'}>{difficultyLabel(q.difficulty)}</Badge>
              </div>
              <fieldset disabled={Boolean(feedback)}>
                <legend className="text-lg leading-snug font-semibold">{q.prompt}</legend>
                <div className="mt-4 space-y-2.5">
                  {q.options.map((opt, oi) => {
                    const isCorrect = feedback && oi === feedback.correctIndex
                    const isWrongPick = feedback && oi === selected && !feedback.correct
                    return (
                      <label
                        key={oi}
                        className={clsx(
                          'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm transition focus-within:ring-2 focus-within:ring-brand/30',
                          feedback ? 'cursor-default' : 'cursor-pointer',
                          isCorrect && 'border-good bg-good-soft',
                          isWrongPick && 'border-bad bg-bad-soft',
                          !feedback && (selected === oi ? 'border-brand bg-brand-soft' : 'border-line hover:bg-paper'),
                          feedback && !isCorrect && !isWrongPick && 'border-line opacity-70',
                        )}
                      >
                        <input
                          type="radio"
                          name="practice-option"
                          checked={selected === oi}
                          onChange={() => setSelected(oi)}
                          className="mt-0.5 accent-brand"
                        />
                        <span className="flex-1">
                          <span className="mr-2 font-semibold text-muted">{String.fromCharCode(65 + oi)}.</span>
                          {opt}
                        </span>
                        {isCorrect && <Check className="size-4 text-good" aria-label="Correct answer" />}
                        {isWrongPick && <X className="size-4 text-bad" aria-label="Your answer" />}
                      </label>
                    )
                  })}
                </div>
              </fieldset>

              {feedback && (
                <div className="mt-4 space-y-3" aria-live="polite">
                  <div className={clsx('rounded-lg border px-4 py-3 text-sm', feedback.correct ? 'border-good/40 bg-good-soft' : 'border-bad/30 bg-bad-soft')}>
                    <p className="font-semibold">{feedback.correct ? 'Correct!' : 'Not quite.'}</p>
                    <p className="mt-0.5 text-ink/90">{feedback.explanation}</p>
                  </div>
                  {feedback.levelChange !== 0 && (
                    <p className="flex items-center gap-1.5 text-sm font-medium text-brand-dark">
                      {feedback.levelChange > 0 ? <ArrowUp className="size-4" aria-hidden /> : <ArrowDown className="size-4" aria-hidden />}
                      {feedback.levelChange > 0 ? 'Leveling up: harder questions coming.' : 'Easing off: easier questions to rebuild confidence.'}
                    </p>
                  )}
                </div>
              )}

              {submitError && (
                <div className="mt-4">
                  <Alert>{submitError}</Alert>
                </div>
              )}

              <div className="mt-5 flex justify-end">
                {feedback ? (
                  <Button onClick={next}>
                    {feedback.complete ? 'Finish practice' : 'Next question'} <ArrowRight className="size-4" aria-hidden />
                  </Button>
                ) : (
                  <Button onClick={submit} disabled={selected == null} loading={busy}>
                    Check answer
                  </Button>
                )}
              </div>
            </Card>
          )}

          {guidance && (
            <Card className="bg-accent-soft/50">
              <h2 className="text-sm font-semibold">Watch out for this misconception</h2>
              <p className="mt-1 text-sm">{guidance.misconception}</p>
              <p className="mt-1 text-sm text-muted">{guidance.fix}</p>
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          <ConceptPanel concepts={practice.concepts} currentConcept={q?.concept} />
          {practice.history.length > 0 && (
            <Card>
              <h2 className="mb-3 text-sm font-semibold">Your answers so far</h2>
              <ol className="flex flex-wrap gap-1.5">
                {practice.history.map((h, i) => (
                  <li
                    key={i}
                    title={`${h.concept} (${difficultyLabel(h.difficulty)})`}
                    className={clsx(
                      'flex size-8 items-center justify-center rounded-md text-xs font-semibold text-white',
                      h.correct ? 'bg-good' : 'bg-bad',
                    )}
                  >
                    {['E', 'M', 'H'][h.difficulty - 1]}
                  </li>
                ))}
              </ol>
              <p className="mt-2 text-xs text-muted">E = easy, M = medium, H = hard</p>
            </Card>
          )}
        </aside>
      </div>
    </div>
  )
}
