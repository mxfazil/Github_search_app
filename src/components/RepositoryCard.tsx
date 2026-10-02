import type { GitHubRepository } from '../types/github'

type RepositoryCardProps = {
  repository: GitHubRepository
}

export function RepositoryCard({ repository }: RepositoryCardProps) {
  return (
    <article className="repository-card">
      <div className="repository-header">
        <div>
          <h3>{repository.name}</h3>
          <p className="repository-owner">{repository.owner.login}</p>
        </div>
        <a href={repository.html_url} target="_blank" rel="noreferrer" className="repository-link">
          View
        </a>
      </div>

      <p className="repository-description">
        {repository.description || 'No description provided.'}
      </p>

      <div className="repository-meta">
        <span>⭐ {repository.stargazers_count}</span>
        <span>🍴 {repository.forks_count}</span>
        {repository.language ? <span>{repository.language}</span> : null}
      </div>
    </article>
  )
}
