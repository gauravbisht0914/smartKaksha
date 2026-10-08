import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import useSWR from 'swr'
import { ArrowLeft, Check, Dumbbell, RotateCcw, Sparkles, TrendingUp, X } from 'lucide-react'
import clsx from 'clsx'
import { api } from '../../lib/api.js'
import { useAuth } from '../../lib/auth.jsx'
import { Alert, Badge, Button, Card, EmptyState, MasteryBar, PageHeader, Spinner } from '../../components/ui.jsx'
import { difficultyLabel, scoreTone } from '../../lib/format.js'

function ImprovementCard({ improvement, baseline }) {
  const gain = Math.round(improvement.normalizedGain * 100)
  return (
    <Card className="border-good/40 bg-good-soft/50">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <TrendingUp className="size-5 text-good" aria-hidden /> Improvement score
      </h2>
      <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-3">
        <div>
          <p className="font-display text-5xl font-semibold text-good">
            {improvement.delta > 0 ? '+' : ''}
            {improvement.delta}
          </p>
          <p className="text-sm text-muted">points on previously weak concepts</p>
        </div>
        <div className="text-sm">
          <p>
            Before: <span className="font-semibold">{improvement.pre}%</span>
          </p>
          <p>
            After: <span className="font-semibold">{improvement.post}%</span>
          </p>
          <p>
            Learning gain: <span className="font-semibold">{gain}%</span> of possible
          </p>
        </div>
      </div>
      {improvement.conceptDeltas?.length > 0 && (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {improvement.conceptDeltas.map((c) => (
            <li key={c.concept} className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm">
              <span className="truncate font-medium">{c.concept}</span>
              <span className="shrink-0 text-muted">
                {c.pre}% → {c.post}%
              </span>
            </li>
          ))}
        </ul>
      )}
      {baseline && (
        <Link to={`/student/results/${baseline._id}`} className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
          View original test ({baseline.percent}%)
        </Link>
      )}
    </Card>
  )
}

