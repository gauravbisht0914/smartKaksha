import { useState } from 'react'
import { Link } from 'react-router-dom'
import useSWR from 'swr'
import { ArrowRight, BookOpen, Plus, Trash2 } from 'lucide-react'
import { api } from '../../lib/api.js'
import { Alert, Badge, Button, Card, EmptyState, Field, Input, PageHeader, Spinner, Textarea } from '../../components/ui.jsx'

function NewChapterForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({ title: '', subject: '', description: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/chapters', { method: 'POST', body: form })
      onCreated()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Card className="mb-6">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Chapter title">
          <Input value={form.title} onChange={set('title')} required placeholder="e.g. Photosynthesis" />
        </Field>
        <Field label="Subject">
          <Input value={form.subject} onChange={set('subject')} required placeholder="e.g. Biology" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Description (optional)">
            <Textarea value={form.description} onChange={set('description')} rows={2} />
          </Field>
        </div>
        {error && (
          <div className="sm:col-span-2">
            <Alert>{error}</Alert>
          </div>
        )}
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" loading={busy}>
            Create chapter
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}

export default function ChaptersPage() {
  const { data, error, mutate } = useSWR('/chapters')
  const [creating, setCreating] = useState(false)

  const remove = async (chapter) => {
    if (!window.confirm(`Delete "${chapter.title}" with all its lectures, tests and student results?`)) return
    await api(`/chapters/${chapter._id}`, { method: 'DELETE' })
    mutate()
  }

  if (error) return <EmptyState title="Could not load chapters">{error.message}</EmptyState>
  if (!data) return <Spinner label="Loading chapters" />

  return (
    <>
      <PageHeader
        eyebrow="Teacher dashboard"
        title="Chapters"
        subtitle="Organize lectures by chapter, then generate weekly tests from what you taught."
        actions={
          !creating && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" aria-hidden /> New chapter
            </Button>
          )
        }
      />

      {creating && (
        <NewChapterForm
          onCancel={() => setCreating(false)}
          onCreated={() => {
            setCreating(false)
            mutate()
          }}
        />
      )}

      {data.chapters.length === 0 ? (
        <EmptyState icon={BookOpen} title="No chapters yet">
          Create your first chapter, then upload a lecture recording.
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.chapters.map((c) => (
            <Card key={c._id} className="flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <Badge tone="brand">{c.subject}</Badge>
                <button
                  onClick={() => remove(c)}
                  aria-label={`Delete ${c.title}`}
                  className="rounded-md p-1.5 text-muted hover:bg-bad-soft hover:text-bad"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
              <h2 className="mt-3 text-xl font-semibold">{c.title}</h2>
              <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted">{c.description || 'No description.'}</p>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
                <span className="text-muted">
                  {c.lectureCount} lectures · {c.testCount} tests
                </span>
                <Link to={`/teacher/chapters/${c._id}`} className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
                  Open <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
