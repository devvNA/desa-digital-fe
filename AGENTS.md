# desa-digital-fe

## Project Snapshot
- Simple single-package frontend app; not a monorepo and no package-level sub-`AGENTS.md` files are needed right now.
- Stack: Vite, Vue 3 SFCs, Pinia, Vue Router, Axios, Luxon, Numeral, plain JavaScript.
- The app is an authenticated dashboard shell plus a login flow. Most feature work lives in `src/views/`, `src/stores/`, and `src/components/`.
- Styling is centralized in `src/index.css`; use `@/` imports from `src/` via `jsconfig.json` and `vite.config.js`.
- API calls go through `src/plugins/axios.js` and target `http://localhost:8000/api`.

## Repository Analysis
- Repository type: simple SPA repository.
- Build system: `pnpm` + Vite. `pnpm-workspace.yaml` exists, but current repo behaves like a single app package.
- Testing setup: no dedicated test runner in `package.json`.
- Validation setup: lint via Oxlint + ESLint; production bundle via Vite build.
- Major implementation areas:
  - Shell and routing: `src/layouts/`, `src/router/`, `src/main.js`
  - Feature views: `src/views/`
  - API/state: `src/stores/`
  - Reusable UI: `src/components/ui/`
  - Shared formatting/mapping helpers: `src/helpers/`

## Root Setup Commands
- Install deps: `pnpm install`
- Start dev server: `pnpm dev`
- Build app: `pnpm build`
- Run all lint fixes: `pnpm lint`
- Run Oxlint only: `pnpm lint:oxlint`
- Run ESLint only: `pnpm lint:eslint`
- Format source files: `pnpm format`

## Universal Conventions
- Keep diffs minimal; edit the fewest files necessary.
- Preserve the current visual language; do not redesign established dashboard patterns.
- Prefer existing view/store/helper patterns over introducing new abstractions.
- Keep UI-only state inside views; keep API calls and mutation flows inside Pinia stores.
- Use `FormData` for upload flows; current examples live in `src/stores/profile.js` and `src/stores/development.js`.
- Reuse helper-based mapping and formatting where possible instead of inline transformation.
- Prefer `@/` imports over long relative paths.
- Follow the project's current casing and naming conventions; most stores are domain-based files in `src/stores/*.js`.

## Security & Secrets
- Never commit tokens, credentials, or `.env`-style secrets.
- Do not hardcode API keys in views or helpers.
- Treat API payloads as untrusted; normalize and guard null/empty states in views.
- Avoid logging sensitive response data to the console in committed code.

## Architecture Map

### App Entry
- Bootstrap: `src/main.js`
- Root outlet: `src/App.vue`
- Layouts: `src/layouts/AuthLayout.vue`, `src/layouts/MainLayout.vue`

### Routing & Auth
- Router config: `src/router/index.js`
- Auth store: `src/stores/auth.js`
- Auth-only and guest-only checks are enforced in the global router guard.

### Shared Infrastructure
- Axios client: `src/plugins/axios.js`
- Error normalization: `src/helpers/errorHelper.js`
- Formatting helpers: `src/helpers/format.js`
- Image helpers and fallbacks: `src/helpers/socialAssistance.js`

### Feature Areas
- Development: `src/views/development/`, `src/components/development/`, `src/stores/development.js`
- Event: `src/views/event/`, `src/components/event/`, `src/stores/event.js`
- Profile: `src/views/profile/`, `src/stores/profile.js`
- Head of family: `src/views/head-of-family/`, `src/stores/headOfFamily.js`
- Social assistance: `src/views/social-assistance/`, `src/stores/socialAssistance.js`
- Social assistance recipient: `src/views/social-assistance-recipient/`, `src/stores/socialAssistanceRecipient.js`

## Patterns & Examples
- DO use `src/views/development/DevelopmentEditView.vue` as the main reference for complex create/edit pages.
- DO use `src/views/profile/ProfileCreateView.vue` as the current reference for multipart upload + preview flows.
- DO keep list/detail/create/edit logic aligned inside the same feature folder, for example `src/views/event/` and `src/views/development/`.
- DO use reusable primitives from `src/components/ui/` when the existing component already matches the need.
- DO reuse image fallbacks through `src/helpers/socialAssistance.js` instead of inventing per-view fallbacks.
- DON'T bypass the shared Axios instance with ad-hoc fetch clients.
- DON'T move auth checks into individual pages when the router meta + guard already covers the route.
- DON'T copy old static placeholder content blindly from incomplete views such as `src/views/profile/ProfileView.vue` without checking the API response first.

## Common Gotchas
- `README.md` is not a reliable architecture source; prefer current source files.
- `src/helpers/permissionHelper.js` is still a stub; real permission enforcement happens in `src/router/index.js`.
- There are in-progress naming/lint issues around `src/components/Topbar.vue`, `src/components/ui/Button.vue`, and `src/components/ui/Input.vue`.
- There is no project test runner and no dedicated typecheck script; validate with lint/build as appropriate.
- Some views are still mid-migration from static mock data to API-driven rendering; read the store and API shape first.

## JIT Index

### Quick Find Commands
- Find routes and route names: `rg -n "name:|path:" src/router`
- Find store actions: `rg -n "async .*\(" src/stores`
- Find shared helpers: `rg -n "export function|export const" src/helpers`
- Find reusable UI inputs/buttons: `rg -n "defineProps|defineEmits" src/components/ui`
- Find a feature view: `rg -n "<script setup>|onMounted|storeToRefs" src/views/<feature>`
- Find upload flows: `rg -n "FormData|images\[\]|thumbnail" src`
- Find router permissions: `rg -n "permission:" src/router/index.js`

### Useful Paths
- Router source of truth: `src/router/index.js`
- Main dashboard shell: `src/layouts/MainLayout.vue`
- Login shell: `src/layouts/AuthLayout.vue`
- Global styles: `src/index.css`
- Standard text input: `src/components/ui/Input.vue`
- Time picker: `src/components/ui/TimePicker.vue`

## Definition of Done
- The updated flow matches the existing feature pattern and does not introduce unrelated rewrites.
- Loading, error, empty, and success states are handled when the feature needs them.
- Imports, routes, and store calls stay consistent with the current architecture.
- Run `pnpm lint` for normal changes; run `pnpm build` as well for broader or riskier UI changes.
