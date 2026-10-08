import { Link } from 'react-router-dom'
import useSWR from 'swr'
import { ClipboardList } from 'lucide-react'
import { Badge, Button, Card, EmptyState, ImprovementBadge, PageHeader, Spinner } from '../../components/ui.jsx'
import { scoreTone } from '../../lib/format.js'

function TestCard({ test }) {
  const done = test.myAttempt
  return (
    <Card className="flex flex-wrap items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <Badge tone={test.kind === 'retest' ? 'accent' : 'brand'}>{test.kind === 'retest' ? 'Personalized retest' : `Week ${test.week}`}</Badge>
          {test.chapter && <span className="text-xs text-muted">{test.chapter.title}</span>}
        </div>
        <p className="truncate font-semibold">{test.title}</p>
        <p className="truncate text-xs text-muted">
          {test.questionCount} questions · {test.concepts.slice(0, 3).join(', ')}
        </p>
      </div>
      {done ? (
        <>
          {done.improvement && <ImprovementBadge delta={done.improvement.delta} />}
          <Badge tone={scoreTone(done.percent)}>{done.percent}%</Badge>
          <Link to={`/student/results/${done._id}`}>
            <Button size="sm" variant="secondary">
              View result
            </Button>
          </Link>
        </>
      ) : (
        <Link to={`/student/tests/${test._id}`}>
          <Button size="sm">Take test</Button>
        </Link>
      )}
    </Card>
  )
}

export default function StudentTests() {
  const { data, error } = useSWR('/tests')
  if (error) return <EmptyState title="Could not load tests">{error.message}</EmptyState>
  if (!data) return <Spinner label="Loading tests" />

  const available = data.tests.filter((t) => !t.myAttempt)
  const completed = data.tests.filter((t) => t.myAttempt)

  return (
    <>
      <PageHeader eyebrow="Assessments" title="Weekly tests" subtitle="Each test is scored instantly and analyzed for misconceptions." />
      <section aria-labelledby="available" className="mb-8">
        <h2 id="available" className="mb-3 text-xl font-semibold">
          Available
        </h2>
        {available.length ? (
          <div className="space-y-3">
            {available.map((t) => (
              <TestCard key={t._id} test={t} />
            ))}
          </div>
        ) : (
          <EmptyState icon={ClipboardList} title="No tests waiting">
            Your teacher has not published a new test yet.
          </EmptyState>
        )}
      </section>
      {completed.length > 0 && (
        <section aria-labelledby="completed">
          <h2 id="completed" className="mb-3 text-xl font-semibold">
            Completed
          </h2>
          <div className="space-y-3">
            {completed.map((t) => (
              <TestCard key={t._id} test={t} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
