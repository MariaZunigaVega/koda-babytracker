# Stylesheet Organization Guide

All CSS lives in one folder: `koda-client/src/styling/`

```
koda-client/src/styling/
├── App.css
├── index.css
├── layout.css
├── accountSettings.css
├── activities.css
├── analyticsPage.css
├── historyPage.css
├── parentDashboard.css
├── setUp.css
├── avatarHabitatBackdrop.css
├── chartLegend.css
├── collapsibleCard.css
├── darkModeToggle.css
├── habitatBackground.css
├── habitats.css
├── modals.css
└── navIconButton.css
```

## Folder Categories

- **Global** — used app-wide: fonts, resets, shared classes, app shell.
- **Page-specific** — only used on one page. Delete the page, delete the file.
- **Component** — reusable UI pieces shared across multiple pages, but not global.

Rule of thumb: 3+ pages → global. 1 page → page-specific. Reusable widget → component. Name files to match the page/component they belong to.

## Global files

| File | Purpose |
|---|---|
| `App.css` | Font imports (Baloo 2, Londrina Solid, Nunito), global reset, base `html`/`body` styles, shared card/button classes used across multiple pages. |
| `index.css` | CRA default entry styles — base body font stack and code font. |
| `layout.css` | App shell: fixed header, fixed bottom nav, mobile frame wrapper, header logo/name-pill/bell layout. |

## Page-specific files

| File | Purpose |
|---|---|
| `accountSettings.css` | Account Settings page — collapsible rows, form fields, translucent card variant. |
| `activities.css` | Activities page — logging form, mode selector, schedule day picker. |
| `analyticsPage.css` | Analytics page — profile card, trend grid, insight rows. |
| `historyPage.css` | History page — list items, segmented filter control, quick-stat cards. |
| `parentDashboard.css` | Parent Dashboard — fullscreen container, corner action buttons. |
| `setUp.css` | Setup/onboarding flow — page wrapper, firefly animation, avatar carousel, buttons. |

## Component files

| File | Purpose |
|---|---|
| `avatarHabitatBackdrop.css` | Backdrop behind the avatar on the character-selection screen. |
| `chartLegend.css` | Chart legend (colored dots + labels). |
| `collapsibleCard.css` | Generic collapsible/expandable card. |
| `darkModeToggle.css` | Dark/light mode toggle and its moon-phase icon animation. |
| `habitatBackground.css` | Background scenery for the home page and character-selection screen. |
| `habitats.css` | Shared ground/prop styling used across habitat and dashboard screens. |
| `modals.css` | Sticky modal panels (Today's Activities, Caregivers) and reopen buttons. |
| `navIconButton.css` | Circular nav icon button (e.g. bell icon). |

## Disclaimer on the old `App.css`

There used to be two `App.css` files: `src/App.css` (old) and `src/styling/App.css` (current). The old one was never deleted when styles were reorganized, so it kept getting reintroduced by accident. It has now been removed so all global imports should point to `src/styling/App.css`.

## If you're working from a fork

Pull/sync with `main` before starting new work, especially after a structural change like this. Forks don't auto-update, so a stale fork can make deleted files look like they still exist, and reintroduce old versions when you open a PR.