import { Link, useParams } from 'react-router-dom'
import useSWR from 'swr'
import { ArrowLeft, ArrowRight, Lightbulb } from 'lucide-react'
import { Badge, Card, EmptyState, ImprovementBadge, MasteryBar, PageHeader, Spinner, Stat } from '../../components/ui.jsx'
import { formatDate, scoreTone } from '../../lib/format.js'

export default function StudentDetail() {
  const { id } = useParams()
  const { data, error } = useSWR(`/teacher/students/${id}`)
  if (error) return <EmptyState title="Student not found">{error.message}</EmptyState>
  if (!data) return <Spinner label="Loading student" />

  const { student, attempts, mastery, latestAnalysis } = data

  return (
    <>
      <Link to="/teacher/students" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> All students
      </Link>
      <PageHeader eyebrow="Student report" title={student.name} subtitle={student.email} />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Tests taken" value={student.testsTaken} />
        <Stat label="Average score" value={student.averagePercent != null ? `${student.averagePercent}%` : null} />
        <Stat label="Avg mastery" value={student.averageMastery != null ? `${student.averageMastery}%` : null} />
        <Stat
          label="Improvement"
          value={student.improvement != null ? `${student.improvement > 0 ? '+' : ''}${student.improvement} pts` : null}
          tone={student.improvement > 0 ? 'good' : student.improvement < 0 ? 'bad' : undefined}
          hint={student.retestCount ? `${student.retestCount} retest(s)` : 'No retest yet'}
        />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-xl font-semibold">Concept mastery</h2>
          {mastery.length ? (
            <div className="space-y-4">
              {mastery.map((m) => (
                <MasteryBar key={m.concept + m.chapter} concept={m.concept} mastery={m.mastery} sub={`${m.chapter} · ${m.attempts} questions answered`} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No data yet.</p>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-1 text-xl font-semibold">AI diagnosis</h2>
            {latestAnalysis ? (
              <>
                <p className="mb-4 text-sm text-muted">{latestAnalysis.summary}</p>
                <ul className="space-y-3">
                  {latestAnalysis.weakConcepts.map((w) => (
                    <li key={w.concept} className="rounded-lg border border-line bg-paper p-3">
                      <p className="text-sm font-semibold">{w.concept}</p>
                      <p className="mt-1 text-sm text-muted">
                        <span className="font-medium text-bad">Misconception:</span> {w.misconception}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        <span className="font-medium text-good">Fix:</span> {w.fix}
                      </p>
                    </li>
                  ))}
                </ul>
                {latestAnalysis.studyTip && (
                  <p className="mt-4 flex gap-2 text-sm text-muted">
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden /> {latestAnalysis.studyTip}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted">No weak concepts detected yet.</p>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 text-xl font-semibold">Attempt history</h2>
            <ul className="divide-y divide-line">
              {[...attempts].reverse().map((a) => (
                <li key={a._id}>
                  <Link to={`/teacher/results/${a._id}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-paper">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-muted">
                        {formatDate(a.createdAt)} · {a.kind === 'retest' ? 'Retest' : 'Weekly test'}
                        {a.practice && ` · Practice ${a.practice.status === 'complete' ? 'done' : `${a.practice.answered} answered`}`}
                      </p>
                    </div>
                    {a.kind === 'retest' && <ImprovementBadge delta={a.improvement?.delta} />}
                    <Badge tone={scoreTone(a.percent)}>{a.percent}%</Badge>
                    <ArrowRight className="size-4 text-muted" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  )
}
