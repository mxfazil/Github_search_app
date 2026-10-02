export type GitHubUser = {
  login: string
  id: number
  avatar_url: string
  html_url: string
}

export type GitHubRepository = {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  stargazers_count: number
  forks_count: number
  language: string | null
  owner: {
    login: string
    avatar_url: string
    html_url: string
  }
}
