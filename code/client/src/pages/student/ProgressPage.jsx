import { Link } from 'react-router-dom'
import useSWR from 'swr'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { LineChart as LineChartIcon } from 'lucide-react'
import { Badge, Card, EmptyState, ImprovementBadge, MasteryBar, PageHeader, Spinner } from '../../components/ui.jsx'
import { formatDate, masteryLabel, scoreTone } from '../../lib/format.js'

export default function ProgressPage() {
  const { data, error } = useSWR('/student/progress')
  if (error) return <EmptyState title="Could not load progress">{error.message}</EmptyState>
  if (!data) return <Spinner label="Loading progress" />

  const { attempts, mastery } = data
  const chartData = attempts.map((a) => ({ name: formatDate(a.createdAt), percent: a.percent, title: a.title }))
  const improvements = attempts.filter((a) => a.improvement)

  if (!attempts.length && !mastery.length) {
    return (
      <>
        <PageHeader eyebrow="My progress" title="Your learning journey" />
        <EmptyState icon={LineChartIcon} title="Nothing to show yet">
          Take your first weekly test and your mastery and improvement will show up here.
        </EmptyState>
      </>
    )
  }

  return (
    <>
      <PageHeader eyebrow="My progress" title="Your learning journey" subtitle="Scores, concept mastery, and improvement after practice." />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <h2 className="mb-4 text-lg font-semibold">Score trend</h2>
          <div className="h-64" role="img" aria-label={`Test scores over time: ${chartData.map((d) => `${d.percent}%`).join(', ')}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="#e5e0d5" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} unit="%" />
                <Tooltip formatter={(v) => [`${v}%`, 'Score']} labelFormatter={(_, p) => p?.[0]?.payload?.title ?? ''} />
                <Line type="monotone" dataKey="percent" stroke="#0f766e" strokeWidth={3} dot={{ r: 4, fill: '#0f766e' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Improvement</h2>
          {improvements.length ? (
            <ul className="space-y-3">
              {improvements.map((a) => (
                <li key={a._id}>
                  <Link to={`/student/results/${a._id}`} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2.5 hover:bg-paper">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-muted">
                        Weak concepts: {a.improvement.pre}% → {a.improvement.post}%
                      </p>
                    </div>
                    <ImprovementBadge delta={a.improvement.delta} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Finish a practice set and take a retest to see your improvement score here.</p>
          )}
        </Card>
      </div>

      <section aria-labelledby="mastery" className="mt-6">
        <h2 id="mastery" className="mb-3 text-xl font-semibold">
          Concept mastery
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {mastery.map((m) => (
            <Card key={`${m.chapter}-${m.concept}`}>
              <MasteryBar concept={m.concept} mastery={m.mastery} sub={`${m.chapter} · ${m.attempts} questions answered`} />
              <div className="mt-2">
                <Badge tone={scoreTone(m.mastery)}>{masteryLabel(m.mastery)}</Badge>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </>
  )
}
