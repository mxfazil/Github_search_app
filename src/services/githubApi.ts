import type { GitHubRepository, GitHubUser } from '../types/github'

const GITHUB_API_BASE = 'https://api.github.com'

export class GitHubApiError extends Error {
  readonly status: number
  readonly retryAt: number | null

  constructor(
    message: string,
    status: number,
    retryAt: number | null = null,
  ) {
    super(message)
    this.name = 'GitHubApiError'
    this.status = status
    this.retryAt = retryAt
  }
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text()
    let message = body || 'GitHub request failed.'

    try {
      const payload: unknown = JSON.parse(body)
      if (
        typeof payload === 'object' &&
        payload !== null &&
        'message' in payload &&
        typeof payload.message === 'string'
      ) {
        message = payload.message
      }
    } catch {
      // Keep the response body as the error message when it is not JSON.
    }

    const isRateLimited =
      response.status === 429 ||
      response.headers.get('X-RateLimit-Remaining') === '0' ||
      (response.status === 403 && /rate limit/i.test(message))

    if (isRateLimited) {
      const retryAfter = Number(response.headers.get('Retry-After'))
      const resetAt = Number(response.headers.get('X-RateLimit-Reset')) * 1000
      const retryAt =
        Number.isFinite(retryAfter) && retryAfter > 0
          ? Date.now() + retryAfter * 1000
          : Number.isFinite(resetAt) && resetAt > Date.now()
            ? resetAt
            : null

      throw new GitHubApiError(
        'GitHub user search is temporarily rate limited.',
        response.status,
        retryAt,
      )
    }

    throw new GitHubApiError(message, response.status)
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
