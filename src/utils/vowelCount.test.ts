import { describe, expect, it } from 'vitest'
import type { GitHubUser } from '../types/github'
import { buildLeaderboard, countVowels } from './vowelCount'

describe('countVowels', () => {
  it('returns 0 for strings without vowels', () => {
    expect(countVowels('rhythms')).toBe(0)
  })

  it('counts a single vowel', () => {
    expect(countVowels('tetris')).toBe(2)
  })

  it('counts multiple vowels across a username', () => {
    expect(countVowels('gaearon')).toBe(4)
  })

  it('counts uppercase vowels case-insensitively', () => {
    expect(countVowels('AEIOU')).toBe(5)
  })

  it('counts mixed-case vowels correctly', () => {
    expect(countVowels('MIXedCase')).toBe(4)
  })

  it('counts repeated vowels more than once', () => {
    expect(countVowels('bookkeeper')).toBe(5)
  })

  it('returns 0 for an empty string', () => {
    expect(countVowels('')).toBe(0)
  })

  it('ignores numbers and symbols while counting letters', () => {
    expect(countVowels('user-123!')).toBe(2)
  })
})

describe('buildLeaderboard', () => {
  it('sorts users by descending vowel count and then alphabetically', () => {
    const users: GitHubUser[] = [
      { login: 'torvalds', id: 1, avatar_url: '', html_url: '' },
      { login: 'gaearon', id: 2, avatar_url: '', html_url: '' },
      { login: 'octocat', id: 3, avatar_url: '', html_url: '' },
    ]

    expect(buildLeaderboard(users)).toEqual([
      { login: 'gaearon', vowelCount: 4 },
      { login: 'octocat', vowelCount: 3 },
      { login: 'torvalds', vowelCount: 2 },
    ])
  })
})
