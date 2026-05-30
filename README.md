# Azimut Transit Feed

Reference customer web app for the [Azimut.ai](https://azimut.ai) Pull API. It demonstrates authenticated vessel transit tracking, including a paginated transit feed, filtering, vessel lookup, transit detail pages, sightings, and vessel imagery.

By default, the app connects to the production API at `https://api.azimut.ai` through the Vite dev proxy. You only need to provide your OAuth client credentials.

## Getting started

Requirements:

- Node.js 20 or newer
- npm
- Azimut API client ID and client secret

```bash
cp .env.example .env
# Fill in VITE_CLIENT_ID and VITE_CLIENT_SECRET in .env
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Environment variables

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | API base URL for the Vite proxy. The example env file sets this to `https://api.azimut.ai`. |
| `VITE_CLIENT_ID` | Azimut OAuth2 client ID. |
| `VITE_CLIENT_SECRET` | Azimut OAuth2 client secret. |

For normal client use, keep `VITE_API_BASE_URL=https://api.azimut.ai`. Change it only when testing against another Azimut API environment.

## How the app talks to the API

Browser requests are sent to local `/v1/...` paths. During development, Vite proxies those requests to `VITE_API_BASE_URL`. This avoids browser CORS issues while keeping the API host configurable.

## Stack

- Vite + React + TypeScript
- React Router
- TanStack Query v5
- shadcn/ui + Tailwind CSS v4
- Vitest + @testing-library/react

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npx vitest run` | Run tests |

## Production build

```bash
npm run build
npm run preview
```

For a deployed static build, serve the generated `dist/` assets behind a reverse proxy that forwards `/v1/...` requests to `https://api.azimut.ai`, or adapt the API client to call the API host directly from your deployment environment.
