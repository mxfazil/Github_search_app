import { useEffect, useMemo, useRef, useState } from 'react'
import { useDebounce } from '../hooks/useDebounce'
import type { GitHubUser } from '../types/github'
import { GitHubApiError, searchUsers } from '../services/githubApi'

type MultiSelectProps = {
  selectedUsers: GitHubUser[]
  onSelectUser: (user: GitHubUser) => void
  onRemoveUser: (login: string) => void
  onFocusUser: (login: string) => void
}

export function MultiSelect({
  selectedUsers,
  onSelectUser,
  onRemoveUser,
  onFocusUser,
}: MultiSelectProps) {
  const [inputValue, setInputValue] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<GitHubUser[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchRetryAt, setSearchRetryAt] = useState<number | null>(null)
  const [searchRetryReady, setSearchRetryReady] = useState(true)
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const requestIdRef = useRef(0)
  const searchCacheRef = useRef(new Map<string, GitHubUser[]>())
  const [searchAttempt, setSearchAttempt] = useState(0)
  const debouncedQuery = useDebounce(inputValue, 500)

  const availableResults = useMemo(
    () =>
      searchResults.filter(
        (user) => !selectedUsers.some((selectedUser) => selectedUser.login === user.login),
      ),
    [searchResults, selectedUsers],
  )

  useEffect(() => {
    if (!dropdownOpen) {
      return undefined
    }

    const trimmedQuery = debouncedQuery.trim()

    if (!trimmedQuery) {
      setSearchResults([])
      setSearchLoading(false)
      setSearchError(null)
      setSearchRetryAt(null)
      setSearchRetryReady(true)
      return undefined
    }

    const requestNumber = ++requestIdRef.current
    const cachedResults = searchCacheRef.current.get(trimmedQuery)
    if (cachedResults) {
      setSearchResults(cachedResults)
      setSearchLoading(false)
      setSearchError(null)
      setSearchRetryAt(null)
      setSearchRetryReady(true)
      return undefined
    }

    const controller = new AbortController()

    setSearchLoading(true)
    setSearchError(null)
    setSearchRetryAt(null)
    setSearchRetryReady(true)

    void searchUsers(trimmedQuery, controller.signal)
      .then((users) => {
        if (requestNumber !== requestIdRef.current) {
          return
        }

        searchCacheRef.current.set(trimmedQuery, users)
        setSearchResults(users)
        setSearchLoading(false)
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        if (requestNumber !== requestIdRef.current) {
          return
        }

        if (error instanceof GitHubApiError && error.retryAt !== null) {
          setSearchError('GitHub user search is rate limited.')
          setSearchRetryAt(error.retryAt)
          setSearchRetryReady(error.retryAt <= Date.now())
        } else if (error instanceof GitHubApiError && error.status === 403) {
          setSearchError('GitHub denied the search request. Please try again later.')
        } else {
          setSearchError('Unable to load GitHub users right now. Please try again.')
        }
        setSearchResults([])
        setSearchLoading(false)
      })

    return () => {
      controller.abort()
    }
  }, [debouncedQuery, dropdownOpen, searchAttempt])

  useEffect(() => {
    if (searchRetryAt === null || searchRetryAt <= Date.now()) {
      return undefined
    }

    const timeoutId = window.setTimeout(
      () => setSearchRetryReady(true),
      searchRetryAt - Date.now(),
    )

    return () => window.clearTimeout(timeoutId)
  }, [searchRetryAt])

  useEffect(() => {
    if (!dropdownOpen) {
      return
    }

    setHighlightedIndex((current) => Math.min(current, Math.max(availableResults.length - 1, 0)))
  }, [availableResults.length, dropdownOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) {
        return
      }

      const target = event.target as Node | null

      if (target && !containerRef.current.contains(target)) {
        setDropdownOpen(false)
      }
    }

    if (!dropdownOpen) {
      return undefined
    }

    window.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  const handleResultSelect = (user: GitHubUser) => {
    const isAlreadySelected = selectedUsers.some(
      (selectedUser) => selectedUser.login === user.login,
    )

    if (isAlreadySelected) {
      return
    }

    onSelectUser(user)
    setInputValue('')
    setSearchResults([])
    setSearchError(null)
    setDropdownOpen(false)
    inputRef.current?.focus()
  }

  const moveHighlight = (direction: 'next' | 'previous') => {
    if (availableResults.length === 0) {
      return
    }

    setHighlightedIndex((current) => {
      const nextIndex =
        direction === 'next'
          ? Math.min(current + 1, availableResults.length - 1)
          : Math.max(current - 1, 0)

      return nextIndex
    })
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setDropdownOpen(true)
      moveHighlight('next')
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setDropdownOpen(true)
      moveHighlight('previous')
    }

    if (event.key === 'Enter') {
      if (!dropdownOpen || availableResults.length === 0) {
        return
      }

      event.preventDefault()
      const nextSelection = availableResults[highlightedIndex]

      if (nextSelection) {
        handleResultSelect(nextSelection)
      }
    }

    if (event.key === 'Escape') {
      setDropdownOpen(false)
      setHighlightedIndex(0)
    }
  }

  const listId = 'github-user-results'

  return (
    <div className="multi-select panel" ref={containerRef}>
      <div className="selected-users" aria-label="Selected GitHub users">
        {selectedUsers.map((user) => (
          <div key={user.login} className="selected-pill-wrap">
            <button
              type="button"
              className="selected-pill"
              onClick={() => onFocusUser(user.login)}
              aria-label={`View repositories for ${user.login}`}
            >
              {user.login}
            </button>
            <button
              type="button"
              className="selected-pill-remove"
              onClick={() => onRemoveUser(user.login)}
              aria-label={`Remove ${user.login}`}
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        ))}

        <input
          ref={inputRef}
          type="text"
          className="search-input"
          value={inputValue}
          onChange={(event) => {
            setInputValue(event.target.value)
            setDropdownOpen(true)
          }}
          onFocus={() => setDropdownOpen(true)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={dropdownOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            dropdownOpen && availableResults[highlightedIndex]
              ? `github-user-option-${availableResults[highlightedIndex].login}`
              : undefined
          }
          placeholder="Search GitHub users..."
        />
      </div>

      {dropdownOpen && (
        <div className="search-results" id={listId} role="listbox" aria-label="GitHub user results">
          {searchLoading ? (
            <div className="state-message">Searching GitHub...</div>
          ) : searchError ? (
            <div className="state-message error" role="alert">
              <p>{searchError}</p>
              {searchRetryAt !== null ? (
                <p>
                  {searchRetryReady
                    ? 'You can retry now.'
                    : `Try again after ${new Date(searchRetryAt).toLocaleTimeString()}.`}
                </p>
              ) : null}
              <button
                type="button"
                disabled={!searchRetryReady || searchLoading}
                onClick={() => setSearchAttempt((current) => current + 1)}
              >
                Retry search
              </button>
            </div>
          ) : availableResults.length === 0 ? (
            <div className="state-message">
              {inputValue.trim() ? 'No GitHub users found.' : 'Search for a GitHub username'}
            </div>
          ) : (
            availableResults.map((user, index) => (
              <button
                key={user.login}
                id={`github-user-option-${user.login}`}
                type="button"
                className={`result-item ${index === highlightedIndex ? 'is-highlighted' : ''}`}
                onMouseDown={(event) => {
                  event.preventDefault()
                  handleResultSelect(user)
                }}
                role="option"
                aria-selected={index === highlightedIndex}
              >
                <img src={user.avatar_url} alt="" className="avatar" />
                <span>{user.login}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
