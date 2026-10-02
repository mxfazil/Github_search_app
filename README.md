# GitHub User & Derived State Aggregator — Vowel Count

## Project overview

This application lets a user search GitHub users, select multiple profiles, inspect their repositories, and track a live leaderboard based on the number of vowels in each selected username. The leaderboard is derived directly from the selected users, while repository requests run in parallel and remain independent from the ranking logic.

## Features

- Debounced GitHub user search using the live Search Users API
- Custom multi-select dropdown implemented without an external dropdown component library
- Prevents duplicate selections and supports keyboard navigation
- Real-time vowel-count leaderboard derived from selected usernames
- Parallel repository fetching for each selected user
- Independent loading and error states per selected user
- Outside-click closing and escape-key dismissal for the search dropdown
- Race-condition-safe request handling for stale search responses
- Responsive dashboard layout designed for desktop and mobile screens

## Tech stack

- React
- TypeScript
- Vite
- Native fetch API
- Vitest for utility tests

## Installation

```bash
npm install
```

## Running locally

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Architecture

### Component structure

The project is split into focused components and modules:

- `App.tsx` coordinates the overall dashboard state
- `MultiSelect.tsx` renders the custom dropdown and handles search, keyboard interaction, and outside-click closing
- `Leaderboard.tsx` renders the derived leaderboard
- `RepositoryList.tsx` combines repository data across selected users
- `RepositoryCard.tsx` renders an individual repo card
- `services/githubApi.ts` isolates GitHub API calls
- `hooks/useDebounce.ts` centralizes debouncing logic
- `utils/vowelCount.ts` contains the pure vowel-count utilities
- `types/github.ts` defines GitHub domain types

### State management

State is intentionally divided into:

- UI state: dropdown visibility, keyboard highlight index, typed query
- API state: search results, loading flags, error messages, repository data
- Derived state: the leaderboard from `selectedUsers`

### Data flow

1. The user types into the custom search input.
2. A debounced query triggers the GitHub Search Users API.
3. Results are filtered to avoid duplicates.
4. Selecting a user adds it to `selectedUsers` immediately.
5. The leaderboard recalculates from `selectedUsers` without waiting for repository data.
6. A repository fetch starts in parallel for the newly selected user.
7. The aggregated repository view is built from each user’s repository map.

### API layer

All GitHub HTTP interaction lives inside `src/services/githubApi.ts`. Components call typed service functions and receive consistent data without embedding fetch calls directly in the UI layer.

## Debouncing

The custom `useDebounce` hook delays re-querying the GitHub API until the user pauses typing. This prevents an API request for every keystroke and reduces wasted network traffic. In this app, a 300ms delay is used before invoking the Search Users API.

## Race condition handling

The GitHub search requests use a request counter. Each request checks whether it is still the latest active query before updating the component state. This prevents stale search results from replacing newer results after a rapid series of searches such as `ga` followed by `gae`.

AbortController is also used to cancel the previous pending request when a new debounced search begins, which reduces unnecessary work and prevents out-of-order state updates.

## Repository fetching

Repository fetching is intentionally separate from leaderboard calculation. When a user is selected, the app immediately adds them to `selectedUsers`, updates the leaderboard, and fetches their public repositories asynchronously. A user’s repositories are stored by username so the aggregate list can combine all selected users without mixing data incorrectly.

## Derived leaderboard

The leaderboard is derived state instead of stored redundantly. It is calculated from `selectedUsers` via `buildLeaderboard()` and memoized with `useMemo` so the ranking only recalculates when selected users change.

## Memoization

Memoization is used on the leaderboard calculation in `Leaderboard.tsx`. The ranking depends only on the current array of selected users, so recalculation is skipped unless the selected user set changes. This keeps the UI efficient without memoizing unrelated state.

## Accessibility

The custom multi-select supports keyboard interaction:

- Tab focuses the input normally
- Arrow Up and Arrow Down move the highlighted option
- Enter selects the highlighted result
- Escape closes the dropdown

ARIA attributes such as `aria-expanded`, `aria-controls`, `role="combobox"`, `role="listbox"`, `role="option"`, and `aria-activedescendant` are used as appropriate to support screen readers and keyboard users.

## Tradeoffs

The project deliberately keeps state management straightforward and readable rather than introducing a larger global state library. The custom dropdown is built from scratch to satisfy the project constraints while keeping the implementation understandable for an interview discussion.

## Known limitations

- GitHub's unauthenticated user-search API is limited to 10 requests per minute per IP. The app caches successful queries and lets you retry after a rate limit resets, but shared network usage can still exhaust the quota.
- Repository fetching uses GitHub's public API and can also be affected by its unauthenticated rate limit.
- The app relies on the public GitHub API and therefore does not support private repository data without authentication.
