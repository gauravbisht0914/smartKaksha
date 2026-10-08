import { Link } from 'react-router-dom'
import useSWR from 'swr'
import { ArrowRight, BookOpen, ClipboardList } from 'lucide-react'
import { useAuth } from '../../lib/auth.jsx'
import { Badge, Button, Card, EmptyState, ImprovementBadge, MasteryBar, PageHeader, Spinner, Stat } from '../../components/ui.jsx'
import { scoreTone } from '../../lib/format.js'

export default function TeacherOverview() {
  const { user } = useAuth()
  const { data, error } = useSWR('/teacher/overview')

  if (error) return <EmptyState title="Could not load the overview">{error.message}</EmptyState>
  if (!data) return <Spinner label="Loading class overview" />

  const { stats, testSummaries, classConcepts, needsAttention, topImprovers } = data

  return (
    <>
      <PageHeader
        eyebrow="Teacher dashboard"
        title={`Hello, ${user.name.split(' ').slice(0, 2).join(' ')}`}
        subtitle="Where your class stands this week, and who needs a hand."
        actions={
          <Link to="/teacher/chapters">
            <Button>
              <BookOpen className="size-4" aria-hidden /> Manage chapters
            </Button>
          </Link>
        }
      />

      <section aria-label="Class statistics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Students" value={stats.students} hint={`${stats.lectures} lectures · ${stats.chapters} chapters`} />
        <Stat label="Class average" value={stats.averageScore != null ? `${stats.averageScore}%` : null} hint="Across weekly tests" />
        <Stat
          label="Avg improvement"
          value={stats.averageImprovement != null ? `${stats.averageImprovement > 0 ? '+' : ''}${stats.averageImprovement} pts` : null}
          tone={stats.averageImprovement > 0 ? 'good' : undefined}
          hint="Weak concepts, after retest"
        />
        <Stat label="Practice completed" value={stats.practiceCompleted} hint="Personalized sessions" />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <h2 className="text-xl font-semibold">Class concept mastery</h2>
          <p className="mb-4 text-sm text-muted">Weakest concepts first. Use these to plan your next revision class.</p>
          {classConcepts.length ? (
            <div className="space-y-4">
              {classConcepts.slice(0, 8).map((c) => (
                <MasteryBar
                  key={c.concept + c.chapter}
                  concept={c.concept}
                  mastery={c.mastery}
                  sub={`${c.chapter} · ${c.weakStudents} of ${c.students} students struggling`}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Mastery appears once students take a test.</p>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-xl font-semibold">Needs attention</h2>
          <p className="mb-4 text-sm text-muted">Lowest average test scores right now.</p>
          <ul className="divide-y divide-line">
            {needsAttention.map((s) => (
              <li key={s._id}>
                <Link to={`/teacher/students/${s._id}`} className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 hover:bg-paper">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.name}</p>
                    <p className="truncate text-xs text-muted">{s.weakConcepts.map((w) => w.concept).slice(0, 2).join(' · ') || 'No weak concepts'}</p>
                  </div>
                  <Badge tone={scoreTone(s.averagePercent)}>{s.averagePercent}% avg</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <h2 className="mb-4 text-xl font-semibold">Weekly tests</h2>
          {testSummaries.length ? (
            <ul className="divide-y divide-line">
              {testSummaries.map((t) => (
                <li key={t._id}>
                  <Link to={`/teacher/tests/${t._id}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-paper">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                      <ClipboardList className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{t.title}</p>
                      <p className="text-xs text-muted">
                        Week {t.week} · {t.attempts} attempts {!t.published && '· Draft'}
                      </p>
                    </div>
                    {t.averagePercent != null && <Badge tone={scoreTone(t.averagePercent)}>{t.averagePercent}% avg</Badge>}
                    <ArrowRight className="size-4 text-muted" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No tests yet. Generate one from a chapter.</p>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-xl font-semibold">Top improvers</h2>
          <p className="mb-4 text-sm text-muted">Biggest gain on weak concepts after practice.</p>
          {topImprovers.length ? (
            <ul className="divide-y divide-line">
              {topImprovers.map((s) => (
                <li key={s._id} className="flex items-center justify-between py-3">
                  <Link to={`/teacher/students/${s._id}`} className="font-medium hover:underline">
                    {s.name}
                  </Link>
                  <ImprovementBadge delta={s.improvement} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No retests completed yet.</p>
          )}
        </Card>
      </div>
    </>
  )
}
