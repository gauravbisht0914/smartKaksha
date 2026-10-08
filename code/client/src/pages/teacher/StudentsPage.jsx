import { Link } from 'react-router-dom'
import useSWR from 'swr'
import { Users } from 'lucide-react'
import { Badge, Card, EmptyState, ImprovementBadge, PageHeader, Sparkline, Spinner } from '../../components/ui.jsx'
import { initials, scoreTone } from '../../lib/format.js'

function WeakChips({ concepts }) {
  if (!concepts.length) return <span className="text-xs text-muted">None</span>
  return (
    <div className="flex flex-wrap gap-1">
      {concepts.slice(0, 3).map((c) => (
        <Badge key={c.concept} tone="bad" className="max-w-48 truncate">
          {c.concept}
        </Badge>
      ))}
      {concepts.length > 3 && <Badge>+{concepts.length - 3}</Badge>}
    </div>
  )
}

export default function StudentsPage() {
  const { data, error } = useSWR('/teacher/students')
  if (error) return <EmptyState title="Could not load students">{error.message}</EmptyState>
  if (!data) return <Spinner label="Loading students" />

  const { students } = data

  return (
    <>
      <PageHeader
        eyebrow="Teacher dashboard"
        title="Students"
        subtitle="Student-wise scores, weak concepts and improvement after personalized practice."
      />

      {!students.length ? (
        <EmptyState icon={Users} title="No students yet">
          Students who sign up appear here automatically.
        </EmptyState>
      ) : (
        <>
          <Card className="hidden overflow-hidden p-0 md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-paper text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Score trend</th>
                  <th className="px-4 py-3 font-semibold">Latest</th>
                  <th className="px-4 py-3 font-semibold">Weak concepts</th>
                  <th className="px-4 py-3 font-semibold">Improvement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {students.map((s) => (
                  <tr key={s._id} className="hover:bg-paper/60">
                    <td className="px-4 py-3">
                      <Link to={`/teacher/students/${s._id}`} className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-dark">
                          {initials(s.name)}
                        </span>
                        <span>
                          <span className="block font-medium hover:underline">{s.name}</span>
                          <span className="block text-xs text-muted">
                            {s.testsTaken} tests · avg {s.averagePercent ?? '–'}%
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-brand">
                      <Sparkline values={s.trend} />
                    </td>
                    <td className="px-4 py-3">
                      {s.latestPercent != null ? <Badge tone={scoreTone(s.latestPercent)}>{s.latestPercent}%</Badge> : '–'}
                    </td>
                    <td className="px-4 py-3">
                      <WeakChips concepts={s.weakConcepts} />
                    </td>
                    <td className="px-4 py-3">
                      <ImprovementBadge delta={s.improvement} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <ul className="space-y-3 md:hidden">
            {students.map((s) => (
              <li key={s._id}>
                <Link to={`/teacher/students/${s._id}`}>
                  <Card className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-dark">
                          {initials(s.name)}
                        </span>
                        <div>
                          <p className="font-medium">{s.name}</p>
                          <p className="text-xs text-muted">
                            {s.testsTaken} tests · avg {s.averagePercent ?? '–'}%
                          </p>
                        </div>
                      </div>
                      <ImprovementBadge delta={s.improvement} />
                    </div>
                    <WeakChips concepts={s.weakConcepts} />
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
