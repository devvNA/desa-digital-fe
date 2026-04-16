# Design System

## Foundations

This repository does not expose a separate Tailwind config or token source file in the inspected root. The de facto design system is the checked-in utility stylesheet in `src/index.css`, plus a few component-scoped style blocks in `src/views/LoginView.vue`, `src/components/ui/TimePicker.vue`, and selected card-list components.

## Colors & Typography

### Semantic Color Tokens

| Token / class     | Value found        | Evidence        | Typical use                                             |
| ----------------- | ------------------ | --------------- | ------------------------------------------------------- |
| `desa-background` | `rgb(242 249 246)` | `src/index.css` | App background, muted section fills, borders.           |
| `desa-foreshadow` | `rgb(241 250 230)` | `src/index.css` | Soft cards, icon wells, hover states, skeleton blocks.  |
| `desa-black`      | `rgb(0 27 26)`     | `src/index.css` | Primary dark text, dark buttons, modal headers.         |
| `desa-dark-green` | `rgb(52 97 58)`    | `src/index.css` | Primary action color, focus rings, active states.       |
| `desa-soft-green` | `rgb(142 189 85)`  | `src/index.css` | Secondary accent, badges, gradients, status highlights. |
| `desa-secondary`  | `rgb(90 122 126)`  | `src/index.css` | Secondary text, placeholders, supporting labels.        |
| `desa-blue`       | `rgb(0 92 170)`    | `src/index.css` | Informational metric cards and counters.                |
| `desa-orange`     | `rgb(250 113 57)`  | `src/index.css` | Highlight metrics and urgency accents.                  |
| `desa-red`        | `rgb(255 80 112)`  | `src/index.css` | Errors, destructive buttons, invalid states.            |
| `desa-yellow`     | `rgb(251 173 74)`  | `src/index.css` | Pending/status chips and warning accents.               |

### Raw Color Literals Found In Scoped Styles

| Literal                         | Evidence                                   | Notes                                                         |
| ------------------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| `#89b854`, `#042f2b`            | `src/index.css`, `src/views/LoginView.vue` | Reused in vertical and horizontal green gradients.            |
| `#001B1ACC`, `#080C1ACC`        | `src/index.css`                            | Backdrop colors for overlays/modals.                          |
| `#F2F7FA`, `#FBAD48`, `#FF5070` | `src/index.css`, `src/views/LoginView.vue` | Supporting surface, yellow accent, and error accent literals. |

### Typography Tokens

| Token / pattern     | Value found                                                    | Evidence                                                                       | Notes                                                                |
| ------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| App font family     | `'Lexend Deca'`                                                | `src/index.css`                                                                | Applied to `body`; this is the primary UI font.                      |
| HTML fallback stack | `ui-sans-serif, system-ui, sans-serif, ...`                    | `src/index.css`                                                                | Browser fallback before body font override.                          |
| Common sizes        | `0.75rem`, `0.875rem`, `1rem`, `1.125rem`, `1.25rem`, `1.5rem` | `src/index.css`                                                                | `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`. |
| Custom sizes        | `20px`, `22px`, `24px`, `32px`, `42px`                         | `src/index.css`, `src/views/LoginView.vue`, `src/components/ui/TimePicker.vue` | Used for feature headings and the time-picker display.               |
| Common weights      | `500`, `600`, `700`                                            | `src/index.css`, `src/views/LoginView.vue`                                     | Most labels are medium; headings are semibold/bold.                  |
| Common line heights | `1.25rem`, `1.5rem`, `1.75rem`, `2rem`, `2.5rem`               | `src/index.css`                                                                | Dense dashboard text with larger hero/detail headings.               |

## Component Library

### Shared UI Components

| Component      | File                                 | Props / API                                                                            | Notes                                                                    |
| -------------- | ------------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `Input`        | `src/components/ui/Input.vue`        | `modelValue`, `type`, `placeholder`, `errorMessage`, `maxlength`, `icon`, `filledIcon` | Standard text/password/email field with icon swap and inline error text. |
| `Button`       | `src/components/ui/Button.vue`       | `label`, `type`, `loading`                                                             | Primary filled button; switches label to `Loading...` while disabled.    |
| `PaginationUI` | `src/components/ui/PaginationUI.vue` | `meta`, `serverOptions`, emits `update:server-options`                                 | Shared page navigation built on helper-based window calculation.         |
| `TimePicker`   | `src/components/ui/TimePicker.vue`   | `modelValue`, emits `update:modelValue`, `close`                                       | Custom radial time selector with scoped visual treatment.                |
| `InfoRow`      | `src/components/ui/InfoRow.vue`      | `icon`, `value`, `label`, `valueClass`, `iconBoxClass`                                 | Compact labeled metric row used in detail views.                         |
| `ModalDelete`  | `src/components/ui/ModalDelete.vue`  | `show`, `title`, `loading`, emits `close`, `confirm`                                   | Destructive confirmation modal.                                          |
| `ModalLogout`  | `src/components/ui/ModalLogout.vue`  | `show`, `title`, `loading`, emits `close`, `confirm`                                   | Logout confirmation modal.                                               |

### Shell Components

