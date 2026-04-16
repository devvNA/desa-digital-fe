# Technical Overview

## Codebase Scope

- Repository type: single-package Vue SPA.
- Build stack: Vite 8, Vue 3 SFCs, Pinia 3, Vue Router 5, Axios 1.
- Utility libraries in active use: Luxon, Numeral, Chart.js, js-cookie, `@vuepic/vue-datepicker`.
- Source layout centers on `src/views/`, `src/stores/`, `src/components/`, `src/helpers/`, `src/router/`, and `src/layouts/`.
- Module resolution uses the `@/` alias from `src/` via `jsconfig.json` and `vite.config.js`.

## Core Components

### App Bootstrap

| Area          | Files                                                      | Responsibility                                                                                                   |
| ------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| App entry     | `src/main.js`, `src/App.vue`                               | Creates the Vue app, installs Pinia and Vue Router, mounts the root router outlet.                               |
| Layout shell  | `src/layouts/MainLayout.vue`, `src/layouts/AuthLayout.vue` | Splits authenticated pages from the login flow.                                                                  |
| Global styles | `src/index.css`                                            | Provides the checked-in utility stylesheet, semantic color classes, global body styling, and shared transitions. |

### Routing And Auth

| Area              | Files                             | Responsibility                                                                                  |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------- |
| Route table       | `src/router/index.js`             | Declares all feature routes, lazy-loads page components, attaches auth and permission metadata. |
| Auth state        | `src/stores/auth.js`              | Stores token/user state, performs login/logout/check-auth, manages auth loading and feedback.   |
| Permission helper | `src/helpers/permissionHelper.js` | Simple permission lookup against `authStore.user?.permissions`.                                 |

### Shared Infrastructure

| Area                | Files                                                                                        | Responsibility                                                                                               |
| ------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| HTTP client         | `src/plugins/axios.js`                                                                       | Sets global Axios defaults, injects Bearer token from cookies, exports shared `axiosInstance`.               |
| Error normalization | `src/helpers/errorHelper.js`                                                                 | Maps API failures into strings or field-error objects; falls back to browser alerts for unhandled cases.     |
| Formatting          | `src/helpers/format.js`                                                                      | Currency, date, datetime, WIB time, timezone conversion, percentage, and string capitalization helpers.      |
| Domain helpers      | `src/helpers/development.js`, `src/helpers/socialAssistance.js`, `src/helpers/pagination.js` | Date arithmetic, amount normalization, image URL normalization, status mapping, and pagination-window logic. |

### Feature Modules

| Feature                     | Primary files                                                                                                      | Notes                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Dashboard                   | `src/views/DashboardView.vue`, `src/stores/dashboard.js`                                                           | Renders summary cards, resident chart, and role-based dashboard data.                                |
| Head of family              | `src/views/head-of-family/*`, `src/stores/headOfFamily.js`                                                         | List/detail/create flows for head-of-family records.                                                 |
| Family member               | `src/views/family-member/*`, `src/stores/familyMember.js`                                                          | Detail and create flows with multipart profile-picture upload.                                       |
| Social assistance           | `src/views/social-assistance/*`, `src/components/social-assistance/CardList.vue`, `src/stores/socialAssistance.js` | Paginated list, detail, create, edit, delete, and availability state.                                |
| Social assistance recipient | `src/views/social-assistance-recipient/*`, `src/stores/socialAssistanceRecipient.js`                               | Paginated list and CRUD-style flows with normalized recipient payloads.                              |
| Development                 | `src/views/development/*`, `src/components/development/CardList.vue`, `src/stores/development.js`                  | Paginated listing, detail, create, edit, delete, upload, and date/amount normalization.              |
| Event                       | `src/views/event/*`, `src/components/event/CardList.vue`, `src/stores/event.js`, `src/stores/eventParticipant.js`  | Paginated listing, detail, create, edit, delete, participant creation, and Midtrans payment handoff. |
| Profile                     | `src/views/profile/*`, `src/stores/profile.js`                                                                     | Village profile create/view/edit flow with thumbnail and gallery uploads.                            |

## Design And Implementation Patterns

- Vue code uses `<script setup>` Composition API in views and components.
- Pinia stores use the object-style `defineStore()` pattern with `state` and `actions`.
- Routing uses route-level code splitting through dynamic `import()` calls in `src/router/index.js`.
- Data access follows a view -> store -> `axiosInstance` path; views own UI state, stores own API state and mutation calls.
- Multipart create/update flows consistently assemble `FormData` in stores such as `src/stores/development.js`, `src/stores/event.js`, `src/stores/profile.js`, `src/stores/socialAssistance.js`, and `src/stores/familyMember.js`.
- List pages commonly pair a paginated store method with `PaginationUI.vue`, local `serverOptions`, debounced search watchers, success/error banners, and a feature-specific `CardList.vue`.

## Component Interactions

### Initialization Flow

1. `src/main.js` creates the app, installs Pinia, installs the router, and mounts `App.vue`.
2. `App.vue` renders a single `RouterView`.
3. `src/router/index.js` resolves the target route and runs the global `beforeEach` guard.
4. Protected routes require a token from `src/stores/auth.js`; if `authStore.user` is missing, the guard calls `checkAuth()` before allowing navigation.
5. The matched layout (`MainLayout.vue` or `AuthLayout.vue`) wraps the target view.

