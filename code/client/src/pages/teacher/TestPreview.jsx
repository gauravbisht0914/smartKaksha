import { Link, useParams } from 'react-router-dom'
import useSWR from 'swr'
import { ArrowLeft, Check, Eye, EyeOff } from 'lucide-react'
import clsx from 'clsx'
import { api } from '../../lib/api.js'
import { Badge, Button, Card, EmptyState, PageHeader, Spinner } from '../../components/ui.jsx'
import { difficultyLabel } from '../../lib/format.js'

export default function TestPreview() {
  const { id } = useParams()
  const { data, error, mutate } = useSWR(`/tests/${id}`)
  if (error) return <EmptyState title="Test not found">{error.message}</EmptyState>
  if (!data) return <Spinner label="Loading test" />

  const { test } = data
  const toggle = async () => {
    await api(`/tests/${test._id}`, { method: 'PATCH', body: { published: !test.published } })
    mutate()
  }

  return (
    <>
      <Link to={`/teacher/chapters/${test.chapter._id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> {test.chapter.title}
      </Link>
      <PageHeader
        eyebrow={`Week ${test.week} · ${test.questions.length} questions`}
        title={test.title}
        subtitle={test.published ? 'Published. Students can take this test now.' : 'Draft. Review the questions, then publish to make it available to students.'}
        actions={
          <Button variant={test.published ? 'secondary' : 'primary'} onClick={toggle}>
            {test.published ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            {test.published ? 'Unpublish' : 'Publish to students'}
          </Button>
        }
      />

      <ol className="space-y-4">
        {test.questions.map((q, i) => (
          <li key={q._id}>
            <Card>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-muted">Q{i + 1}</span>
                <Badge tone="brand">{q.concept}</Badge>
                <Badge>{difficultyLabel(q.difficulty)}</Badge>
              </div>
              <p className="font-medium">{q.prompt}</p>
              <ul className="mt-3 space-y-2">
                {q.options.map((opt, oi) => (
                  <li
                    key={oi}
                    className={clsx(
                      'flex items-start gap-2 rounded-lg border px-3 py-2 text-sm',
                      oi === q.correctIndex ? 'border-good bg-good-soft' : 'border-line',
                    )}
                  >
                    <span className="mt-0.5 w-4 shrink-0 font-semibold text-muted">{String.fromCharCode(65 + oi)}</span>
                    <span className="flex-1">
                      {opt}
                      {oi !== q.correctIndex && q.distractorNotes?.[oi] && (
                        <span className="mt-0.5 block text-xs text-muted">Likely misconception: {q.distractorNotes[oi]}</span>
                      )}
                    </span>
                    {oi === q.correctIndex && <Check className="size-4 text-good" aria-label="Correct answer" />}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted">
                <span className="font-medium text-ink">Explanation:</span> {q.explanation}
              </p>
            </Card>
          </li>
        ))}
      </ol>
    </>
  )
}
