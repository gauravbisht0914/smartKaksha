export const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

export const signed = (n) => (n == null ? '–' : `${n > 0 ? '+' : ''}${n}`)

export const scoreTone = (percent) => (percent >= 75 ? 'good' : percent >= 50 ? 'accent' : 'bad')

export const masteryLabel = (percent) => (percent >= 80 ? 'Strong' : percent >= 60 ? 'Developing' : 'Needs work')

export const initials = (name = '') =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

export const difficultyLabel = (level) => ['', 'Easy', 'Medium', 'Hard'][level] ?? 'Medium'
