# desa-digital-fe

## Project Snapshot
- Single-package Vite app using Vue 3, Pinia, Vue Router, and Axios.
- The app is structured as an authenticated dashboard shell plus an auth/login flow.
- Styling is centralized in `src/index.css`; path alias `@` resolves to `src/`.
- Backend API calls go to `http://localhost:8000/api` via the shared Axios instance in `src/plugins/axios.js`.

## Common Commands
- Install dependencies: `pnpm install`
- Start dev server: `pnpm dev`
- Build production bundle: `pnpm build`
- Run all lint fixes: `pnpm lint`
- Run oxlint only: `pnpm lint:oxlint`
- Run ESLint only: `pnpm lint:eslint`
- Format source files: `pnpm format`

## Validation Notes
- There is no test runner configured in `package.json`.
- There is no typecheck script; most source files are plain `.js` / `.vue`, though one layout currently uses `lang="ts"`.
- For changes in this repo, default validation is `pnpm lint` and `pnpm build` unless the task is clearly isolated enough for a narrower check.

## Architecture
### App bootstrap
- `src/main.js` creates the Vue app, installs Pinia and the router, then mounts `App.vue`.
- `src/App.vue` is just the top-level router outlet.

### Routing and auth flow
- `src/router/index.js` defines two route groups:
  - `/login` under `AuthLayout`
  - `/` under `MainLayout`
- Route protection is handled in a global `beforeEach` guard using `useAuthStore()`.
- Authenticated routes rely on `meta.requiresAuth` and optional `meta.permission`.
- Unauthenticated-only pages rely on `meta.requiresUnauth`.

### State and API integration
- `src/stores/auth.js` is the main session store:
  - token is read from cookie via a getter
  - `login()` posts to `/login`, stores the token cookie, and redirects
  - `checkAuth()` calls `/me` to hydrate `user`
  - `logout()` removes the token and redirects to login
- `src/plugins/axios.js` configures the shared Axios instance and injects the bearer token from cookies on each request.
- Error normalization is delegated to `src/helpers/errorHelper.js`.

### Layout model
- `src/layouts/AuthLayout.vue` is a minimal unauthenticated shell that renders only the nested route.
- `src/layouts/MainLayout.vue` is the dashboard shell intended to render sidebar, topbar, and page content.
- Most feature pages are rendered inside the main layout through child routes.

### UI structure
- Reusable primitives live in `src/components/ui/`.
- Navigation UI lives under `src/components/sidebar/`.
- Feature-specific card/list components are split by domain area such as:
  - `components/development`
  - `components/event`
  - `components/head-of-family`
  - `components/social-assistance`
  - `components/social-assistance-recipient`
- Current views are minimal; much of the visible UI is expected to be composed from these components.

## Repo-Specific Observations
- `README.md` is still mostly the default Vite template, so source files are the real reference for architecture.
- `src/helpers/permissionHelper.js` is currently a stub; permission checks are effectively enforced in the router guard instead.
- This working tree may contain in-progress component renames (`Topbar.vue`, `Button.vue`, `Input.vue`) and related imports; read the actual current files before editing nearby code.
