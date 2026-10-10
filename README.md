# 🚀 Dashboard

A customizable dashboard (Epitech project) that gathers information from several services in real time. Each user has an account, subscribes to services, and builds a personal dashboard from configurable widgets.

## ✨ Features

* **Accounts**: registration with email confirmation, login/logout, hashed passwords (scrypt), server-side sessions in an HttpOnly cookie.

* **Services & subscriptions**: a service groups widgets. Some are available by default (weather, SNCF), others require subscribing from the **Services** page (Steam: requires linking your Steam account first).

* **Dashboard**: add, reconfigure, move (drag by the header, or `Alt` + arrow keys) and delete widget instances. The layout is stored per user in the database. Two instances of the same widget can have different configurations.

* **Timer**: a single timer refreshes every widget at the refresh rate chosen for each instance.

* **Responsive**: the dashboard is a single column on phones, and the widget configuration dialog becomes a full-width bottom sheet.

* `GET /about.json`: lists the services and widgets (generated from the widget registry).

## 🧩 Services and widgets

| Service | Widget | Needs a linked account | Main parameters | 
| ----- | ----- | ----- | ----- | 
| `weather` | `city_temperature` | no | city, units, display mode, details to show | 
| `steam` | `trailer_loop` | yes (subscription) | language, tags, excluded tags, sales only, max price | 
| `sncf` | `journeys` | no (needs `SNCF_API_KEY` on the server) | departure station, arrival station | 
| `sncf` | `disruptions` | no (needs `SNCF_API_KEY` on the server) | — (refresh rate only) | 
| `steam` | `owned_games_news` | yes | number of news, number of games, news per game, game selection (recent / most played), official announcements only, excerpt length | 

## 🐳 Run with Docker

```bash
cp .env.example .env        # then fill in STEAM_API_KEY (see below)
docker-compose build
docker-compose up
```

* App: <http://localhost:8080> (`/about.json` is public).

* Test mailbox (Mailpit): <http://localhost:8025> — confirmation emails land here.

* The SQLite database is stored in the `db-data` volume.

Create an account, open the confirmation link from Mailpit, then log in.

### 🎮 Steam setup

1. Create a Web API key at <https://steamcommunity.com/dev/apikey> and put it in `.env` as `STEAM_API_KEY`.

2. In **Services**, click *Link my account and subscribe* on Steam: you are redirected to Steam to sign in, then brought back and automatically subscribed.

3. For the `owned_games_news` widget to see your library, your Steam profile's **Game details** must be public.

> Steam does not implement OAuth 2.0: accounts are linked with **OpenID 2.0** (the user proves their SteamID64). Game data is then fetched server-side using the API key.

## 🏃‍♂️ Local Development

Requires Node.js 22.
<https://nodejs.org/>

```bash
cp .env.example .env
npm install
npm run dev          # https://localhost:8080 (self-signed certificate)
```

Without `SMTP_HOST`, confirmation links are printed directly in the server console.

Useful scripts: `npm run check` (type checking), `npm run build`, `npm run db:generate` (generate a migration after editing `src/lib/server/db/schema.ts`). Migrations in `drizzle/` are applied automatically at startup.

## ⚙️ Configuration

| Variable | Purpose | Default | 
| ----- | ----- | ----- | 
| `ORIGIN` | Public URL of the app (**required behind plain HTTP**, otherwise form submissions are rejected) | `http://localhost:8080` in compose | 
| `STEAM_API_KEY` | Steam Web API key | — | 
| `SNCF_API_KEY` | SNCF API key, required by the SNCF widgets | — | 
| `DATABASE_PATH` | SQLite database file | `./data/dashboard.db` (`/data/dashboard.db` in Docker) | 
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` | Outgoing mail | links logged in the console if no `SMTP_HOST` | 

## 📁 Project Structure Overview

```text
src/
├── hooks.server.ts            # session → locals.user, protects /api/*
├── routes/
│   ├── (auth)/                # login, register, confirm
│   ├── (app)/                 # dashboard (/) and Services page — requires a session
│   ├── auth/steam/            # Steam OpenID link flow (start + callback)
│   ├── api/dashboard/         # widget instances CRUD + ordering
│   ├── api/steam/             # Steam endpoints used by the widgets
│   ├── api/sncf/              # SNCF endpoints used by the widgets (API key stays server-side)
│   └── about.json/
└── lib/
    ├── core/                  # widget registry, types, timer, services metadata, param validation
    ├── widgets/<service>/     # one folder per service
    ├── components/            # grid, widget frame/host, config dialog
    ├── stores/dashboard.svelte.ts   # client state, synced with the API
    └── server/                # db (Drizzle schema), auth, mail, subscriptions, steam
