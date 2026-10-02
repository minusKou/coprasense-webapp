CREATE TABLE IF NOT EXISTS copra_batch (
  id               TEXT PRIMARY KEY,
  created_date     TEXT NOT NULL,
  updated_date     TEXT NOT NULL,
  batch_id         TEXT NOT NULL,
  grade            INTEGER NOT NULL CHECK (grade IN (1, 2, 3)),
  status           TEXT NOT NULL CHECK (status IN ('Passed', 'Flagged', 'Rejected')),
  average_moisture REAL,
  sample_count     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_batch_created ON copra_batch (created_date);
CREATE INDEX IF NOT EXISTS idx_batch_batch_id ON copra_batch (batch_id);

CREATE TABLE IF NOT EXISTS copra_sample (
  id           TEXT PRIMARY KEY,
  created_date TEXT NOT NULL,
  updated_date TEXT NOT NULL,
  batch_id     TEXT NOT NULL,
  copra_number INTEGER NOT NULL,
  moisture     REAL NOT NULL,
  color        TEXT NOT NULL CHECK (color IN ('standard', 'slightly-dark', 'dark')),
  texture      TEXT NOT NULL CHECK (texture IN ('firm', 'soft', 'brittle')),
  mold         INTEGER NOT NULL DEFAULT 0,
  image        TEXT
);
CREATE INDEX IF NOT EXISTS idx_sample_batch ON copra_sample (batch_id);
CREATE INDEX IF NOT EXISTS idx_sample_created ON copra_sample (created_date);

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  created_date  TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash   TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_date TEXT NOT NULL,
  expires_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS password_resets (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);
