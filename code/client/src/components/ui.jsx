import clsx from 'clsx'
import { Loader2 } from 'lucide-react'

const buttonVariants = {
  primary: 'bg-brand text-white hover:bg-brand-dark shadow-sm',
  secondary: 'bg-white text-ink border border-line hover:bg-paper',
  accent: 'bg-accent text-ink hover:brightness-95',
  ghost: 'text-ink hover:bg-brand-soft',
  danger: 'bg-white text-bad border border-line hover:bg-bad-soft',
}
const buttonSizes = { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-base' }

export function Button({ variant = 'primary', size = 'md', loading, disabled, className, children, ...props }) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

export function Card({ className, children, ...props }) {
  return (
    <div className={clsx('rounded-xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(29,39,51,0.04)]', className)} {...props}>
      {children}
    </div>
  )
}

const badgeTones = {
  neutral: 'bg-paper text-muted border border-line',
  brand: 'bg-brand-soft text-brand-dark',
  accent: 'bg-accent-soft text-[#8a5200]',
  good: 'bg-good-soft text-[#1c6b47]',
  bad: 'bg-bad-soft text-[#a1322b]',
}

export function Badge({ tone = 'neutral', className, children }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', badgeTones[tone], className)}>
      {children}
    </span>
  )
}

const barTones = { brand: 'bg-brand', good: 'bg-good', accent: 'bg-accent', bad: 'bg-bad' }

export function ProgressBar({ value, tone = 'brand', label, className }) {
  const pct = Math.max(0, Math.min(100, value ?? 0))
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={clsx('h-2 w-full overflow-hidden rounded-full bg-line/70', className)}
    >
      <div className={clsx('h-full rounded-full transition-all duration-500', barTones[tone])} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Spinner({ label = 'Loading' }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-16 text-muted">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span className="text-sm">{label}…</span>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-line bg-white/60 px-6 py-12 text-center">
      {Icon && (
        <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-brand-soft text-brand">
          <Icon className="size-5" aria-hidden />
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {children && <p className="mt-1 max-w-md text-sm text-muted">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions, eyebrow }) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-semibold tracking-wide text-brand uppercase">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold text-balance">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

export function Stat({ label, value, hint, tone }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
      <p
        className={clsx(
          'mt-1 font-display text-3xl font-semibold',
          tone === 'good' && 'text-good',
          tone === 'bad' && 'text-bad',
        )}
      >
        {value ?? '–'}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </Card>
  )
}

export function Alert({ tone = 'bad', children }) {
  return (
    <div
      role="alert"
      className={clsx(
        'rounded-lg border px-3 py-2 text-sm',
        tone === 'bad' ? 'border-bad/30 bg-bad-soft text-[#8f2a23]' : 'border-brand/20 bg-brand-soft text-brand-dark',
      )}
    >
      {children}
    </div>
  )
}

const inputBase =
  'w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20'

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export const Input = ({ className, ...props }) => <input className={clsx(inputBase, 'h-10', className)} {...props} />
export const Textarea = ({ className, ...props }) => <textarea className={clsx(inputBase, 'min-h-24', className)} {...props} />
export const Select = ({ className, ...props }) => <select className={clsx(inputBase, 'h-10', className)} {...props} />

export function Sparkline({ values, width = 96, height = 28, className }) {
  if (!values?.length) return <span className="text-xs text-muted">No data</span>
  const pts = values.length === 1 ? [values[0], values[0]] : values
  const step = width / (pts.length - 1)
  const path = pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(height - 3 - (v / 100) * (height - 6)).toFixed(1)}`).join(' ')
  const last = pts[pts.length - 1]
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className={className} role="img" aria-label={`Trend: ${values.join('%, ')}%`}>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width} cy={height - 3 - (last / 100) * (height - 6)} r="3" fill="currentColor" />
    </svg>
  )
}

export function MasteryBar({ concept, mastery, sub }) {
  const tone = mastery >= 80 ? 'good' : mastery >= 60 ? 'accent' : 'bad'
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-medium">{concept}</p>
        <p className="shrink-0 text-sm font-semibold tabular-nums">{mastery}%</p>
      </div>
      <ProgressBar value={mastery} tone={tone} label={`${concept} mastery`} />
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  )
}

export function ImprovementBadge({ delta }) {
  if (delta == null) return <span className="text-muted">–</span>
  return <Badge tone={delta > 0 ? 'good' : delta < 0 ? 'bad' : 'neutral'}>{delta > 0 ? `+${delta}` : delta} pts</Badge>
}
