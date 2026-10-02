import crypto from "node:crypto";
import { db } from "./db.js";

const DAY = 24 * 60 * 60 * 1000;
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(":");
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

const publicUser = (u) => ({ id: u.id, email: u.email, role: u.role, created_date: u.created_date });

export function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions (token_hash, user_id, created_date, expires_at) VALUES (?,?,?,?)").run(
    sha(token), userId, new Date().toISOString(), new Date(Date.now() + 30 * DAY).toISOString()
  );
  return token;
}

export function userFromToken(token) {
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?`
    )
    .get(sha(token), new Date().toISOString());
  return row ? publicUser(row) : null;
}

export function destroySession(token) {
  if (token) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha(token));
}

export function register(email, password) {
  email = String(email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw httpError(400, "Enter a valid email address");
  if (String(password || "").length < 8) throw httpError(400, "Password must be at least 8 characters");
  if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) throw httpError(409, "An account with this email already exists");
  // First account becomes admin.
  const isFirst = db.prepare("SELECT COUNT(*) AS n FROM users").get().n === 0;
  const id = crypto.randomUUID();
  db.prepare("INSERT INTO users (id, created_date, email, password_hash, role) VALUES (?,?,?,?,?)").run(
    id, new Date().toISOString(), email, hashPassword(password), isFirst ? "admin" : "user"
  );
  return { access_token: createSession(id), user: publicUser(db.prepare("SELECT * FROM users WHERE id = ?").get(id)) };
}

export function login(email, password) {
  email = String(email || "").trim().toLowerCase();
  const u = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!u || !verifyPassword(String(password || ""), u.password_hash)) throw httpError(401, "Invalid email or password");
  return { access_token: createSession(u.id), user: publicUser(u) };
}

// No email service is wired up: the reset link is printed to the server console.
export function requestPasswordReset(email, origin) {
  email = String(email || "").trim().toLowerCase();
  const u = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!u) return;
  const token = crypto.randomBytes(24).toString("hex");
  db.prepare("INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (?,?,?)").run(
    sha(token), u.id, new Date(Date.now() + 60 * 60 * 1000).toISOString()
  );
  console.log(`[password reset] ${email}: ${origin}/reset-password?token=${token}`);
}

export function resetPassword(token, newPassword) {
  if (String(newPassword || "").length < 8) throw httpError(400, "Password must be at least 8 characters");
  const row = db.prepare("SELECT * FROM password_resets WHERE token_hash = ? AND expires_at > ?").get(sha(String(token || "")), new Date().toISOString());
  if (!row) throw httpError(400, "This reset link is invalid or has expired");
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(newPassword), row.user_id);
  db.prepare("DELETE FROM password_resets WHERE user_id = ?").run(row.user_id);
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(row.user_id);
}

export function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}
