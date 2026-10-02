import { afterEach, describe, expect, it, vi } from 'vitest'
import { GitHubApiError, searchUsers } from './githubApi'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('searchUsers', () => {
  it('returns users from a successful GitHub response', async () => {
    const users = [{ login: 'mxfazil', id: 1, avatar_url: '', html_url: '' }]
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ items: users }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    await expect(searchUsers('mxfazil')).resolves.toEqual(users)
  })

  it('identifies GitHub search rate limits and their reset time', async () => {
    const resetAt = Math.floor(Date.now() / 1000) + 30
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'API rate limit exceeded' }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(resetAt),
          },
        }),
      ),
    )

    await expect(searchUsers('samee')).rejects.toMatchObject({
      name: 'GitHubApiError',
      status: 403,
      retryAt: resetAt * 1000,
    } satisfies Partial<GitHubApiError>)
  })

  it('returns no results without making a request for a blank query', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(searchUsers('  ')).resolves.toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
