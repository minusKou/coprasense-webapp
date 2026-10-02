import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(here, "data", "coprasense.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
db.exec(fs.readFileSync(path.join(here, "schema.sql"), "utf8"));

// Whitelisted columns per entity (everything else in a request body is ignored).
export const ENTITIES = {
  CopraBatch: {
    table: "copra_batch",
    columns: { batch_id: "text", grade: "number", status: "text", average_moisture: "number", sample_count: "number" },
  },
  CopraSample: {
    table: "copra_sample",
    columns: {
      batch_id: "text", copra_number: "number", moisture: "number",
      color: "text", texture: "text", mold: "bool", image: "text",
    },
  },
};

const SORTABLE = new Set(["id", "created_date", "updated_date"]);

const toRow = (def, row) => {
  if (!row) return row;
  const out = { ...row };
  for (const [col, type] of Object.entries(def.columns)) {
    if (type === "bool") out[col] = !!out[col];
    if (out[col] === null) delete out[col];
  }
  return out;
};

const pick = (def, data) => {
  const out = {};
  for (const [col, type] of Object.entries(def.columns)) {
    if (!(col in data)) continue;
    let v = data[col];
    if (type === "bool") v = v ? 1 : 0;
    else if (type === "number" && v != null) v = Number(v);
    out[col] = v ?? null;
  }
  return out;
};

export function list(name, sort = "-created_date", limit = 100) {
  const def = ENTITIES[name];
  const desc = sort.startsWith("-");
  const field = sort.replace(/^-/, "");
  const col = SORTABLE.has(field) || field in def.columns ? field : "created_date";
  const n = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 10000);
  const rows = db
    .prepare(`SELECT * FROM ${def.table} ORDER BY ${col} ${desc ? "DESC" : "ASC"}, rowid ${desc ? "DESC" : "ASC"} LIMIT ?`)
    .all(n);
  return rows.map((r) => toRow(def, r));
}

export function get(name, id) {
  const def = ENTITIES[name];
  return toRow(def, db.prepare(`SELECT * FROM ${def.table} WHERE id = ?`).get(id));
}

export function create(name, data) {
  const def = ENTITIES[name];
  const vals = pick(def, data);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const cols = ["id", "created_date", "updated_date", ...Object.keys(vals)];
  const params = [id, now, now, ...Object.values(vals)];
  db.prepare(`INSERT INTO ${def.table} (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`).run(...params);
  return get(name, id);
}

export function update(name, id, data) {
  const def = ENTITIES[name];
  const vals = pick(def, data);
  const keys = Object.keys(vals);
  const sets = [...keys.map((k) => `${k} = ?`), "updated_date = ?"];
  const res = db
    .prepare(`UPDATE ${def.table} SET ${sets.join(", ")} WHERE id = ?`)
    .run(...Object.values(vals), new Date().toISOString(), id);
  return res.changes ? get(name, id) : null;
}

export function remove(name, id) {
  const def = ENTITIES[name];
  return db.prepare(`DELETE FROM ${def.table} WHERE id = ?`).run(id).changes > 0;
}

// Equality filter on whitelisted columns; {} deletes everything (matches Base44 deleteMany({})).
export function removeMany(name, filter = {}) {
  const def = ENTITIES[name];
  const vals = pick(def, filter);
  const keys = Object.keys(vals);
  const where = keys.length ? "WHERE " + keys.map((k) => `${k} = ?`).join(" AND ") : "";
  return db.prepare(`DELETE FROM ${def.table} ${where}`).run(...Object.values(vals)).changes;
}