export default function ResultPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isStudent = user.role === 'student'
  const { data, error, mutate } = useSWR(`/attempts/${id}`)
  const [busy, setBusy] = useState('')
  const [actionError, setActionError] = useState('')

  if (error) return <EmptyState title="Result not available">{error.message}</EmptyState>
  if (!data) return <Spinner label="Loading result" />

  const { attempt, test, chapter, student, review, practice, retest, baseline } = data
  const { analysis } = attempt
  const hasWeak = analysis?.weakConcepts?.length > 0

  const run = async (key, fn) => {
    setBusy(key)
    setActionError('')
    try {
      await fn()
    } catch (err) {
      setActionError(err.message)
      setBusy('')
    }
  }

  const startPractice = () =>
    run('practice', async () => {
      const res = await api(`/attempts/${attempt._id}/practice`, { method: 'POST' })
      navigate(`/student/practice/${res.practiceId}`)
    })
  const startRetest = () =>
    run('retest', async () => {
      const res = await api(`/attempts/${attempt._id}/retest`, { method: 'POST' })
      mutate()
      navigate(`/student/tests/${res.testId}`)
    })

  return (
    <>
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Back
      </button>

      <PageHeader
        eyebrow={`${chapter?.title ?? ''}${!isStudent && student ? ` · ${student.name}` : ''}`}
        title={test.title}
        subtitle={test.kind === 'retest' ? 'Personalized retest result' : `Week ${test.week} test result`}
        actions={
          <Badge tone={analysis?.source === 'gemini' ? 'brand' : 'accent'}>
            <Sparkles className="size-3" aria-hidden /> {analysis?.source === 'gemini' ? 'Analyzed by Gemini' : 'Demo AI analysis'}
          </Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="flex flex-wrap items-center gap-6">
            <div
              className={clsx(
                'flex size-28 shrink-0 flex-col items-center justify-center rounded-full border-8',
                scoreTone(attempt.percent) === 'good' && 'border-good/40',
                scoreTone(attempt.percent) === 'accent' && 'border-accent/50',
                scoreTone(attempt.percent) === 'bad' && 'border-bad/40',
              )}
            >
              <span className="font-display text-3xl font-semibold">{attempt.percent}%</span>
              <span className="text-xs text-muted">
                {attempt.score}/{attempt.total}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold">AI analysis</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink/90">{analysis?.summary}</p>
              {analysis?.strengths?.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-muted uppercase">Strengths</span>
                  {analysis.strengths.map((s) => (
                    <Badge key={s} tone="good">
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {attempt.improvement && <ImprovementCard improvement={attempt.improvement} baseline={baseline} />}

          {hasWeak && (
            <section aria-labelledby="misconceptions">
              <h2 id="misconceptions" className="mb-3 text-xl font-semibold">
                Weak concepts & misconceptions
              </h2>
              <div className="space-y-3">
                {analysis.weakConcepts.map((w) => (
                  <Card key={w.concept}>
                    <Badge tone="bad">{w.concept}</Badge>
                    <p className="mt-2 text-sm">
                      <span className="font-semibold">Misconception: </span>
                      {w.misconception}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      <span className="font-semibold text-ink">How to fix it: </span>
                      {w.fix}
                    </p>
                  </Card>
                ))}
                {analysis.studyTip && <Alert tone="info">Study tip: {analysis.studyTip}</Alert>}
              </div>
            </section>
          )}

          <section aria-labelledby="review">
            <h2 id="review" className="mb-3 text-xl font-semibold">
              Question review
            </h2>
            <ol className="space-y-3">
              {review.map((r, i) => (
                <li key={r._id}>
                  <Card>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className={clsx(
                          'flex size-6 items-center justify-center rounded-full text-white',
                          r.correct ? 'bg-good' : 'bg-bad',
                        )}
                      >
                        {r.correct ? <Check className="size-4" aria-label="Correct" /> : <X className="size-4" aria-label="Incorrect" />}
                      </span>
                      <span className="text-sm font-semibold text-muted">Q{i + 1}</span>
                      <Badge tone="brand">{r.concept}</Badge>
                      <Badge>{difficultyLabel(r.difficulty)}</Badge>
                    </div>
                    <p className="font-medium">{r.prompt}</p>
                    <p className="mt-2 text-sm">
                      <span className="text-muted">Your answer: </span>
                      <span className={r.correct ? 'font-medium text-good' : 'font-medium text-bad'}>
                        {r.selectedIndex >= 0 ? r.options[r.selectedIndex] : 'No answer'}
                      </span>
                    </p>
                    {!r.correct && (
                      <p className="text-sm">
                        <span className="text-muted">Correct answer: </span>
                        <span className="font-medium">{r.options[r.correctIndex]}</span>
                      </p>
                    )}
                    <p className="mt-2 text-sm text-muted">{r.explanation}</p>
                  </Card>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-6">
          {isStudent && hasWeak && (
            <Card className="border-brand/30 bg-brand-soft/50">
              <h2 className="text-lg font-semibold">Your next steps</h2>
              <ol className="mt-3 space-y-4 text-sm">
                <li>
                  <p className="font-semibold">1. Personalized practice</p>
                  <p className="mb-2 text-muted">Adaptive questions that get harder as you improve.</p>
                  {practice ? (
                    <Link to={`/student/practice/${practice._id}`}>
                      <Button size="sm" variant={practice.status === 'complete' ? 'secondary' : 'primary'}>
                        <Dumbbell className="size-4" aria-hidden />
                        {practice.status === 'complete' ? 'Review practice' : `Continue (${practice.answered}/${practice.maxItems})`}
                      </Button>
                    </Link>
                  ) : (
                    <Button size="sm" onClick={startPractice} loading={busy === 'practice'}>
                      <Dumbbell className="size-4" aria-hidden /> {busy === 'practice' ? 'Building your set…' : 'Start practice'}
                    </Button>
                  )}
                </li>
                <li>
                  <p className="font-semibold">2. Retest to measure growth</p>
                  <p className="mb-2 text-muted">A fresh test on your weak concepts gives your improvement score.</p>
                  {retest?.attemptId ? (
                    <Link to={`/student/results/${retest.attemptId}`}>
                      <Button size="sm" variant="secondary">
                        View retest ({retest.percent}%)
                      </Button>
                    </Link>
                  ) : retest ? (
                    <Link to={`/student/tests/${retest.testId}`}>
                      <Button size="sm" variant="accent">
                        <RotateCcw className="size-4" aria-hidden /> Take retest
                      </Button>
                    </Link>
                  ) : (
                    <Button size="sm" variant="accent" onClick={startRetest} loading={busy === 'retest'}>
                      <RotateCcw className="size-4" aria-hidden /> {busy === 'retest' ? 'Preparing…' : 'Create my retest'}
                    </Button>
                  )}
                </li>
              </ol>
              {actionError && (
                <div className="mt-3">
                  <Alert>{actionError}</Alert>
                </div>
              )}
            </Card>
          )}

          <Card>
            <h2 className="mb-4 text-lg font-semibold">Concept breakdown</h2>
            <div className="space-y-4">
              {attempt.conceptBreakdown.map((c) => (
                <MasteryBar key={c.concept} concept={c.concept} mastery={Math.round(c.accuracy * 100)} sub={`${c.correct} of ${c.total} correct`} />
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </>
  )
}