```

* **Stack**: SvelteKit (Svelte 5), SQLite via Drizzle ORM (`better-sqlite3`), Node adapter, Docker. See [Technology choices](#-technology-choices) for the reasons.

* **Adding a widget**: create a `WidgetDefinition` (params, `load`, component) in `src/lib/widgets/<service>/`, then add it to the `registerAllWidgets()` function. It will then appear in the dialog and in `/about.json`.

* **Security**: widget configuration is validated server-side against the widget's declared params. Every `/api/*` route requires a session and (for service routes) an active subscription. All queries are scoped to the logged-in user. Login is rate-limited.

## 🧠 Technology choices

Each layer was compared on the same criteria. Ratings are relative to this project: a small team, a few weeks, a real-time dashboard with widgets that call external APIs.

### 🖥️ Frontend

| Criterion | **SvelteKit (Svelte 5)** ✅ | React + Next.js | Vue 3 + Nuxt | 
| ----- | ----- | ----- | ----- | 
| Reactivity model | compiler-based runes, no virtual DOM, little boilerplate | virtual DOM, hooks and dependency arrays | proxy-based refs, close to Svelte | 
| Learning curve | low: plain HTML / CSS / JS in one file | medium: JSX, hooks rules, many patterns | low to medium | 
| Bundle size / performance | very small, fast updates | larger runtime | medium | 
| Full-stack in one project | yes: pages, API routes, server hooks | yes (App Router), more concepts | yes | 
| Ecosystem and libraries | smaller | largest | large | 
| Scoped CSS out of the box | yes | no (needs CSS modules or a library) | yes | 

### ⚙️ Backend

| Criterion | **Node.js (SvelteKit server routes)** ✅ | Python (FastAPI) | PHP (Laravel) | 
| ----- | ----- | ----- | ----- | 
| Language shared with the frontend | yes: TypeScript everywhere, shared types (`WidgetDefinition`, params) | no | no | 
| Handling many concurrent API calls | good: async I/O | good: async I/O | medium: one process per request | 
| Built-in auth / mail / ORM | none: assembled by hand (scrypt, Nodemailer, Drizzle) | none: assembled by hand | rich: auth, mail and ORM included | 
| Separate service to deploy | no: same process as the UI | yes | yes | 
| Setup and Docker image | one Node image | Python image + ASGI server | PHP-FPM + web server | 
| Fit for `/about.json` generated from the widget registry | direct: the registry is the same code the UI uses | needs a duplicated registry | needs a duplicated registry | 

### 🗄️ Database

| Criterion | **SQLite** ✅ | PostgreSQL | MongoDB | 
| ----- | ----- | ----- | ----- | 
| Setup | none: a single file | a server to run and configure | a server to run and configure | 
| Extra Docker service | none | yes | yes | 
| Data model fit | relational: users, sessions, subscriptions, linked accounts, widget instances | relational | documents: widget params are flexible JSON | 
| Integrity (foreign keys, unique constraints) | yes | yes | application-side | 
| Concurrent writes / scaling | one writer: enough for this load | excellent | excellent | 
| Migrations and typing | Drizzle ORM, versioned SQL in `drizzle/` | Drizzle ORM | Mongoose / manual | 

### 🎯 Why these choices

* **SvelteKit**: it gives the UI, the API routes and the server hooks in one project, so there is a single build and a single container. Svelte 5 runes keep widget components short, which matters when each service adds several widgets. React and Vue would work as well; Svelte was preferred for less boilerplate and smaller bundles.

* **Node.js**: the widget registry (`WidgetDefinition`, params, services) is written once in TypeScript and used by the dashboard UI, the configuration dialog, server-side validation and `/about.json`. A Python or PHP backend would force us to describe every widget twice. The price is that authentication, email and sessions are written by hand instead of coming from a framework; they are small (scrypt hashes, hashed session tokens, Nodemailer) and covered by rate limiting.

* **SQLite**: the data is small and relational, and the app is a single instance. SQLite removes a service from `docker-compose` and makes `docker-compose up` simple and reliable. The limit is a single writer: if the application had to run on several servers, PostgreSQL would be the next step. Drizzle keeps that migration cheap since only the driver and the schema dialect change.

* **Docker**: a multi-stage build keeps the final image small, runs as a non-root user, and the database lives in a volume.

## 🧪 Proof of concept

The [`poc/`](./poc) folder contains the proof of concept built before the full application: one configurable widget (city, unit, refresh rate) that fetches real weather data from the Open-Meteo API through a SvelteKit server route, refreshes on a timer, and stores its configuration in SQLite. See [`poc/README.md`](./poc/README.md) to run it.

## ⚠️ Known limitations

* Steam accounts are linked with OpenID 2.0, not OAuth 2.0 (Steam does not provide OAuth 2.0).

* SNCF widgets show an error until `SNCF_API_KEY` is set.