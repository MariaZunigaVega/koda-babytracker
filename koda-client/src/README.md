Koda Client — Simple Folder Guide

This app has four main folders:

- `pages/` — full-screen pages the router shows.
- `components/` — reusable pieces that go inside those pages.
- `constants/` — static data like avatars, colors, and labels.
-

---

`pages/` - Koda's Pages/Screens

`pages/Onboarding/` - Pre-dashboard content (sign-up, login, reset password, etc)
These pages do not use the usual app layout (no bottom nav, custom background).

- `welcome.jsx` - first screen, links to sign-up or login.
- `registering.jsx` - sign-up form with a live password checklist.
- `Login.jsx` — sign-in form; saves the first child as the active child.
- `ForgotPassword.jsx` — asks for the user’s email to send a reset link.
- `ResetPassword.jsx` — sets a new password from the reset link.
- `avatarSelection.jsx` - drag-to-spin 3D avatar picker.
- `childRegistration.jsx` — child name/birthday form, shows the picked avatar.

Main app pages
These pages use the shared `Layout` (header, habitat background, bottom nav).

- `ParentDashboard.jsx` - home screen with today’s activities and caregivers.
- `Activities.jsx` — form to log feeding, sleep, diaper, play, or mood.
- `analyticsPage.jsx` — trend charts and insights, with PDF export.
- `HistoryPage.jsx` — activity log with filters and PDF export.
- `AccountSettings.jsx` — account settings (email/password).

`components/` - Reusable Pieces

Root components
- `Layout.jsx` - app shell/constant app layout: header, habitat background, page content, bottom nav.
- `HabitatBackground.jsx` — picks the right 3D background for the active child.
- `AvatarHabitatBackdrop.jsx` — background just for the avatar picker, with smooth crossfade.
- `CollapsibleCard.jsx` — expandable card used in dashboard popups.
- `DarkModeToggle.jsx` — moon/sun button (visual only for now).
- `NavIconButton.jsx` — round icon button for the header and nav bar.

`components/avatar/` - Avatar Rendering related
- `AvatarPortrait3D.jsx` — small framed 3D avatar preview.
- `CharacterModel.jsx` — renders the child’s `.glb` with a gentle bob/sway, hiding silently if it fails to load.

`components/modals/` - Todays Activities + Caregiver dashboard cards/modals structure
- `HabitatModal.jsx` — base panel for dashboard popups.
- `ActivitiesModal.jsx` — popup showing today’s logged activities.
- `CaregiversModal.jsx` — popup for caregivers.

`components/habitats/` - Habitat rendering related
- `BearHabitat3D.jsx`, `BunnyHabitat3D.jsx`, `FoxHabitat3D.jsx`, `FrogHabitat3D.jsx`, `KoalaHabitat3D.jsx`, `PandaHabitat3D.jsx` — 3D scenes/habitats. 
- `habitatRegistry.js` — maps each avatar to its habitat scene.
- `habitatUtils.js` — shared helpers for placing objects and drawing textures.

`constants/` — Static Data

- `avatars.js` — list of the six child avatars (model, habitat, background), plus `getAvatarById`.
- `habitatAssets.js` — maps each habitat class to its background gradient.
- `diaperColors.js` — pie-chart colors for diaper types.
- `pageLabels.js` — maps routes to the header pill text. AKA, the page's and their "labels/titles" that are pill shaped on the header.

---

`utils/` — Helper Functions

- `authStorage.js` — reads the current user id from the JWT and stores the selected child in `localStorage` under a per-user key.
If the JWT is expired or broken, these functions return `null` silently. So if the selected child seems to disappear, the token is the first thing to check.