| Component          | File                                          | Role                                                                                          |
| ------------------ | --------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `Topbar`           | `src/components/Topbar.vue`                   | Fixed top search bar, notification/settings placeholders, user summary, logout modal trigger. |
| `SidebarComponent` | `src/components/sidebar/SidebarComponent.vue` | Fixed left navigation with permission-aware entries and grouped sections.                     |
| `SidebarItem`      | `src/components/sidebar/SidebarItem.vue`      | Recursive menu item with route-active styling and collapsible children.                       |

### Feature Card Components

| Component                   | File                                            | Pattern                                                                        |
| --------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------ |
| Development card list       | `src/components/development/CardList.vue`       | White rounded cards, media thumbnail, 3-metric footer, skeleton loading state. |
| Event card list             | `src/components/event/CardList.vue`             | Mirrors development card layout with event-specific metrics.                   |
| Social assistance card list | `src/components/social-assistance/CardList.vue` | Same card shell plus richer skeleton treatment and status metric.              |
| Head-of-family card list    | `src/components/head-of-family/CardList.vue`    | Horizontal summary row with avatar, identity metadata, and action button.      |

## Spacing & Layout

### Layout Tokens

| Token / pattern         | Value found                           | Evidence                                        | Notes                                                 |
| ----------------------- | ------------------------------------- | ----------------------------------------------- | ----------------------------------------------------- |
| Sidebar width           | `280px`                               | `src/components/sidebar/SidebarComponent.vue`   | Fixed desktop sidebar width.                          |
| Topbar height           | `116px`                               | `src/components/Topbar.vue`                     | Fixed top navigation height.                          |
| Main content padding    | `1.5rem` (`p-6`)                      | `src/layouts/MainLayout.vue`, `src/index.css`   | Default inner page padding.                           |
| Standard card radius    | `1.5rem` (`rounded-3xl`)              | `src/index.css`, many views/components          | Main dashboard card shape.                            |
| Standard control radius | `1rem` (`rounded-2xl`)                | `src/index.css`, many views/components          | Inputs, buttons, icon wells, alerts.                  |
| Small gap scale         | `0.5rem`, `0.75rem`, `1rem`, `1.5rem` | `src/index.css`                                 | Most list, form, and metric spacing uses these steps. |
| Common fixed thumbnail  | `100px x 80px`, `120px x 100px`       | feature `CardList.vue` files, create/edit forms | Standard media preview sizes.                         |

### Grid And Breakpoints

| Pattern                | Evidence                      | Notes                                                                                          |
| ---------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------- |
| Container breakpoints  | `src/index.css`               | Generated `.container` widths at `640px`, `768px`, `1024px`, `1280px`, and `1536px`.           |
| Card metric grids      | feature `CardList.vue` files  | Common `grid-cols-3` metric rows inside cards.                                                 |
| Dashboard metric grids | `src/views/DashboardView.vue` | Uses wider dashboard-specific multi-column layouts and responsive chart blocks.                |
| Login breakpoints      | `src/views/LoginView.vue`     | Custom responsive rules at `1024px` and `768px`; right-side banner collapses on small screens. |

## Patterns & Conventions

| Pattern                      | Evidence                                                                                                                                                 | Description                                                                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Global utility-first styling | `src/index.css`                                                                                                                                          | Styling relies on a checked-in utility sheet rather than per-component utility generation at runtime.                                |
| Semantic class prefix        | `src/index.css`                                                                                                                                          | Custom semantic utilities consistently use the `desa-` prefix for color and state naming.                                            |
| White dashboard cards        | `src/views/development/DevelopmentsView.vue`, `src/components/development/CardList.vue`, `src/components/event/CardList.vue`                             | Most content blocks use `bg-white`, `rounded-3xl`, `p-6`, and soft green borders/shadows.                                            |
| Icon-led inputs              | `src/components/ui/Input.vue`, list search forms in `src/views/*View.vue`                                                                                | Inputs commonly place an icon at the left edge and change icon or ring color on focus/value.                                         |
| Form section split layout    | `src/views/development/DevelopmentEditView.vue`, `src/views/profile/ProfileCreateView.vue`, `src/views/event/EventCreateView.vue`                        | Labels sit in a fixed-width left column; controls occupy a flexible right column.                                                    |
| Search + pagination scaffold | `src/views/head-of-family/HeadOfFamiliesView.vue`, `src/views/social-assistance/SocialAssistancesView.vue`, `src/views/development/DevelopmentsView.vue` | Repeated page pattern: header, alerts, search, per-page select, card/list content, pagination.                                       |
| Motion usage                 | `src/views/LoginView.vue`, `src/components/ui/TimePicker.vue`, `src/components/social-assistance/CardList.vue`                                           | Motion is localized to banner entry, toast transitions, shimmer skeletons, and the time picker.                                      |
| Theming approach             | `src/index.css`, `src/components/ui/TimePicker.vue`                                                                                                      | Global palette comes from semantic utility classes; some complex components define local CSS custom properties inside scoped styles. |

## Notable Absences

- No `tailwind.config.*` file was found in the inspected root.
- No separate token JSON, SCSS variables file, or centralized component documentation site was found.
- No alternate theme files or dark-mode implementation were found.
