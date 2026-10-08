import { NavLink, useNavigate } from 'react-router-dom'
import useSWR from 'swr'
import clsx from 'clsx'
import {
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  NotebookPen,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useAuth } from '../lib/auth.jsx'
import { initials } from '../lib/format.js'
import { Badge } from './ui.jsx'

const NAV = {
  teacher: [
    { to: '/teacher', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/teacher/chapters', label: 'Chapters', icon: BookOpen },
    { to: '/teacher/students', label: 'Students', icon: Users },
  ],
  student: [
    { to: '/student', label: 'Home', icon: LayoutDashboard, end: true },
    { to: '/student/lectures', label: 'Notes', icon: NotebookPen },
    { to: '/student/tests', label: 'Tests', icon: ClipboardCheck },
    { to: '/student/progress', label: 'Progress', icon: TrendingUp },
  ],
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-white">
        <GraduationCap className="size-5" aria-hidden />
      </span>
      <div className="leading-tight">
        <p className="font-display text-lg font-semibold">Smart Kaksha</p>
        <p className="text-[11px] text-muted">AI classroom companion</p>
      </div>
    </div>
  )
}

function AiStatus() {
  const { data } = useSWR('/health', { refreshInterval: 30000 })
  if (!data) return null
  const live = data.ai.mode === 'gemini'
  return (
    <Badge tone={live ? 'brand' : 'accent'} className="w-fit">
      <Sparkles className="size-3" aria-hidden />
      {live ? 'Gemini live' : 'Demo AI'}
    </Badge>
  )
}

export default function AppShell({ role, children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const items = NAV[role]

  const signOut = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="hidden border-r border-line bg-white/70 lg:flex lg:flex-col lg:p-5">
        <Brand />
        <nav aria-label="Main" className="mt-8 flex flex-1 flex-col gap-1">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                  isActive ? 'bg-brand-soft text-brand-dark' : 'text-muted hover:bg-paper hover:text-ink',
                )
              }
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-3 border-t border-line pt-4">
          <AiStatus />
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-[#8a5200]">
              {initials(user.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-muted capitalize">{role}</p>
            </div>
            <button onClick={signOut} aria-label="Sign out" className="rounded-md p-2 text-muted hover:bg-paper hover:text-ink">
              <LogOut className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col pb-20 lg:pb-0">
        <header className="flex items-center justify-between border-b border-line bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
          <Brand />
          <div className="flex items-center gap-2">
            <AiStatus />
            <button onClick={signOut} aria-label="Sign out" className="rounded-md p-2 text-muted hover:bg-paper">
              <LogOut className="size-4" aria-hidden />
            </button>
          </div>
        </header>
        <main className="fade-up mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 grid border-t border-line bg-white/95 backdrop-blur lg:hidden"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx('flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium', isActive ? 'text-brand' : 'text-muted')
            }
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
