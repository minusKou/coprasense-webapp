# AGENTS.md

## Project Context

CopraSense: React/Vite frontend plus a Node + SQLite API (`server/`). It was originally a Base44 app; all Base44 code has been removed. Keep changes focused on the user's request and preserve existing conventions.

See `README.md` for setup. Run the API with `npm run server` and the frontend with `npm run dev`.

## Key Files

- `src/api/client.js`: frontend API client (`api.entities`, `api.auth`).
- `server/schema.sql`, `server/db.js`: schema and entity queries. To add an entity, add a table and an entry in `ENTITIES` in `db.js`, and an entry in `api.entities` in `client.js`.
- `server/auth.js`, `server/index.js`: auth and HTTP routes.

## Working Notes

- Requires Node 22.13+ (`node:sqlite`).
- Run the relevant checks from `package.json` before finishing code changes.
