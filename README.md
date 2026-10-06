# 🚀 Dashboard

A customizable dashboard (Epitech project) that gathers information from several services in real time. Each user has an account, subscribes to services, and builds a personal dashboard from configurable widgets.

## ✨ Features

* **Accounts**: registration with email confirmation, login/logout, hashed passwords (scrypt), server-side sessions in an HttpOnly cookie.

* **Services & subscriptions**: a service groups widgets. Some are available by default (weather), others require subscribing from the **Services** page (Steam: requires linking your Steam account first).

* **Dashboard**: add, reconfigure, move (drag by the header, or `Alt` + arrow keys) and delete widget instances. The layout is stored per user in the database. Two instances of the same widget can have different configurations.

* **Timer**: a single timer refreshes every widget at the refresh rate chosen for each instance.

* `GET /about.json`: lists the services and widgets (generated from the widget registry).

## 🧩 Services and widgets

| Service | Widget | Needs a linked account | Main parameters | 
| ----- | ----- | ----- | ----- | 
| `weather` | `city_temperature` | no | city, units, display mode, details to show | 
| `steam` | `trailer_loop` | yes (subscription) | language, tags, excluded tags, sales only, max price | 
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
│   └── about.json/
└── lib/
    ├── core/                  # widget registry, types, timer, services metadata, param validation
    ├── widgets/<service>/     # one folder per service
    ├── components/            # grid, widget frame/host, config dialog
    ├── stores/dashboard.svelte.ts   # client state, synced with the API
    └── server/                # db (Drizzle schema), auth, mail, subscriptions, steam
```

* **Stack**: SvelteKit (Svelte 5), SQLite via Drizzle ORM (`better-sqlite3`), Node adapter, Docker.

* **Adding a widget**: create a `WidgetDefinition` (params, `load`, component) in `src/lib/widgets/<service>/`, then add it to the `registerAllWidgets()` function. It will then appear in the dialog and in `/about.json`.

* **Security**: widget configuration is validated server-side against the widget's declared params. Every `/api/*` route requires a session and (for service routes) an active subscription. All queries are scoped to the logged-in user. Login is rate-limited.
