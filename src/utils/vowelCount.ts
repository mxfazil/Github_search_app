import type { GitHubUser } from '../types/github'

export function countVowels(value: string): number {
  return [...value.toLowerCase()].filter((char) => /[aeiou]/.test(char)).length
}

export function buildLeaderboard(selectedUsers: GitHubUser[]) {
  return [...selectedUsers]
    .map((user) => ({
      login: user.login,
      vowelCount: countVowels(user.login),
    }))
    .sort((a, b) => b.vowelCount - a.vowelCount || a.login.localeCompare(b.login))
}
