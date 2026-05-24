# Azimut Transit Feed

Reference implementation of a customer web app built on the [Azimut.ai](https://azimut.ai) Pull API. Demonstrates vessel transit tracking: a paginated transit feed with filters and a transit detail view with sightings.

## Getting started

```bash
cp .env.example .env
# Fill in your sandbox credentials in .env
npm install
npm run dev
```

## Environment variables

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Sandbox base URL (e.g. `http://localhost:8080`) |
| `VITE_CLIENT_ID` | OAuth2 client ID |
| `VITE_CLIENT_SECRET` | OAuth2 client secret |

## Stack

- Vite + React 18 + TypeScript
- React Router v6
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
