import type { GitHubRepository, GitHubUser } from '../types/github'
import { RepositoryCard } from './RepositoryCard'

type RepositoryListProps = {
  selectedUsers: GitHubUser[]
  activeUserLogin: string | null
  onFocusUser: (login: string) => void
  repositoryData: Record<string, GitHubRepository[]>
  repositoryLoading: Record<string, boolean>
  repositoryErrors: Record<string, string | null>
}

export function RepositoryList({
  selectedUsers,
  activeUserLogin,
  onFocusUser,
  repositoryData,
  repositoryLoading,
  repositoryErrors,
}: RepositoryListProps) {
  if (selectedUsers.length === 0) {
    return (
      <section className="repository-section panel">
        <h2>Repository Results</h2>
        <p className="empty-copy">Select GitHub users to view their repositories.</p>
      </section>
    )
  }

  const aggregatedRepositories = selectedUsers.flatMap((user) =>
    (repositoryData[user.login] ?? []).map((repository) => ({
      ...repository,
      owner: {
        ...repository.owner,
        login: user.login,
      },
    })),
  )

  const visibleRepositories = activeUserLogin
    ? aggregatedRepositories.filter((repository) => repository.owner.login === activeUserLogin)
    : aggregatedRepositories

  return (
    <section className="repository-section panel">
      <h2>
        {activeUserLogin ? `Repository Results for ${activeUserLogin}` : 'Repository Results'}
      </h2>

      <div className="repository-status-list">
        {selectedUsers.map((user) => {
          const isLoading = repositoryLoading[user.login]
          const error = repositoryErrors[user.login]
          const isActive = activeUserLogin === user.login

          return (
            <button
              key={user.login}
              type="button"
              className={`repository-status-item ${isActive ? 'is-active' : ''}`}
              onClick={() => onFocusUser(user.login)}
            >
              <span className="repository-user">{user.login}</span>
              {isLoading ? <span className="status-loading">Loading repositories...</span> : null}
              {error ? <span className="status-error">{error}</span> : null}
            </button>
          )
        })}
      </div>

      {visibleRepositories.length === 0 ? (
        <p className="empty-copy">
          {activeUserLogin
            ? `No repositories available for ${activeUserLogin}.`
            : 'No repositories available for the selected users.'}
        </p>
      ) : (
        <div className="repository-grid">
          {visibleRepositories.map((repository) => (
            <RepositoryCard key={`${repository.owner.login}-${repository.full_name}`} repository={repository} />
          ))}
        </div>
      )}
    </section>
  )
}
