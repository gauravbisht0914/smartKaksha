import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import useSWR from 'swr'
import { AlertTriangle, ArrowLeft, AudioLines, ChevronDown, ClipboardList, Eye, EyeOff, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import { api } from '../../lib/api.js'
import { Badge, Button, Card, EmptyState, PageHeader, Spinner } from '../../components/ui.jsx'
import { scoreTone } from '../../lib/format.js'
import UploadLectureForm from './UploadLectureForm.jsx'
import GenerateTestForm from './GenerateTestForm.jsx'

function LectureRow({ lecture, onDelete }) {
  const body = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
        {lecture.status === 'processing' ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <AudioLines className="size-5" aria-hidden />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{lecture.title}</p>
        <p className="truncate text-xs text-muted">
          Week {lecture.week}
          {lecture.status === 'ready' && ` · ${lecture.concepts.length} concepts`}
          {lecture.status === 'processing' && ` · ${lecture.stage ?? 'Processing'}…`}
          {lecture.status === 'failed' && ` · ${lecture.error ?? 'Failed'}`}
        </p>
      </div>
    </>
  )

  return (
    <li className="flex items-center gap-3 py-3">
      {lecture.status === 'ready' ? (
        <Link to={`/teacher/lectures/${lecture._id}`} className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-80">
          {body}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">{body}</div>
      )}
      {lecture.status === 'failed' && <AlertTriangle className="size-4 text-bad" aria-label="Failed" />}
      {lecture.status === 'ready' && <Badge tone={lecture.source === 'gemini' ? 'brand' : 'accent'}>{lecture.source === 'gemini' ? 'Gemini' : 'Demo AI'}</Badge>}
      <button onClick={() => onDelete(lecture)} aria-label={`Delete ${lecture.title}`} className="rounded-md p-1.5 text-muted hover:bg-bad-soft hover:text-bad">
        <Trash2 className="size-4" aria-hidden />
      </button>
    </li>
  )
}

function TestResults({ testId }) {
  const { data } = useSWR(`/tests/${testId}/results`)
  if (!data) return <p className="px-1 py-3 text-sm text-muted">Loading results…</p>
  if (!data.results.length) return <p className="px-1 py-3 text-sm text-muted">No student has taken this test yet.</p>
  return (
    <ul className="divide-y divide-line">
      {data.results.map((r) => (
        <li key={r.attemptId}>
          <Link to={`/teacher/results/${r.attemptId}`} className="flex items-center gap-3 px-1 py-2.5 text-sm hover:bg-paper">
            <span className="min-w-0 flex-1 truncate font-medium">{r.studentName}</span>
            <span className="hidden truncate text-xs text-muted sm:block">{r.weakConcepts.slice(0, 2).join(' · ')}</span>
            <Badge tone={scoreTone(r.percent)}>
              {r.score}/{r.total}
            </Badge>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function TestRow({ test, onToggle, onDelete }) {
  const [open, setOpen] = useState(false)
  return (
    <li className="py-3">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-[#8a5200]">
          <ClipboardList className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <Link to={`/teacher/tests/${test._id}`} className="block truncate font-medium hover:underline">
            {test.title}
          </Link>
          <p className="truncate text-xs text-muted">
            Week {test.week} · {test.questionCount} questions · {test.attemptCount} attempts
            {test.averagePercent != null && ` · ${test.averagePercent}% avg`}
          </p>
        </div>
        <Badge tone={test.published ? 'good' : 'neutral'}>{test.published ? 'Published' : 'Draft'}</Badge>
        <Button size="sm" variant="secondary" onClick={() => onToggle(test)} aria-label={test.published ? 'Unpublish' : 'Publish'}>
          {test.published ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          <span className="hidden sm:inline">{test.published ? 'Unpublish' : 'Publish'}</span>
        </Button>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Toggle results"
          className="rounded-md p-1.5 text-muted hover:bg-paper"
        >
          <ChevronDown className={clsx('size-4 transition', open && 'rotate-180')} aria-hidden />
        </button>
        <button onClick={() => onDelete(test)} aria-label={`Delete ${test.title}`} className="rounded-md p-1.5 text-muted hover:bg-bad-soft hover:text-bad">
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>
      {open && (
        <div className="mt-2 ml-13 rounded-lg border border-line bg-white px-3">
          <TestResults testId={test._id} />
        </div>
      )}
    </li>
  )
}

export default function ChapterDetail() {
  const { id } = useParams()
  const { data, error, mutate } = useSWR(`/chapters/${id}`, {
    refreshInterval: (d) => (d?.lectures.some((l) => l.status === 'processing') ? 2000 : 0),
  })
  const [panel, setPanel] = useState(null)

  if (error) return <EmptyState title="Chapter not found">{error.message}</EmptyState>
  if (!data) return <Spinner label="Loading chapter" />

  const { chapter, lectures, tests } = data
  const nextWeek = Math.max(1, ...lectures.map((l) => l.week), ...tests.map((t) => t.week))

  const removeLecture = async (l) => {
    if (!window.confirm(`Delete lecture "${l.title}"?`)) return
    await api(`/lectures/${l._id}`, { method: 'DELETE' })
    mutate()
  }
  const toggleTest = async (t) => {
    await api(`/tests/${t._id}`, { method: 'PATCH', body: { published: !t.published } })
    mutate()
  }
  const removeTest = async (t) => {
    if (!window.confirm(`Delete "${t.title}" and its results?`)) return
    await api(`/tests/${t._id}`, { method: 'DELETE' })
    mutate()
  }

  return (
    <>
      <Link to="/teacher/chapters" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> All chapters
      </Link>
      <PageHeader eyebrow={chapter.subject} title={chapter.title} subtitle={chapter.description} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="lectures-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="lectures-heading" className="text-xl font-semibold">
              Lectures
            </h2>
            {panel !== 'lecture' && (
              <Button size="sm" onClick={() => setPanel('lecture')}>
                <Plus className="size-4" aria-hidden /> Add lecture
              </Button>
            )}
          </div>
          {panel === 'lecture' && (
            <UploadLectureForm
              chapterId={chapter._id}
              nextWeek={nextWeek}
              onCancel={() => setPanel(null)}
              onDone={() => {
                setPanel(null)
                mutate()
              }}
            />
          )}
          <Card className="py-2">
            {lectures.length ? (
              <ul className="divide-y divide-line">
                {lectures.map((l) => (
                  <LectureRow key={l._id} lecture={l} onDelete={removeLecture} />
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-muted">No lectures yet. Upload one to generate notes.</p>
            )}
          </Card>
        </section>

        <section aria-labelledby="tests-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="tests-heading" className="text-xl font-semibold">
              Weekly tests
            </h2>
            {panel !== 'test' && (
              <Button size="sm" variant="accent" onClick={() => setPanel('test')}>
                <Sparkles className="size-4" aria-hidden /> Generate test
              </Button>
            )}
          </div>
          {panel === 'test' && <GenerateTestForm chapter={chapter} lectures={lectures} nextWeek={nextWeek} onCancel={() => setPanel(null)} />}
          <Card className="py-2">
            {tests.length ? (
              <ul className="divide-y divide-line">
                {tests.map((t) => (
                  <TestRow key={t._id} test={t} onToggle={toggleTest} onDelete={removeTest} />
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-muted">No tests yet. Generate one from your lectures.</p>
            )}
          </Card>
        </section>
      </div>
    </>
  )
}
