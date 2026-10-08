import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './lib/auth.jsx'
import { Spinner } from './components/ui.jsx'
import AppShell from './components/AppShell.jsx'
import LoginPage from './pages/LoginPage.jsx'
import TeacherOverview from './pages/teacher/TeacherOverview.jsx'
import ChaptersPage from './pages/teacher/ChaptersPage.jsx'
import ChapterDetail from './pages/teacher/ChapterDetail.jsx'
import LectureView from './pages/shared/LectureView.jsx'
import TestPreview from './pages/teacher/TestPreview.jsx'
import StudentsPage from './pages/teacher/StudentsPage.jsx'
import StudentDetail from './pages/teacher/StudentDetail.jsx'
import StudentHome from './pages/student/StudentHome.jsx'
import StudentLectures from './pages/student/StudentLectures.jsx'
import StudentTests from './pages/student/StudentTests.jsx'
import TakeTest from './pages/student/TakeTest.jsx'
import ResultPage from './pages/shared/ResultPage.jsx'
import PracticePage from './pages/student/PracticePage.jsx'
import ProgressPage from './pages/student/ProgressPage.jsx'

function Protected({ role, children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner label="Loading your classroom" />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />
  return <AppShell role={role}>{children}</AppShell>
}

function Home() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner label="Loading" />
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />
}

export default function App() {
  const teacher = (el) => <Protected role="teacher">{el}</Protected>
  const student = (el) => <Protected role="student">{el}</Protected>

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />

      <Route path="/teacher" element={teacher(<TeacherOverview />)} />
      <Route path="/teacher/chapters" element={teacher(<ChaptersPage />)} />
      <Route path="/teacher/chapters/:id" element={teacher(<ChapterDetail />)} />
      <Route path="/teacher/lectures/:id" element={teacher(<LectureView />)} />
      <Route path="/teacher/tests/:id" element={teacher(<TestPreview />)} />
      <Route path="/teacher/students" element={teacher(<StudentsPage />)} />
      <Route path="/teacher/students/:id" element={teacher(<StudentDetail />)} />
      <Route path="/teacher/results/:id" element={teacher(<ResultPage />)} />

      <Route path="/student" element={student(<StudentHome />)} />
      <Route path="/student/lectures" element={student(<StudentLectures />)} />
      <Route path="/student/lectures/:id" element={student(<LectureView />)} />
      <Route path="/student/tests" element={student(<StudentTests />)} />
      <Route path="/student/tests/:id" element={student(<TakeTest />)} />
      <Route path="/student/results/:id" element={student(<ResultPage />)} />
      <Route path="/student/practice/:id" element={student(<PracticePage />)} />
      <Route path="/student/progress" element={student(<ProgressPage />)} />

      <Route path="*" element={<Home />} />
    </Routes>
  )
}
