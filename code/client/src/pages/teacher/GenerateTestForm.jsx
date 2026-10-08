import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { api } from '../../lib/api.js'
import { Alert, Button, Card, Field, Input, Select } from '../../components/ui.jsx'

export default function GenerateTestForm({ chapter, lectures, nextWeek, onCancel }) {
  const navigate = useNavigate()
  const ready = lectures.filter((l) => l.status === 'ready')
  const [selected, setSelected] = useState(ready.map((l) => l._id))
  const [perConcept, setPerConcept] = useState(2)
  const [week, setWeek] = useState(nextWeek)
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const submit = async (e) => {
    e.preventDefault()
    if (!selected.length) return setError('Select at least one lecture.')
    setBusy(true)
    setError('')
    try {
      const { test } = await api('/tests/generate', {
        method: 'POST',
        body: { chapterId: chapter._id, lectureIds: selected, questionsPerConcept: Number(perConcept), week: Number(week), title: title || undefined },
      })
      navigate(`/teacher/tests/${test._id}`)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Card className="mb-6">
      <form onSubmit={submit} className="space-y-4">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Cover these lectures</legend>
          {ready.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {ready.map((l) => (
                <label key={l._id} className="flex cursor-pointer items-start gap-2 rounded-lg border border-line p-3 text-sm has-checked:border-brand has-checked:bg-brand-soft">
                  <input type="checkbox" className="mt-0.5 accent-brand" checked={selected.includes(l._id)} onChange={() => toggle(l._id)} />
                  <span>
                    <span className="block font-medium">{l.title}</span>
                    <span className="text-xs text-muted">{l.concepts.length} concepts</span>
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Upload a lecture first. Tests are built from lecture concepts.</p>
          )}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Test title (optional)">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`Week ${week} test`} />
          </Field>
          <Field label="Week">
            <Input type="number" min={1} value={week} onChange={(e) => setWeek(e.target.value)} />
          </Field>
          <Field label="Questions per concept">
            <Select value={perConcept} onChange={(e) => setPerConcept(e.target.value)}>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </Select>
          </Field>
        </div>

        {error && <Alert>{error}</Alert>}
        <div className="flex gap-2">
          <Button type="submit" loading={busy} disabled={!ready.length}>
            <Sparkles className="size-4" aria-hidden /> Generate test
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
        <p className="text-xs text-muted">The test is saved as a draft. Review the questions, then publish it to students.</p>
      </form>
    </Card>
  )
}
