import type { GitHubRepository, GitHubUser } from '../types/github'

const GITHUB_API_BASE = 'https://api.github.com'

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'GitHub request failed.')
  }

  return (await response.json()) as T
}

export async function searchUsers(
  query: string,
  signal?: AbortSignal,
): Promise<GitHubUser[]> {
  const normalizedQuery = query.trim()

  if (!normalizedQuery) {
    return []
  }

  const response = await fetch(
    `${GITHUB_API_BASE}/search/users?q=${encodeURIComponent(normalizedQuery)}&per_page=10`,
    {
      signal,
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  )

  const payload = await parseJsonResponse<{ items?: GitHubUser[] }>(response)

  return Array.isArray(payload.items) ? payload.items : []
}

export async function fetchUserRepositories(
  username: string,
  signal?: AbortSignal,
): Promise<GitHubRepository[]> {
  const response = await fetch(`${GITHUB_API_BASE}/users/${username}/repos`, {
    signal,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  const payload = await parseJsonResponse<GitHubRepository[]>(response)
  return payload
}
