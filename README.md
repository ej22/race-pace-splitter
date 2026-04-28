# Race Pace Splitter

A race pace planning tool for runners. Enter a distance and goal time, choose a split strategy, and get a full per-segment breakdown of pace and cumulative time. Upload a GPX file for elevation-aware grade-adjusted pacing, then export your plan as CSV or PDF.

![Stack](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react) ![Stack](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite) ![Stack](https://img.shields.io/badge/Express-4-000000?style=flat&logo=express) ![Stack](https://img.shields.io/badge/Docker-ready-2496ED?style=flat&logo=docker)

---

## Features

- **Race presets** — 5K, 10K, Half Marathon, Marathon, or a custom distance in km or miles
- **Goal time input** — hours/minutes/seconds with live average pace display (per km and per mile)
- **Four split strategies:**
  - **Even** — identical pace every segment
  - **Negative** — progressively faster (classic race strategy)
  - **Positive** — progressively slower
  - **Custom** — enter a manual pace per segment in MM:SS format
- **Split differential slider** — dial in 1–15% variance between first and last segment for positive/negative modes
- **Results table** — segment, distance marker, pace, and cumulative time; segments deviating more than 10s from average are highlighted
- **Goal summary bar** — race, goal time, average pace, strategy, projected total, and delta vs goal at a glance
- **GPX upload** — drag-and-drop a .gpx file from Strava, Garmin, Coros or any device; the server parses elevation and returns per-segment gradient data
- **Grade-adjusted pace** — per-segment effort multiplier based on gradient; uphill segments get a cost, downhill a benefit; all paces are normalised so the total still equals your goal time exactly
- **Elevation chart** — area chart of the elevation profile with segment boundaries
- **Export CSV** — full splits table with elevation columns as a downloadable .csv
- **Export PDF** — A4 print-ready PDF with header summary, elevation chart, and formatted splits table

---

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose

### Run with Docker Compose

```bash
git clone <your-repo-url>
cd race-pace-splitter
docker compose up
```

App will be available at **http://localhost:1337**

### Build and run manually

```bash
docker build -t race-pace-splitter .
docker run -d -p 1337:3000 race-pace-splitter
```

### Rebuild after changes

```bash
docker build -t race-pace-splitter . && docker compose up -d
```

---

## Project Structure

```
race-pace-splitter/
├── Dockerfile
├── docker-compose.yml
├── server/
│   ├── index.js          # Express server + /api/gpx endpoint
│   └── package.json      # express, multer, fast-xml-parser
└── client/
    ├── index.html
    ├── package.json      # react, recharts, jspdf, jspdf-autotable
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx               # Top-level state and layout
        ├── utils/
        │   ├── paceCalc.js       # Pace/time calculation logic
        │   ├── gradeAdjust.js    # Grade-adjusted pace with normalisation
        │   ├── exportCsv.js      # CSV download utility
        │   └── exportPdf.js      # PDF generation with jsPDF
        └── components/
            ├── RaceSelector.jsx
            ├── GoalTimeInput.jsx
            ├── SplitModeSelector.jsx
            ├── SplitSlider.jsx
            ├── CustomPaceTable.jsx
            ├── SplitResultsTable.jsx
            ├── GoalSummary.jsx
            ├── GpxUpload.jsx     # Drag-and-drop GPX upload
            ├── ElevationChart.jsx # Recharts elevation area chart
            └── ExportButtons.jsx  # CSV and PDF export buttons
```

---

## Architecture

Single Docker container using a multi-stage build:

1. **Builder stage** — Node 20 Alpine installs client dependencies and runs `vite build`
2. **Runtime stage** — Node 20 Alpine runs Express, serves the compiled static files, and handles SPA routing

All pace calculations run client-side. The server only handles GPX file parsing.

---

## API

| Method | Path | Description |
|---|---|---|
| `GET /*` | Any | Serves the React SPA |
| `POST /api/gpx` | `?unit=km\|mile` | Parses a multipart .gpx upload; returns per-segment elevation and gradient data |

### GPX endpoint

Accepts a multipart form with field name `gpxFile` (max 10 MB). Optional `unit` query parameter (`km` or `mile`) controls segment size.

**Response:**
```json
{
  "success": true,
  "summary": { "totalDistanceKm": 42.2, "totalAscent": 380, "totalDescent": 375, "pointCount": 4821 },
  "segments": [
    { "segment": 1, "startElevation": 42, "endElevation": 68, "elevationGain": 28, "elevationLoss": 2, "netChange": 26, "gradientPercent": 2.6 }
  ]
}
```

Error response: `{ "success": false, "error": "message" }`

---

## Grade Adjustment Formula

| Condition | Multiplier |
|---|---|
| Uphill (gradient ≥ 0%) | `1 + 0.033 × gradient` |
| Mild downhill (0% to −10%) | `1 − 0.018 × \|gradient\|` |
| Steep downhill (< −10%) | `0.82 + 0.02 × (\|gradient\| − 10)` |

After applying multipliers, all paces are scaled so the sum of segment times equals the goal time exactly.

---

## Local Development (without Docker)

Requires Node 20+.

```bash
# Terminal 1 — backend
cd server && npm install && node index.js

# Terminal 2 — frontend (proxies /api to localhost:3000)
cd client && npm install && npm run dev
```

Frontend dev server runs on **http://localhost:5173** with HMR.
