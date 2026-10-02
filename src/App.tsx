import { useEffect, useRef, useState } from 'react'
import { Leaderboard } from './components/Leaderboard'
import { MultiSelect } from './components/MultiSelect'
import { RepositoryList } from './components/RepositoryList'
import { fetchUserRepositories } from './services/githubApi'
import type { GitHubRepository, GitHubUser } from './types/github'
import './App.css'

function App() {
  const [selectedUsers, setSelectedUsers] = useState<GitHubUser[]>([])
  const [activeUserLogin, setActiveUserLogin] = useState<string | null>(null)
  const [repositoryData, setRepositoryData] = useState<Record<string, GitHubRepository[]>>({})
  const [repositoryLoading, setRepositoryLoading] = useState<Record<string, boolean>>({})
  const [repositoryErrors, setRepositoryErrors] = useState<Record<string, string | null>>({})

  const selectedUsersRef = useRef<GitHubUser[]>([])
  const repositoryDataRef = useRef<Record<string, GitHubRepository[]>>({})
  const repositoryLoadingRef = useRef<Record<string, boolean>>({})
  const repositoryAbortControllersRef = useRef<Record<string, AbortController>>({})
  const repositoryRequestIdsRef = useRef<Record<string, number>>({})

  useEffect(() => {
    selectedUsersRef.current = selectedUsers
  }, [selectedUsers])

  useEffect(() => {
    repositoryDataRef.current = repositoryData
  }, [repositoryData])

  useEffect(() => {
    repositoryLoadingRef.current = repositoryLoading
  }, [repositoryLoading])

  useEffect(() => {
    const activeLogins = new Set(selectedUsers.map((user) => user.login))

    setRepositoryData((current) => {
      const next = { ...current }
      for (const login of Object.keys(next)) {
        if (!activeLogins.has(login)) {
          delete next[login]
        }
      }
      return next
    })

    setRepositoryLoading((current) => {
      const next = { ...current }
      for (const login of Object.keys(next)) {
        if (!activeLogins.has(login)) {
          delete next[login]
        }
      }
      return next
    })

    setRepositoryErrors((current) => {
      const next = { ...current }
      for (const login of Object.keys(next)) {
        if (!activeLogins.has(login)) {
          delete next[login]
        }
      }
      return next
    })
  }, [selectedUsers])

  useEffect(() => {
    const activeLogins = new Set(selectedUsers.map((user) => user.login))

    for (const login of Object.keys(repositoryAbortControllersRef.current)) {
      if (!activeLogins.has(login)) {
        repositoryAbortControllersRef.current[login]?.abort()
        delete repositoryAbortControllersRef.current[login]
        repositoryRequestIdsRef.current[login] =
          (repositoryRequestIdsRef.current[login] ?? 0) + 1
      }
    }

    selectedUsers.forEach((user) => {
      const login = user.login

      if (repositoryDataRef.current[login] || repositoryLoadingRef.current[login]) {
        return
      }

      const requestId = (repositoryRequestIdsRef.current[login] ?? 0) + 1
      repositoryRequestIdsRef.current[login] = requestId

      const controller = new AbortController()
      repositoryAbortControllersRef.current[login] = controller

      setRepositoryLoading((current) => ({ ...current, [login]: true }))
      setRepositoryErrors((current) => ({ ...current, [login]: null }))

      void fetchUserRepositories(login, controller.signal)
        .then((repositories) => {
          if (!selectedUsersRef.current.some((selectedUser) => selectedUser.login === login)) {
            return
          }

          if ((repositoryRequestIdsRef.current[login] ?? 0) !== requestId) {
            return
          }

          setRepositoryData((current) => ({ ...current, [login]: repositories }))
          setRepositoryLoading((current) => {
            const next = { ...current }
            delete next[login]
            return next
          })
          setRepositoryErrors((current) => ({ ...current, [login]: null }))
        })
        .catch((error: unknown) => {
          if (error instanceof Error && error.name === 'AbortError') {
            return
          }

          if (!selectedUsersRef.current.some((selectedUser) => selectedUser.login === login)) {
            return
          }

          if ((repositoryRequestIdsRef.current[login] ?? 0) !== requestId) {
            return
          }

          setRepositoryLoading((current) => {
            const next = { ...current }
            delete next[login]
            return next
          })
          setRepositoryErrors((current) => ({
            ...current,
            [login]: 'Unable to load repositories for this user.',
          }))
        })
    })
  }, [selectedUsers])

  const handleSelectUser = (user: GitHubUser) => {
    setSelectedUsers((current) => {
      if (current.some((selectedUser) => selectedUser.login === user.login)) {
        return current
      }

      return [...current, user]
    })
  }

  const handleRemoveUser = (login: string) => {
    repositoryAbortControllersRef.current[login]?.abort()
    delete repositoryAbortControllersRef.current[login]
    repositoryRequestIdsRef.current[login] = (repositoryRequestIdsRef.current[login] ?? 0) + 1

    setSelectedUsers((current) => current.filter((user) => user.login !== login))
    setRepositoryData((current) => {
      const next = { ...current }
      delete next[login]
      return next
    })
    setRepositoryLoading((current) => {
      const next = { ...current }
      delete next[login]
      return next
    })
    setRepositoryErrors((current) => {
      const next = { ...current }
      delete next[login]
      return next
    })

    if (activeUserLogin === login) {
      setActiveUserLogin(null)
    }
  }

  const handleFocusUser = (login: string) => {
    setActiveUserLogin((current) => (current === login ? null : login))
  }

  return (
    <main className="dashboard-shell">
      <header className="page-header">
        <p className="eyebrow">GitHub User & Derived State Aggregator</p>
        <h1>GitHub User &amp; Repository Aggregator</h1>
      </header>

      <Leaderboard users={selectedUsers} />

      <section className="selector-section panel">
        <h2>Select GitHub Users</h2>
        <MultiSelect
          selectedUsers={selectedUsers}
          onSelectUser={handleSelectUser}
          onRemoveUser={handleRemoveUser}
          onFocusUser={handleFocusUser}
        />
      </section>

      <RepositoryList
        selectedUsers={selectedUsers}
        activeUserLogin={activeUserLogin}
        onFocusUser={handleFocusUser}
        repositoryData={repositoryData}
        repositoryLoading={repositoryLoading}
        repositoryErrors={repositoryErrors}
      />
    </main>
  )
}

export default App
