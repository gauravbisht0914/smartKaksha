import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import useSWR from 'swr'
import { ArrowLeft, Bookmark, BookmarkCheck, FileText, Lightbulb } from 'lucide-react'
import clsx from 'clsx'
import { api } from '../../lib/api.js'
import { useAuth } from '../../lib/auth.jsx'
import { Badge, Button, Card, EmptyState, PageHeader, Spinner } from '../../components/ui.jsx'

export default function LectureView() {
  const { id } = useParams()
  const { user } = useAuth()
  const isTeacher = user.role === 'teacher'
  const base = isTeacher ? '/teacher' : '/student'
  const { data, error, mutate } = useSWR(`/lectures/${id}`)
  const [tab, setTab] = useState('notes')

  if (error) return <EmptyState title="Lecture not available">{error.message}</EmptyState>
  if (!data) return <Spinner label="Loading lecture" />

  const { lecture, chapter, missed } = data
  const toggleMissed = async () => {
    await api(`/student/lectures/${lecture._id}/missed`, { method: 'POST' })
    mutate()
  }

  const tabs = [
    { key: 'notes', label: 'Notes' },
    { key: 'concepts', label: `Concepts (${lecture.concepts.length})` },
    ...(lecture.transcript ? [{ key: 'transcript', label: 'Transcript' }] : []),
  ]

  return (
    <>
      <Link
        to={isTeacher ? `/teacher/chapters/${chapter._id}` : '/student/lectures'}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden /> {isTeacher ? chapter.title : 'All notes'}
      </Link>
      <PageHeader
        eyebrow={`${chapter.subject} · ${chapter.title} · Week ${lecture.week}`}
        title={lecture.title}
        subtitle={lecture.summary}
        actions={
          <>
            <Badge tone={lecture.source === 'gemini' ? 'brand' : 'accent'}>{lecture.source === 'gemini' ? 'Gemini notes' : 'Demo AI notes'}</Badge>
            {!isTeacher && (
              <Button variant={missed ? 'primary' : 'secondary'} size="sm" onClick={toggleMissed}>
                {missed ? <BookmarkCheck className="size-4" aria-hidden /> : <Bookmark className="size-4" aria-hidden />}
                {missed ? 'Marked as missed' : 'I missed this class'}
              </Button>
            )}
          </>
        }
      />

      <div role="tablist" aria-label="Lecture sections" className="mb-5 flex gap-1 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              '-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition',
              tab === t.key ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'notes' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {lecture.sections.map((s) => (
              <Card key={s.heading}>
                <h2 className="text-xl font-semibold">{s.heading}</h2>
                <p className="mt-2 leading-relaxed text-ink/90">{s.body}</p>
              </Card>
            ))}
          </div>
          <aside>
            <Card className="lg:sticky lg:top-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Lightbulb className="size-4 text-accent" aria-hidden /> Key terms
              </h2>
              <dl className="mt-3 space-y-3">
                {lecture.keyTerms.map((k) => (
                  <div key={k.term}>
                    <dt className="text-sm font-semibold">{k.term}</dt>
                    <dd className="text-sm text-muted">{k.definition}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </aside>
        </div>
      )}

      {tab === 'concepts' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {lecture.concepts.map((c, i) => (
            <Card key={c.name}>
              <span className="text-xs font-semibold tracking-wide text-brand uppercase">Concept {i + 1}</span>
              <h2 className="mt-1 text-lg font-semibold">{c.name}</h2>
              <p className="mt-1 text-sm text-muted">{c.description}</p>
            </Card>
          ))}
        </div>
      )}

      {tab === 'transcript' && (
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <FileText className="size-4 text-muted" aria-hidden /> Full transcript
          </h2>
          <p className="leading-relaxed whitespace-pre-line text-ink/90">{lecture.transcript}</p>
        </Card>
      )}
    </>
  )
}
