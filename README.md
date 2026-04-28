# Race Pace Splitter

A race pace planning tool for runners. Enter a distance and goal time, choose a split strategy, and get a full per-segment breakdown of pace and cumulative time.

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
- **Split differential slider** — dial in 1–15% variance between your first and last segment for positive/negative modes
- **Results table** — segment, distance marker, pace, and cumulative time; segments deviating more than 10 seconds from average are highlighted
- **Goal summary bar** — race, goal time, average pace, strategy, projected total, and delta vs goal at a glance

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
│   ├── index.js          # Express server + /api/gpx stub
│   └── package.json
└── client/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx               # Top-level state
        ├── utils/
        │   └── paceCalc.js       # All pace/time calculation logic
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

## Architecture

Single Docker container using a multi-stage build:

1. **Builder stage** — Node 20 Alpine installs client dependencies and runs `vite build`
2. **Runtime stage** — Node 20 Alpine runs Express, serves the compiled static files, and handles SPA routing

All pace calculations run client-side. The server has no calculation logic.

---

## API

| Method | Path | Status | Description |
|---|---|---|---|
| `GET /*` | Any | 200 | Serves the React SPA |
| `POST` | `/api/gpx` | 501 | Stub — reserved for future GPX elevation support |

---

## Roadmap

- [ ] GPX file upload and grade-adjusted pace per segment
- [ ] Export splits as CSV or PDF
- [ ] Save and share plans via URL

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
