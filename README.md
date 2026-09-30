# 🚀 Dashboard

The **Dashboard** project is a web application developed by Epitech, inspired by service aggregators such as Netvibes and iGoogle. It is a **customizable dashboard** that centralizes real-time information by connecting to various third-party APIs.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:

* **[Node.js](https://nodejs.org/)** (v18.0.0 or higher recommended)
* A package manager: **npm** (included with Node.js), **pnpm**, or **yarn**

To check your installed versions:
```bash
node -v
npm -v
```

---

## 📥 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/EpitechPGE3-2026/G-WEB-500-LIL-5-1-dashboard-18.git
   cd G-WEB-500-LIL-5-1-dashboard-18
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   *(Or use `pnpm install` / `yarn install` depending on your setup)*

---

## 🏃‍♂️ Local Development

Start the local development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

By default, the app will be accessible at:
👉 **`http://localhost:8080/`**

To automatically open the app in your default browser on startup:
```bash
npm run dev -- --open
```

---

## 🛠️ Compilation & Production Build

To compile and optimize the application for production:

```bash
npm run build
```

This generates a `dist/` folder (or `.svelte-kit/` / `build/` if using SvelteKit) containing optimized HTML, CSS, and JS assets ready to be deployed.

---

## 🔍 Preview Production Build

To test the production build locally after running `npm run build`:

```bash
npm run preview
```

The app will typically run at `http://localhost:4173`.

---

## 📁 Project Structure Overview

```text
├── public/          # Static assets (favicons, manifest, etc.)
├── src/
│   ├── routes/      # Sveltes routes endpoint/api
│   ├── lib/         # Reusable components, modules, or stores
│   ├── app.html     # HTML entry template
│   └── app.d.ts     # Application entry point
├── index.html       # HTML entry template
├── package.json     # Dependencies, scripts, and metadata
└── vite.config.js   # Vite / Svelte plugin configuration
```