# MapaConvivencia — AI Agent Guide

## Stack

- **Vue 3** (`<script setup>` SFCs, Composition API)
- **Tailwind CSS 4** (CSS-first config — `@theme` in `style.css`, `@custom-variant dark`)
- **Vite 8** via `@vitejs/plugin-vue` + `@tailwindcss/vite`
- **No router** — single-page, tab-based views via `ref('map')`
- **No Pinia/Vuex** — reactive store in `src/composables/useStore.js` exported as singleton via `useStore()`
- **localStorage** persistence (key: `mapaconvivencia`), **no backend**
- **i18n**: Spanish (default) + English, in `src/config/i18n.js`
- **PWA**: Service worker in `public/sw.js`, manifest in `public/manifest.json`

## Directory structure

```
src/
  main.js                       — createApp, mount
  style.css                     — Tailwind v4 imports, CSS vars, dark mode, reusable classes
  App.vue                       — shell: tab navigation, help modal, keyboard shortcuts (1-6)
  config/
    i18n.js                     — all ES/EN translations (keyed by camelCase)
    templates.js                — map layout templates (in Spanish: aula_filas, centro_escolar, etc.)
    layerTypes.js               — preset layer definitions, severity, incident/emotion/cyber types
  composables/
    useStore.js                 — singleton reactive state, CRUD, heatmap, import/export
    useInstall.js               — PWA install detection and prompt
    useLayerLabel.js            — resolves a layer id to its display name
    useModal.js                 — generic modal open/close/toggle helper
    icons.js                    — inline SVG icons (no dependencies)
  components/
    AppHeader.vue               — sticky header: language select, dark mode, help button
    HeatMap.vue                 — grid: zones with base color + heat gradient overlay + layer selector pills
    IncidentForm.vue            — modal form: dynamic fields per layer type
    IncidentList.vue            — filtered records table with edit/delete
    ZoneEditor.vue              — grid size + template loader + inline zone editor (x,y,w,h,color)
    LayerPanel.vue              — preset + custom layer toggles (span-based switch), visibility, add/remove
    Dashboard.vue               — severity breakdown, critical zone alerts, semaphore, copy summary, period selector, distributions
    ExportPanel.vue             — JSON import/export, print, test data editor, reset
    RegistroRapido.vue          — global FAB for quick record entry
public/
  favicon.svg, favicon-96x96.png, favicon.ico, apple-touch-icon.png
  icon-192.png, icon-512.png, logoCuadrado.png, logoBanner.png
  manifest.json, sw.js
```

## Critical conventions

| Rule | Why |
|---|---|
| **No Pinia, Vue Router, or TypeScript** | Project intentionally minimal |
| **No backend or server** | All data stays in browser |
| **Singleton store** — `useStore()` same instance everywhere | Don't create new stores |
| **Use CSS vars** (`var(--color-*)`) | Never hardcode colors |
| **Use `t('key')`** for user-facing strings | Keys in camelCase |
| **Call `persist()` after mutating state** | Saves to localStorage |
| **`<script setup>` only** | No Options API |
| **Tailwind utilities + CSS vars** | No scoped styles |
| **Plain JS** | No TypeScript |
| **`config/` holds all LLM-editable data** | i18n, templates, layer types extracted so AI can edit without touching components |
| **Single commit per session + force push** | Keep history clean; squash before push |

## Key files for AI agents

| File | Purpose |
|---|---|
| `src/config/i18n.js` | All translations — add new keys here for both `es` and `en` |
| `src/config/templates.js` | Map templates (`TEMPLATES` object) — add new layouts here, keys in Spanish |
| `src/config/layerTypes.js` | `presetLayerDefs`, `incidentTypes`, `moodOptions`, `positiveOptions`, `severityLabels` |
| `src/composables/useStore.js` | Core state: `state`, `t()`, `layerLabel()`, CRUD methods, heatmap math, import/export, seed |
| `src/composables/icons.js` | All SVG icons as inline strings |
| `src/style.css` | Tailwind v4 config, CSS variables, `.toggle-btn`, `.btn-primary`, `.card-hover` |
| `public/sw.js` | Service worker — update cache list when adding assets |
| `public/manifest.json` | PWA manifest — `theme_color`, icons, name |

## Lessons learned (apply to all projects)

### UI/UX for teachers (non-technical users)
- **FAB (Floating Action Button)** for the most common action (add record) — always accessible, no navigation needed
- **Tab bar with icons + text** at top — no hamburger menus, no hidden navigation
- **Semaphore (red-yellow-green)** for quick status — teachers understand it instantly
- **"Copy summary" button** — let them paste into reports/email, no export needed
- **Test data with one click** — teachers want to explore before committing real data
- **Help wizard** on first visit — step-by-step, with previous/next/dots. Always reopenable
- **Toast notifications** for feedback — no alert() dialogs
- **Large touch targets** (min-h-44px) — for tablets and interactive whiteboards
- **Keyboard shortcuts** (1-6 for tabs, Escape for modals) — power users
- **Dark mode toggle** — for projectors in dark classrooms

### Data architecture (local-first)
- **Singleton reactive store** — one `reactive({})` object, no Pinia/Vuex needed for simple apps
- **localStorage persistence** — call `persist()` after every mutation, store under one key
- **All data in browser** — no accounts, no server, GDPR-compliant by design
- **Import/export as JSON** — full portability, no vendor lock-in
- **Seed data function** — generates realistic records for demo/testing
- **Config extracted to `config/`** — i18n, templates, types all in separate files for easy AI editing
- **Composables for logic** — `useStore.js`, `useInstall.js`, `useLayerLabel.js`, `useModal.js`, `icons.js`

