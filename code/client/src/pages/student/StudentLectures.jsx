import { useState } from 'react'
import { Link } from 'react-router-dom'
import useSWR from 'swr'
import { BookOpen } from 'lucide-react'
import clsx from 'clsx'
import { Badge, Card, EmptyState, PageHeader, Spinner } from '../../components/ui.jsx'

export default function StudentLectures() {
  const { data, error } = useSWR('/student/lectures')
  const [filter, setFilter] = useState('all')

  if (error) return <EmptyState title="Could not load notes">{error.message}</EmptyState>
  if (!data) return <Spinner label="Loading notes" />

  const lectures = filter === 'missed' ? data.lectures.filter((l) => l.missed) : data.lectures
  const missedCount = data.lectures.filter((l) => l.missed).length

  return (
    <>
      <PageHeader eyebrow="Lecture notes" title="Notes & concepts" subtitle="AI-generated notes from every lecture. Mark lectures you missed to find them quickly." />

      <div role="tablist" aria-label="Filter lectures" className="mb-5 inline-flex rounded-lg border border-line bg-white p-1">
        {[
          { key: 'all', label: `All (${data.lectures.length})` },
          { key: 'missed', label: `Missed (${missedCount})` },
        ].map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={filter === t.key}
            onClick={() => setFilter(t.key)}
            className={clsx(
              'rounded-md px-4 py-1.5 text-sm font-semibold transition',
              filter === t.key ? 'bg-brand text-white' : 'text-muted hover:text-ink',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {lectures.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {lectures.map((l) => (
            <Link key={l._id} to={`/student/lectures/${l._id}`} className="group block">
              <Card className="h-full transition group-hover:border-brand/50 group-hover:shadow-md">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge tone="brand">{l.chapter?.subject}</Badge>
                  <span className="text-xs text-muted">
                    {l.chapter?.title} · Week {l.week}
                  </span>
                  {l.missed && <Badge tone="accent">Missed</Badge>}
                </div>
                <h2 className="text-lg font-semibold group-hover:text-brand">{l.title}</h2>
                <p className="mt-1 line-clamp-3 text-sm text-muted">{l.summary}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {l.concepts.slice(0, 4).map((c) => (
                    <Badge key={c}>{c}</Badge>
                  ))}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={BookOpen} title={filter === 'missed' ? 'No missed lectures' : 'No notes yet'}>
          {filter === 'missed' ? 'Open a lecture and tap "I missed this class" to add it here.' : 'Notes appear as soon as your teacher uploads a lecture.'}
        </EmptyState>
      )}
    </>
  )
}
