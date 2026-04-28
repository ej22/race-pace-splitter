# Race Pace Splitter — Build Handover

**Date:** 2026-04-28  
**Status:** Complete and running  
**Container:** `race-pace-splitter:latest`  
**Live at:** `http://localhost:1337`

---

## What Was Built

A single-container Docker application for race pace planning. Athletes input a race distance and goal time, choose a split strategy, and get a full per-segment pace/time breakdown.

### Stack
- **Frontend:** React 18 + Vite 5 + Tailwind CSS 3
- **Backend:** Node 20 + Express 4
- **Container:** Multi-stage Docker build (Node 20 Alpine throughout)
- **No component library** — all UI is hand-rolled with Tailwind

---

## Project Structure

```
race-pace-splitter/
├── Dockerfile
├── docker-compose.yml
├── server/
│   ├── index.js          # Express server
│   └── package.json
└── client/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx           # All state lives here
        ├── index.css         # Tailwind directives
        ├── utils/
        │   └── paceCalc.js   # All calculation logic
        └── components/
            ├── RaceSelector.jsx
            ├── GoalTimeInput.jsx
            ├── SplitModeSelector.jsx
            ├── SplitSlider.jsx
            ├── CustomPaceTable.jsx
            ├── SplitResultsTable.jsx
            └── GoalSummary.jsx
```

---

## Docker Setup

**Multi-stage build:**
- Stage 1 (`builder`): installs client deps, runs `vite build`, outputs to `/app/client/dist`
- Stage 2 (runtime): installs only server prod deps, copies `dist` from builder, runs Express

**Port mapping:** host `1337` → container `3000`. The Express server always listens on 3000 internally; only the host-side mapping was changed from the original 3000 spec.

**To bring up:**
```bash
docker compose up          # uses docker-compose.yml
# or directly:
docker run -d -p 1337:3000 race-pace-splitter
```

**To rebuild after changes:**
```bash
docker build -t race-pace-splitter . && docker compose up -d
```

---

## Features Implemented

| Feature | Component | Notes |
|---|---|---|
| Race distance selector | `RaceSelector.jsx` | 4 presets + custom field with km/mi toggle and live unit conversion |
| Goal time input | `GoalTimeInput.jsx` | H/M/S fields; shows avg pace per km and per mile once both inputs are set |
| Split mode tabs | `SplitModeSelector.jsx` | Even / Negative / Positive / Custom |
| Split differential slider | `SplitSlider.jsx` | 1–15%, visible only in Positive/Negative modes; shows projected time + delta vs goal in real time |
| Results table | `SplitResultsTable.jsx` | Seg, distance marker, pace, cumulative time; highlights segments deviating >10s from avg pace in yellow |
| Custom pace table | `CustomPaceTable.jsx` | One editable MM:SS row per segment; validates format; shows cumulative time and total delta |
| Goal summary bar | `GoalSummary.jsx` | Persistent bar across all modes once race + goal time are set |
| GPX API stub | `server/index.js` | `POST /api/gpx` returns 501; marked with TODO for future elevation/grade-adjusted pace support |

---

## Calculation Logic (`paceCalc.js`)

All pure functions, no side effects:

- `generateEvenSplits(distanceKm, goalSeconds, unit)` — identical pace every segment
- `generateProgressiveSplits(distanceKm, goalSeconds, unit, splitPercent, direction)` — linear pace gradient from first to last segment; paces are scaled after generation so the total always equals `goalSeconds` exactly
- `calcCumulativeTime(segments)` — adds `cumulativeSeconds` to each segment
- `formatPace(secondsPerKm)` → `"MM:SS"`
- `formatTime(totalSeconds)` → `"H:MM:SS"`
- `parsePaceInput(mmss)` → seconds or `null` if invalid

Segment objects throughout: `{ segment, distanceMarker, paceSeconds, segmentLengthKm, cumulativeSeconds }`

The last segment of any race is handled correctly for non-integer distances (e.g. a half marathon's final short segment gets the right proportional time, not a full km worth).

---

## Issues Encountered and Fixes

### 1. Port conflict
**Problem:** Original spec used port 3000, which was already occupied on the host machine.  
**Fix:** Changed `docker-compose.yml` host mapping from `3000:3000` to `1337:3000`. The container-internal port stays 3000; only the host-side binding changed. No code changes required.

### 2. No local Node/npm available for pre-build validation
**Problem:** The host machine has no Node or npm installed, so the usual workflow of `npm install && npm run build` locally before writing the Dockerfile was not available.  
**Fix:** The Docker build itself served as the validation step. The multi-stage Dockerfile installs deps and runs `vite build` inside the builder stage, so any compile or import errors surface during `docker build`. The build succeeded cleanly on first attempt.

### 3. PostCSS config module type warning
**Problem:** During the Vite build step inside Docker, Node emitted a warning:  
`Module type of file postcss.config.js is not specified and it doesn't parse as CommonJS. Reparsing as ES module because module syntax was detected.`  
**What it means:** `postcss.config.js` uses `export default` (ESM syntax) but `client/package.json` does not declare `"type": "module"`.  
**Impact:** Warning only — the build completed successfully and the output CSS is correct.  
**Fix (if desired):** Add `"type": "module"` to `client/package.json`. Not done during this session to avoid any unintended side effects on Vite's CJS interop, but it is safe to add.

---

## Verified Endpoints

| Method | Path | Response | Notes |
|---|---|---|---|
| `GET /` | SPA | 200 | Serves `index.html` with bundled React app |
| `GET /*` | SPA catch-all | 200 | Client-side routing support |
| `POST /api/gpx` | Stub | 501 | Ready for GPX elevation feature |

---

## What Is Not Implemented (by design)

- GPX elevation parsing and grade-adjusted pace — stub only, marked TODO in `server/index.js`
- Persistence / saving of plans
- Export (PDF, CSV, etc.)
- Authentication
- Any backend calculation — all pace math runs client-side in the browser

---

## Next Steps / Known Opportunities

- Add `"type": "module"` to `client/package.json` to clear the PostCSS build warning
- Implement `POST /api/gpx` elevation support (the route is already wired)
- Add a `.dockerignore` to exclude `node_modules`, `.git`, etc. from the build context for faster rebuilds
- Consider a `healthcheck` in `docker-compose.yml` for production use
