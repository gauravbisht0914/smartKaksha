import { Link } from 'react-router-dom'
import useSWR from 'swr'
import { ArrowRight, BookOpenCheck, ClipboardList, Dumbbell, RotateCcw, Target } from 'lucide-react'
import { useAuth } from '../../lib/auth.jsx'
import { Badge, Button, Card, EmptyState, ImprovementBadge, MasteryBar, PageHeader, Spinner, Stat } from '../../components/ui.jsx'
import { formatDate, scoreTone } from '../../lib/format.js'

function NextStepCard({ step }) {
  const practiceActive = step.practice?.status === 'active'
  const practiceDone = step.practice?.status === 'complete'
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold">{step.title}</p>
          <p className="text-sm text-muted">Scored {step.percent}%. Focus on these concepts:</p>
        </div>
        <Badge tone={scoreTone(step.percent)}>{step.percent}%</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {step.weakConcepts.map((c) => (
          <Badge key={c} tone="bad">
            {c}
          </Badge>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {step.retest ? (
          <Link to={`/student/tests/${step.retest.testId}`}>
            <Button size="sm" variant="accent">
              <RotateCcw className="size-4" aria-hidden /> Take your retest
            </Button>
          </Link>
        ) : practiceActive ? (
          <Link to={`/student/practice/${step.practice._id}`}>
            <Button size="sm">
              <Dumbbell className="size-4" aria-hidden /> Continue practice ({step.practice.answered}/{step.practice.maxItems})
            </Button>
          </Link>
        ) : (
          <Link to={`/student/results/${step.attemptId}`}>
            <Button size="sm">
              <Dumbbell className="size-4" aria-hidden /> {practiceDone ? 'Retest now' : 'Start personalized practice'}
            </Button>
          </Link>
        )}
        <Link to={`/student/results/${step.attemptId}`}>
          <Button size="sm" variant="secondary">
            View analysis
          </Button>
        </Link>
      </div>
    </Card>
  )
}

export default function StudentHome() {
  const { user } = useAuth()
  const { data, error } = useSWR('/student/dashboard')
  if (error) return <EmptyState title="Could not load your dashboard">{error.message}</EmptyState>
  if (!data) return <Spinner label="Loading your dashboard" />

  const { stats, pendingTests, nextSteps, weakConcepts, recentAttempts, missedLectures } = data

  return (
    <>
      <PageHeader eyebrow="Student dashboard" title={`Hi ${user.name.split(' ')[0]}, ready to learn?`} subtitle="Here is what needs your attention this week." />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Tests taken" value={stats.testsTaken} />
        <Stat label="Average score" value={stats.averagePercent != null ? `${stats.averagePercent}%` : null} />
        <Stat label="Avg mastery" value={stats.averageMastery != null ? `${stats.averageMastery}%` : null} />
        <Stat
          label="Improvement"
          value={stats.improvement != null ? `${stats.improvement > 0 ? '+' : ''}${stats.improvement} pts` : null}
          tone={stats.improvement > 0 ? 'good' : stats.improvement < 0 ? 'bad' : undefined}
          hint="Retest vs. first attempt"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section aria-labelledby="tests-due">
            <h2 id="tests-due" className="mb-3 text-xl font-semibold">
              Tests waiting for you
            </h2>
            {pendingTests.length ? (
              <div className="space-y-3">
                {pendingTests.map((t) => (
                  <Card key={t._id} className="flex flex-wrap items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-accent-soft text-[#8a5200]">
                      <ClipboardList className="size-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{t.title}</p>
                      <p className="truncate text-xs text-muted">
                        {t.kind === 'retest' ? 'Personalized retest' : `Week ${t.week}`} · {t.questionCount} questions · {t.concepts.slice(0, 3).join(', ')}
                      </p>
                    </div>
                    <Link to={`/student/tests/${t._id}`}>
                      <Button size="sm">
                        Start <ArrowRight className="size-4" aria-hidden />
                      </Button>
                    </Link>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState icon={ClipboardList} title="You are all caught up">
                No tests are waiting. Review your notes while you wait for the next weekly test.
              </EmptyState>
            )}
          </section>

          {nextSteps.length > 0 && (
            <section aria-labelledby="next-steps">
              <h2 id="next-steps" className="mb-3 text-xl font-semibold">
                Your improvement plan
              </h2>
              <div className="space-y-3">
                {nextSteps.map((s) => (
                  <NextStepCard key={s.attemptId} step={s} />
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="recent">
            <h2 id="recent" className="mb-3 text-xl font-semibold">
              Recent results
            </h2>
            <Card className="py-2">
              {recentAttempts.length ? (
                <ul className="divide-y divide-line">
                  {recentAttempts.map((a) => (
                    <li key={a._id}>
                      <Link to={`/student/results/${a._id}`} className="flex items-center gap-3 py-3 hover:opacity-80">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{a.title}</p>
                          <p className="text-xs text-muted">{formatDate(a.createdAt)}</p>
                        </div>
                        {a.improvement && <ImprovementBadge delta={a.improvement.delta} />}
                        <Badge tone={scoreTone(a.percent)}>{a.percent}%</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-sm text-muted">Your results will appear here after your first test.</p>
              )}
            </Card>
          </section>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
              <Target className="size-4 text-bad" aria-hidden /> Weak concepts
            </h2>
            <p className="mb-4 text-sm text-muted">Lowest mastery first.</p>
            {weakConcepts.length ? (
              <div className="space-y-4">
                {weakConcepts.map((w) => (
                  <MasteryBar key={`${w.chapter}-${w.concept}`} concept={w.concept} mastery={w.mastery} sub={w.chapter} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No weak concepts right now. Nice work.</p>
            )}
          </Card>

          <Card>
            <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
              <BookOpenCheck className="size-4 text-brand" aria-hidden /> Missed lectures
            </h2>
            {missedLectures.length ? (
              <ul className="mt-3 space-y-2">
                {missedLectures.map((l) => (
                  <li key={l._id}>
                    <Link to={`/student/lectures/${l._id}`} className="block rounded-lg border border-line px-3 py-2 text-sm hover:bg-paper">
                      <span className="block truncate font-medium">{l.title}</span>
                      <span className="block truncate text-xs text-muted">{l.chapter}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">
                Missed a class? Open any lecture and tap <span className="font-medium text-ink">I missed this class</span> to keep its notes handy.
              </p>
            )}
            <Link to="/student/lectures" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
              Browse all notes <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Card>
        </div>
      </div>
    </>
  )
}