### Auth And Permission Flow

1. `src/views/LoginView.vue` validates local form input.
2. `src/stores/auth.js` posts credentials to `/login`, stores the returned token in cookies, and exposes loading/error/success state.
3. `src/plugins/axios.js` reads the cookie token and injects `Authorization: Bearer <token>` on requests.
4. The router guard blocks missing permissions by comparing `to.meta.permission` against `authStore.user?.permissions`.
5. `SidebarComponent.vue`, `SidebarItem.vue`, and several views call `can()` to hide unauthorized links and actions.

### Standard Data Flow

1. A view initializes local UI state and calls a store action from `onMounted()` or a watcher.
2. The store sets `loading`, clears previous feedback, and calls `axiosInstance`.
3. API payloads are stored in domain state such as `developments`, `events`, `socialAssistances`, `profile`, or `meta`.
4. The view reads store state via `storeToRefs()` and renders loading, success, error, empty, or loaded states.
5. Shared helpers normalize API output before display, for example currency/date formatters and image URL fallback helpers.

### Upload And Mutation Flow

1. Views collect files with hidden `<input type="file">` elements and preview them with `URL.createObjectURL()`.
2. Stores serialize payloads into `FormData` and append file fields like `thumbnail`, `profile_picture`, `proof`, or `images[]`.
3. Update operations generally emulate PUT through `_method=PUT` on a `POST` request.
4. Views redirect after successful mutations, usually through `router.replace()` or store-level `router.push()` in older modules.

### Pagination And Search Flow

1. List views keep `serverOptions` and filter state in local refs.
2. Search inputs are debounced with `setTimeout` watchers.
3. Views call paginated store actions such as `fetchDevelopmentsPaginated()` or `fetchSocialAssistancesPaginated()`.
4. `PaginationUI.vue` computes a visible page window using helpers from `src/helpers/pagination.js` and emits the next page back to the parent view.

### Dashboard And Payment Integrations

- `src/views/DashboardView.vue` uses `Chart.js` to render a resident distribution doughnut chart and destroys/recreates the chart on reactive updates.
- `src/views/event/EventDetailView.vue` loads Midtrans Snap dynamically from `VITE_MIDTRANS_SNAP_URL`, requests a payment token through `createEventParticipant()`, and hands control to `window.snap.pay()` callbacks.

## Deployment Architecture

| Area                  | Evidence                                                                                         | Details                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Package manager       | `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`                                          | Uses `pnpm`; workspace file exists but the repo behaves as a single app package.               |
| Dev server            | `package.json`                                                                                   | `pnpm dev` runs Vite.                                                                          |
| Production build      | `package.json`                                                                                   | `pnpm build` runs `vite build --mode production`.                                              |
| Linting               | `package.json`, `eslint.config.js`, `.oxlintrc.json`                                             | `pnpm lint` runs Oxlint and ESLint autofix commands.                                           |
| Formatting            | `package.json`, `.oxfmtrc.json`                                                                  | `pnpm format` runs `oxfmt` over `src/`.                                                        |
| Environment config    | `.env.example`, `.env.production`, `src/plugins/axios.js`, `src/views/event/EventDetailView.vue` | Runtime expects `VITE_API_BASE_URL`, `VITE_MIDTRANS_SNAP_URL`, and `VITE_MIDTRANS_CLIENT_KEY`. |
| Container/infra files | repository root                                                                                  | No Docker, Compose, Kubernetes, or CI deployment manifests are present in the inspected files. |

## Runtime Behavior

### Request Handling

- Axios uses a shared base URL from `import.meta.env.VITE_API_BASE_URL`.
- Requests default to `X-Requested-With: XMLHttpRequest`, `Accept: application/json`, and a global multipart content type.
- Stores generally expose `loading`, `error`, and `success` flags and return either normalized data, `null`, `false`, or `true` to the caller.

### Error Management

- Validation failures (`422`) are returned as field-error objects by `handleError()`.
- Several stores surface string messages for `400`, `401`, and `500` responses.
- Unhandled network conditions fall back to browser `alert()` inside `src/helpers/errorHelper.js`.
- The router guard catches `checkAuth()` failures, logs the error, and redirects to `login`.

### Background Or Deferred Tasks

- No persistent background workers, service workers, queues, or cron-style tasks are present.
- Deferred work happens through UI timers and reactive hooks: debounced searches, chart rendering, Midtrans script injection, and object URL cleanup on component unmount.

## Current Delivery State From Session Context

The following items come from `session-summary-2026-04-08.md` and align with the inspected codebase state:

- `development` flows were recently refactored around `src/views/development/DevelopmentEditView.vue` and `src/helpers/development.js`, including UTC-safe date handling and improved list empty-state behavior.
- `event` create/edit/detail flows were recently aligned to the same create/edit pattern, and `src/components/ui/TimePicker.vue` carries a custom restyle.
- `profile` create flow is implemented in `src/views/profile/ProfileCreateView.vue`, and `src/stores/profile.js` already uses `FormData` for thumbnail and gallery uploads.
- `src/views/profile/ProfileView.vue` still mixes API data with static fallback content and remains the active integration area called out in the session summary.
- Known lint issues were previously identified in `src/components/Topbar.vue`, `src/components/ui/Button.vue`, `src/components/ui/Input.vue`, and `src/views/profile/ProfileView.vue`.
