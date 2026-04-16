# desa-digital-fe

## Project Snapshot
- Single-package frontend SPA; no sub-folder `AGENTS.md` files are needed at the current repo size.
- Stack: Vite, Vue 3 SFCs, Pinia, Vue Router, Axios, Luxon, Numeral, Chart.js, plain JavaScript.
- Main implementation lives in `src/views/`, `src/stores/`, `src/components/`, and `src/helpers/`.
- Runtime configuration is environment-driven through `VITE_API_BASE_URL`, `VITE_MIDTRANS_SNAP_URL`, and `VITE_MIDTRANS_CLIENT_KEY`.

## Read First
- Architecture and runtime map: [`TECHNICAL_OVERVIEW.md`](TECHNICAL_OVERVIEW.md)
- UI tokens and reusable component patterns: [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)
- Initialization brief used for repo analysis: [`INITIALIZE PROJECT.md`](INITIALIZE%20PROJECT.md)
- Latest long-session continuity notes: [`session-summary-2026-04-08.md`](session-summary-2026-04-08.md)

## Root Setup Commands
- Install deps: `pnpm install`
- Start dev server: `pnpm dev`
- Build production bundle: `pnpm build`
- Run repo lint fixes: `pnpm lint`
- Run Oxlint only: `pnpm lint:oxlint`
- Run ESLint only: `pnpm lint:eslint`
- Format source files: `pnpm format`

## Repository Map
- App bootstrap: `src/main.js`, `src/App.vue`
- Layout shell: `src/layouts/`
- Routing and guards: `src/router/index.js`
- API and state: `src/stores/`, `src/plugins/axios.js`
- Feature pages: `src/views/`
- Reusable UI primitives: `src/components/ui/`
- Shared helpers: `src/helpers/`

## Working Conventions
- Keep diffs minimal and scoped to the agreed files.
- Preserve the existing dashboard visual language; avoid broad redesigns.
- Keep UI-only state in views; keep API fetch/mutation logic in Pinia stores.
- Reuse `FormData` upload patterns already present in `src/stores/profile.js`, `src/stores/development.js`, `src/stores/event.js`, and `src/stores/socialAssistance.js`.
- Prefer existing helpers over inline normalization or formatting.
- Use `@/` imports from `src/` instead of long relative paths.
- Treat API responses as nullable and shape-unstable; guard empty states in views.

## Patterns And File Anchors
- Complex create/edit reference: `src/views/development/DevelopmentEditView.vue`
- Multipart gallery upload reference: `src/views/profile/ProfileCreateView.vue`
- Paginated list + search reference: `src/views/development/DevelopmentsView.vue`
- Shared pagination logic: `src/components/ui/PaginationUI.vue`, `src/helpers/pagination.js`
- Image fallback and URL normalization: `src/helpers/socialAssistance.js`
- Route permissions source of truth: `src/router/index.js`

## Common Gotchas
- `src/helpers/permissionHelper.js` is only a convenience wrapper; route enforcement still happens in `src/router/index.js`.
- No dedicated repo test runner exists in `package.json`.
- No dedicated typecheck script exists in `package.json`.
- `src/views/profile/ProfileView.vue` is still an active integration area and may contain partial static/API mixing.
- Existing lint friction has been noted around `src/components/Topbar.vue`, `src/components/ui/Button.vue`, `src/components/ui/Input.vue`, and `src/views/profile/ProfileView.vue`.

## Quick Find Commands
- Find routes and names: `rg -n "name:|path:" src/router`
- Find store actions: `rg -n "async .*\(" src/stores`
- Find helper exports: `rg -n "export function|export const" src/helpers`
- Find shared UI props: `rg -n "defineProps|defineEmits" src/components/ui`
- Find upload flows: `rg -n "FormData|images\[\]|thumbnail|profile_picture|proof" src`
- Find Midtrans integration: `rg -n "midtrans|snap" src/views/event`

## Definition Of Done
- Match the existing feature pattern and avoid unrelated rewrites.
- Keep imports, routes, store calls, and helper usage consistent with current architecture.
- Handle loading, success, error, and empty states when the flow requires them.
- Run `pnpm lint` for normal code changes.
- Run `pnpm lint && pnpm build` for route, store, form, upload, dashboard, or broader UI changes.
- State explicitly in the handoff that no dedicated test runner or typecheck script exists when that remains true.
- Provide objective completion proof with command results and a scoped diff such as `git diff -- <edited-paths>`.

## Security And Secrets
- Never commit `.env` secrets, tokens, or credentials.
- Do not hardcode API keys or payment keys into views, helpers, or stores.
- Avoid logging raw response bodies or sensitive user data in committed code.
