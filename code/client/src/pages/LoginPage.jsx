import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AudioLines, ClipboardCheck, GraduationCap, LineChart, NotebookPen, Target } from 'lucide-react'
import { useAuth } from '../lib/auth.jsx'
import { Alert, Button, Field, Input, Select } from '../components/ui.jsx'

const FLOW = [
  { icon: AudioLines, title: 'Upload a lecture', text: 'Audio becomes a transcript, notes and key concepts.' },
  { icon: NotebookPen, title: 'Students catch up', text: 'Missed a class? Clear notes are waiting.' },
  { icon: ClipboardCheck, title: 'Weekly test', text: 'Questions generated from what was taught.' },
  { icon: Target, title: 'Fix weak spots', text: 'Misconceptions found, practice adapts to each student.' },
  { icon: LineChart, title: 'Measure growth', text: 'Retest and see the improvement score.' },
]

export default function LoginPage() {
  const { user, login, signup } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  if (user) return <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const run = async (label, action) => {
    setError('')
    setBusy(label)
    try {
      const u = await action()
      navigate(u.role === 'teacher' ? '/teacher' : '/student')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  const submit = (e) => {
    e.preventDefault()
    run('form', () => (mode === 'login' ? login(form.email, form.password) : signup(form)))
  }

  const demo = (label, email) => run(label, () => login(email, 'demo1234'))

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-brand-dark p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-white/15">
            <GraduationCap className="size-6" aria-hidden />
          </span>
          <span className="font-display text-2xl font-semibold">Smart Kaksha</span>
        </div>
        <div>
          <h1 className="max-w-lg font-display text-5xl leading-[1.1] font-semibold text-balance">
            Every lecture becomes a learning loop.
          </h1>
          <p className="mt-4 max-w-md text-white/75">
            From a recorded class to personalized practice and a measurable improvement score, for every student.
          </p>
          <ol className="mt-10 space-y-5">
            {FLOW.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
                  <Icon className="size-5 text-accent" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold">
                    {i + 1}. {title}
                  </p>
                  <p className="text-sm text-white/70">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <p className="text-xs text-white/50">Prototype with a seeded demo class.</p>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-white">
              <GraduationCap className="size-5" aria-hidden />
            </span>
            <span className="font-display text-xl font-semibold">Smart Kaksha</span>
          </div>

          <h2 className="font-display text-3xl font-semibold">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="mt-1 text-sm text-muted">Jump straight into the demo class, or use your own account.</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button variant="primary" size="lg" loading={busy === 'teacher'} onClick={() => demo('teacher', 'teacher@smartkaksha.demo')}>
              Demo as Teacher
            </Button>
            <Button variant="accent" size="lg" loading={busy === 'student'} onClick={() => demo('student', 'student@smartkaksha.demo')}>
              Demo as Student
            </Button>
          </div>

          <div className="my-6 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" />
            or with email
            <span className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <Field label="Full name">
                  <Input value={form.name} onChange={set('name')} required autoComplete="name" />
                </Field>
                <Field label="I am a">
                  <Select value={form.role} onChange={set('role')}>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                  </Select>
                </Field>
              </>
            )}
            <Field label="Email">
              <Input type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
            </Field>
            <Field label="Password" hint={mode === 'signup' ? 'At least 6 characters.' : undefined}>
              <Input
                type="password"
                value={form.password}
                onChange={set('password')}
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </Field>
            {error && <Alert>{error}</Alert>}
            <Button type="submit" size="lg" className="w-full" loading={busy === 'form'}>
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            {mode === 'login' ? 'New here?' : 'Already registered?'}{' '}
            <button
              type="button"
              className="font-semibold text-brand hover:underline"
              onClick={() => {
                setError('')
                setMode(mode === 'login' ? 'signup' : 'login')
              }}
            >
              {mode === 'login' ? 'Create an account' : 'Sign in'}
            </button>
          </p>
        </div>
      </section>
    </div>
  )
}
