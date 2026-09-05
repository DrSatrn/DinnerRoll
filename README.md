# DinnerRoll

DinnerRoll is a tasteful, local-first household meal scheduling application designed to make family dinner planning effortless and reliable.

It takes a household-maintained collection of meals and generates meal schedules using weighted selection, configurable repetition intervals, leftover tracking, category biases, optional nutritional constraints, and accepted-plan history.

## Core Principles

- Local-first: All data lives strictly in IndexedDB on the user's device. No servers, no accounts, no cloud sync.
- Private: Zero telemetry, zero external trackers, zero committed secrets.
- 100% Free: Built on open static web technologies; deployable to GitHub Pages.
- Offline-capable: Operates as an installable Progressive Web App (PWA) with full service worker precaching.
- Zero Emojis: Visual design relies strictly on custom, handcrafted SVG iconography.

## Primary Workflow

1. Choose Dates: Select the starting calendar date and duration (default 7 days).
2. Select Meal Periods: Pick which meal slots are scheduled (Dinner favoured by default, with Lunch and Breakfast available).
3. Block Unwanted Slots: Directly tap any slot on the unpopulated calendar grid to toggle between active and blocked.
4. Advanced Constraints (Optional): Filter by whole-plan averages or individual-slot targets (Calories, Protein, Fat, Carbs, Category).
5. Roll: Trigger weighted meal selection with animated vertical reel deceleration.
6. Inspect and Reroll: Perform single-slot rerolls or a full-plan reroll while retaining session history to step back to earlier generations.
7. Accept: Persist the chosen plan and update household repeat history atomically.
8. Export and Share: Download standard `.ics` calendar events, export a landscape PDF, share a portrait image, or send groceries to Apple Reminders via the companion Apple Shortcut.

## Technology Stack

- Framework: Svelte 5 (Runes architecture)
- Language: TypeScript (Strict mode)
- Bundler & Dev Server: Vite
- Persistence: IndexedDB via Dexie v4
- PWA Engine: Workbox & `vite-plugin-pwa`
- PDF Generation: `jspdf` (Client-side landscape A4)
- Unit Testing: Vitest
- End-to-End Testing: Playwright

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm 10 or higher

### Local Development

Install dependencies and start the local Vite development server:

```bash
npm install
npm run dev
```

The application will be available at `http://localhost:5173/`.

### Running Tests

Run unit and domain engine tests (Vitest):

```bash
npm run test
```

Run TypeScript and Svelte diagnostics:

```bash
npm run check
```

Run End-to-End browser tests (Playwright):

```bash
npx playwright test
```

### Production Build

Compile and bundle the static application for production:

```bash
npm run build
```

The static output will be placed in the `dist/` directory, ready to be served by any static web server.

## Installing as a PWA on iPhone & iPad

1. Open DinnerRoll in Safari on iOS.
2. Tap the Share button in the Safari toolbar.
3. Scroll down and select "Add to Home Screen".
4. Confirm the application title and tap "Add".
5. DinnerRoll will appear on your Home Screen as an independent standalone app, working offline after first launch.

## Apple Reminders Grocery Integration

DinnerRoll integrates with Apple's native Grocery-type lists in Reminders using Apple Shortcuts as a privacy-safe client-side bridge without private APIs or developer subscriptions.

### Companion Shortcut Setup

1. Open the Shortcuts app on your Apple device.
2. Create a new shortcut titled `DinnerRoll Groceries`.
3. Add the following action chain:
   - Get Shortcut Input (Input Type: Text).
   - Get Dictionary from Shortcut Input.
   - Get Dictionary Value: `items`.
   - Repeat with Each item in `items`:
     - Get Dictionary Value: `display` from Repeat Item.
     - Add New Reminder with title `display` to your `Groceries` list.
4. In DinnerRoll, open an accepted plan, tap "Groceries", and tap "Add to Apple Groceries".

A full setup guide and schema reference are available in the `shortcuts/` folder:
- [Apple Shortcut Guide](shortcuts/README.md)
- [Payload Specification](shortcuts/payload-spec.json)

## Calendar Export (.ics)

DinnerRoll generates RFC 5545 standard `.ics` calendar files entirely client-side. Accepted meals can be exported with one tap and imported into:
- Apple Calendar (macOS, iOS)
- Google Calendar
- Microsoft Outlook
- Any iCalendar-compatible application

The calendar events include meal periods, leftover labels, and nutritional summaries.

## Data Model & Backup

DinnerRoll models:
- Meals: Stable immutable ID, name, portions produced, use-by days, category, meal periods, and optional repeat overrides, macros, and recipe links.
- Recipes: Ingredients with normalized units (`g`, `kg`, `ml`, `L`, `tsp`, `tbsp`, `cup`, `item`).
- Leftovers: Tracked automatically when a meal produces more portions than the household requirement for that period. Never scheduled beyond their configured use-by shelf life.
- Accepted History: Only explicitly accepted plans update last-served dates and repeat window tracking.

### Backup & Restore

Under the Settings view, users can export a full JSON backup of their entire library, recipes, settings, categories, and accepted history. Restoring a backup validates schema versions and payload integrity before applying changes, ensuring corrupt files never compromise local state.

A blank CSV template and column guide are provided in `data/templates/`:
- [CSV Template](data/templates/meals-template.csv)
- [CSV Column Guide](data/templates/meals-column-guide.md)

Sample household datasets are provided in `data/examples/`:
- `data/examples/sample-household.json` (30 meals, recipes, macros, optional flags)
- `data/examples/sample-meals.csv` (CSV format)

## Static Deployment to GitHub Pages

DinnerRoll is configured with relative base paths (`./`) and standard PWA service worker precaching.

### Automated Tag Deployment

When a Git tag matching `v*` is pushed to GitHub, the included release workflow (`.github/workflows/release.yml`) will:
1. Validate types and run unit tests.
2. Build static production assets.
3. Package a zip release archive.
4. Create a GitHub Release.
5. Deploy the static application to GitHub Pages.

### Manual GitHub Pages Configuration

1. In your GitHub repository, navigate to Settings -> Pages.
2. Under "Build and deployment", select "GitHub Actions".
3. Trigger the workflow or push to `main` with a pages workflow.

## Licence

DinnerRoll is released under the [MIT Licence](LICENSE).