### Component patterns
- **Toggle switch**: use `<div @click>` with `<span :style="{ left: enabled ? '24px' : '2px' }">` — the `peer/after:translate-x` pattern breaks across browsers
- **Modal**: `fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4` with `@click.self="close"`
- **Map/grid**: zones with base color always visible, heat as gradient overlay (`background: linear-gradient(...)`), not replacing the base color
- **Zone heat**: show `count` in the layer's color, with a `+` badge for empty zones
- **Layer selector pills**: small colored circles with the layer color, active one highlighted
- **Dashboard cards**: summary cards (total, most active, trend, last record) + severity breakdown bars + critical zone alerts
- **Period selector**: pill buttons (7/14/30 days) at the top of stats
- **FAB**: `fixed bottom-6 right-6 z-50` — always visible, opens quick-entry form
- **Toast**: teleported to body, auto-dismiss after 3s
- **Install banner**: slide-up animation, shows when PWA install is available

### CSS architecture
- **CSS-first Tailwind config**: `@theme {}` in `style.css`, no `tailwind.config.js`
- **CSS variables for theming**: `--color-bg`, `--color-card`, `--color-border`, `--color-text`, `--color-accent`, etc.
- **Dark mode**: `.dark` class on `<html>`, with `@custom-variant dark (&:where(.dark, .dark *))`
- **No scoped styles** — all styles come from Tailwind utilities + CSS vars
- **Reusable classes**: `.toggle-btn`, `.btn-primary`, `.card-hover`, `.tab-fade-in`, `.icon-svg`
- **Print styles**: `.no-print` to hide UI elements, white background
- **Reduced motion**: `prefers-reduced-motion: reduce` disables all animations

### Color palette (pastel zones, blue accent)
- Zone base colors: `#e0f2fe` (sky), `#fef3c7` (amber), `#dcfce7` (green), `#fce7f3` (pink), `#f3e8ff` (purple), `#ffe4e6` (rose), `#fff3e0` (orange)
- Accent: indigo/blue (`#1e40af` light, `#60a5fa` dark)
- Card: white / dark slate
- Background: `#f8fafc` / `#0f172a`
- Layer colors: red (incidents), green (participation), purple (emotion), blue (presence), amber (noise), emerald (positive), cyan (resources), pink (cyber)

## Layer types

| ID | Type | Color | Behavior |
|---|---|---|---|
| `incidents` | `incidents` | `#ef4444` | Sub-types + severity + students involved |
| `participation` | `numeric` | `#22c55e` | Numeric value 1-5 |
| `emotion` | `emotional` | `#a855f7` | Mood emoji selector |
| `presence` | `numeric` | `#3b82f6` | Numeric value 1-5 |
| `noise` | `numeric` | `#f59e0b` | Numeric value 1-5 |
| `positive` | `positive` | `#10b981` | Positive behavior type + severity |
| `resources` | `numeric` | `#06b6d4` | Numeric value 1-5 |
| `cyber` | `cyber` | `#ec4899` | Platform + type + severity |

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Build to dist/
npm run preview    # Preview production build
```

## GitHub

- Repo: `github.com/sergarb1/MapaConvivencia`
- Deploy: GitHub Pages from `dist/` folder
- GitHub Actions: Node 24 (`actions/setup-node@v4` with `node-version: 24`)

## CSS classes available

| Class | Usage |
|---|---|
| `.toggle-btn` | Option selection pill (severity, sub-type) |
| `.toggle-btn-active` | Selected option (accent color) |
| `.toggle-btn-inactive` | Unselected option |
| `.toggle-btn-positive` | Positive behavior selected |
| `.btn-primary` | Primary action button |
| `.btn-ghost` | Ghost/secondary button |
| `.card-hover` | Hover scale effect for cards |
| `.tab-fade-in` | Tab transition animation |
| `.icon-svg` | SVG icon container |
| `.no-print` | Hide on print |
| `.dark` | Dark mode variant (applied via JS toggle) |
| `.animate-slide-up` | Slide up animation for banners |

## Toggle switch pattern (proven, cross-browser)

```html
<div class="w-12 h-7 rounded-full relative transition-colors duration-200 cursor-pointer"
  :class="enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'"
  @click="toggle">
  <span class="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all duration-200"
    :style="{ left: enabled ? '24px' : '2px' }"></span>
</div>
```

Do NOT use `peer` + `after:translate-x` — it fails on some browser/device combinations.

## Modal pattern

All modals follow:
```html
<div v-if="showX" class="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="showX = false">
  <div class="bg-[var(--color-card)] rounded-2xl p-6 w-full max-w-sm shadow-xl">
    <!-- content -->
  </div>
</div>
```

## Accessibility

- Min touch targets: `min-h-[44px]` on interactive elements
- `min-h-[36px]` on toggle buttons
- `prefers-reduced-motion` respected
- Keyboard: 1-6 for tabs, Escape for modals

## Store API (`useStore()`)

```js
const { state, t, layerLabel, persist, addRecord, updateRecord, removeRecord,
        toggleLayer, toggleLayerVisible, addCustomLayer, removeLayer,
        addZone, updateZone, removeZone, loadTemplate,
        setLang, toggleDark, seedTestData,
        importData, exportData, resetAll, getStats, getHeat, getEmotionHeat,
        getCriticalZones, getSeverityBreakdown, activeLayers, gridCols, gridRows,
        toast, showToast } = useStore()
```

**`state` properties:**
- `projectName`, `template`, `cols`, `rows`, `zones[]`, `layers{}`, `lang`, `dark`

**Layer object shape:**
```js
{ id, enabled, visible, type, color, icon, name?, custom?, data: [
  { id, zoneId, date, type, subtype, severity, description, emotion, platform, involved, value }
] }
```

**Zone object shape:**
```js
{ id, label, x, y, w, h, color }
```