# CopraSense

Copra batch grading dashboard. React + Vite frontend, with a small Node API backed by **SQLite**.

## Requirements

- Node.js **22.13+** (the server uses the built-in `node:sqlite` module, so there are no native packages to compile)

## Run locally

```bash
npm install
npm run server   # API on http://localhost:3001, DB at server/data/coprasense.db
npm run dev      # frontend on http://localhost:5173 (proxies /api to :3001)
```

Open http://localhost:5173 and create an account. The first account registered becomes the admin.

## Production

```bash
npm run start    # builds the frontend, then serves it and the API from :3001
```

## Configuration (environment variables)

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | API/server port |
| `DB_PATH` | `server/data/coprasense.db` | SQLite file location |
| `APP_ORIGIN` | `http://localhost:5173` | Base URL used in password-reset links |

## Layout

- `server/schema.sql` – tables: `copra_batch`, `copra_sample`, `users`, `sessions`, `password_resets`
- `server/db.js` – entity queries (whitelisted columns, sorting, filters)
- `server/auth.js` – email/password auth (scrypt hashes, server-side sessions)
- `server/index.js` – HTTP API (`/api/entities/:name`, `/api/auth/*`, `/api/events` for live updates)
- `src/api/client.js` – frontend client used throughout the app

## Notes

- There is no email service: password-reset links are printed in the server console.
- Image generation (used by the simulated camera capture in `SampleAcquisition`) was a Base44 feature and is no longer available; samples are captured without an image.
- Back up the app by copying the `.db` file (plus `-wal`/`-shm` if the server is running).
