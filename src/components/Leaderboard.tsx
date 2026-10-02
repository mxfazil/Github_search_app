import { useMemo } from 'react'
import type { GitHubUser } from '../types/github'
import { buildLeaderboard } from '../utils/vowelCount'

type LeaderboardProps = {
  users: GitHubUser[]
}

export function Leaderboard({ users }: LeaderboardProps) {
  const leaderboard = useMemo(() => buildLeaderboard(users), [users])

  if (users.length === 0) {
    return (
      <section className="leaderboard panel" aria-live="polite">
        <h2>Vowel Count Leaderboard</h2>
        <p className="empty-copy">Select GitHub users to see the leaderboard.</p>
      </section>
    )
  }

  return (
    <section className="leaderboard panel" aria-live="polite">
      <h2>Vowel Count Leaderboard</h2>
      <ol className="leaderboard-list">
        {leaderboard.map(({ login, vowelCount }, index) => (
          <li key={login} className="leaderboard-item">
            <span className="leaderboard-rank">{index + 1}.</span>
            <span className="leaderboard-login">{login}</span>
            <span className="leaderboard-vowel-count">{vowelCount} vowels</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
