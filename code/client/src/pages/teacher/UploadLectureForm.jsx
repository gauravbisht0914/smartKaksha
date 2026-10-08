import { useRef, useState } from 'react'
import { FileAudio, UploadCloud, X } from 'lucide-react'
import { api } from '../../lib/api.js'
import { Alert, Button, Card, Field, Input, Textarea } from '../../components/ui.jsx'

const MAX_MB = 18

export default function UploadLectureForm({ chapterId, nextWeek, onDone, onCancel }) {
  const inputRef = useRef(null)
  const [title, setTitle] = useState('')
  const [week, setWeek] = useState(nextWeek)
  const [transcript, setTranscript] = useState('')
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const pick = (f) => {
    if (!f) return
    if (f.size > MAX_MB * 1024 * 1024) return setError(`Audio must be under ${MAX_MB} MB for this prototype.`)
    setError('')
    setFile(f)
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const form = new FormData()
    form.append('title', title)
    form.append('week', String(week))
    form.append('transcript', transcript)
    if (file) form.append('audio', file)
    try {
      await api(`/chapters/${chapterId}/lectures`, { method: 'POST', form })
      onDone()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Card className="mb-6">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          <Field label="Lecture title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Light & pigments" />
          </Field>
          <Field label="Week">
            <Input type="number" min={1} value={week} onChange={(e) => setWeek(e.target.value)} required />
          </Field>
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium">Lecture audio</span>
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              pick(e.dataTransfer.files?.[0])
            }}
            className={`flex flex-col items-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
              dragging ? 'border-brand bg-brand-soft' : 'border-line bg-paper'
            }`}
          >
            {file ? (
              <div className="flex items-center gap-3">
                <FileAudio className="size-5 text-brand" aria-hidden />
                <span className="text-sm font-medium">{file.name}</span>
                <button type="button" onClick={() => setFile(null)} aria-label="Remove audio" className="rounded p-1 hover:bg-line/60">
                  <X className="size-4" aria-hidden />
                </button>
              </div>
            ) : (
              <>
                <UploadCloud className="size-6 text-muted" aria-hidden />
                <p className="mt-2 text-sm">
                  Drag an audio file here or{' '}
                  <button type="button" className="font-semibold text-brand hover:underline" onClick={() => inputRef.current?.click()}>
                    browse
                  </button>
                </p>
                <p className="text-xs text-muted">MP3, WAV, M4A or WebM, up to {MAX_MB} MB</p>
              </>
            )}
            <input ref={inputRef} type="file" accept="audio/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
          </div>
        </div>

        <Field label="Or paste a transcript" hint="Optional. Skips transcription. In demo mode, leave both empty to get a sample lecture matched to your title.">
          <Textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={3} />
        </Field>

        {error && <Alert>{error}</Alert>}
        <div className="flex gap-2">
          <Button type="submit" loading={busy}>
            Upload and generate notes
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}
