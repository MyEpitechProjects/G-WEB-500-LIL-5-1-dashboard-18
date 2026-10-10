# 🧪 Proof of Concept

Goal: prove that the stack chosen for the Dashboard works end to end, before building the full application.

**One configurable widget that fetches real data from an external API and displays it.**

## ✅ What it proves

| Layer | Technology | Proven by |
| ----- | ----- | ----- |
| Frontend | SvelteKit (Svelte 5) | reactive widget, configuration form, refresh timer (`src/routes/+page.svelte`) |
| Backend | SvelteKit server routes on Node.js | `/api/weather` calls the external API server-side, `/api/config` validates input |
| Database | SQLite (`better-sqlite3`) | the widget configuration survives a restart (`src/lib/server/db.ts`) |
| External API | [Open-Meteo](https://open-meteo.com/) (no key) | real temperature, humidity and wind for any city |

## 🧩 The widget

* **Parameters**: city (string), unit (Celsius / Fahrenheit), refresh rate in seconds (integer, minimum 5).

* **Timer**: the page reloads the data immediately, then every *refresh rate* seconds. Changing the configuration restarts the timer.

* **Persistence**: pressing *Apply* validates the configuration server-side and stores it in SQLite.

## 🏃‍♂️ Run it

Requires Node.js 22.
<https://nodejs.org/>

```bash
npm install
npm run dev          # http://localhost:5173
```

Production build:

```bash
npm run build
npm start            # http://localhost:3000
```

The SQLite file is created in `./data/poc.db` (change it with `DATABASE_PATH`).

## 📁 Structure

```text
src/
├── lib/server/db.ts           # SQLite connection + read/write of the widget config
└── routes/
    ├── +page.server.ts        # loads the saved config
    ├── +page.svelte           # widget, form, timer
    └── api/
        ├── weather/           # Open-Meteo proxy (geocoding + current weather)
        └── config/            # GET / PUT the widget config (validated)
```
