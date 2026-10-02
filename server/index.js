import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as store from "./db.js";
import * as auth from "./auth.js";
import * as serial from "./serial.js";
import * as camera from "./camera.js";
import { classifyPNS, GRADE_TABLE } from "./grading.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, "..", "dist");
const PORT = Number(process.env.PORT) || 3001;

const clients = new Set(); // SSE subscribers
const broadcast = (entity) => {
  for (const res of clients) res.write(`data: ${JSON.stringify({ entity })}\n\n`);
};

const send = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(body === undefined ? "" : JSON.stringify(body));
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > 15 * 1024 * 1024) { reject(auth.httpError(413, "Payload too large")); req.destroy(); }
      else chunks.push(c);
    });
    req.on("end", () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch { reject(auth.httpError(400, "Invalid JSON")); }
    });
    req.on("error", reject);
  });

const bearer = (req, url) => {
  const h = req.headers.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7) : url.searchParams.get("token");
};

async function handleApi(req, res, url) {
  const parts = url.pathname.split("/").filter(Boolean).slice(1); // drop "api"
  const method = req.method;
  const token = bearer(req, url);

  // ---- auth ----
  if (parts[0] === "auth") {
    const body = method === "POST" ? await readBody(req) : {};
    const origin = process.env.APP_ORIGIN || `http://localhost:${process.env.VITE_PORT || 5173}`;
    switch (`${method} ${parts[1]}`) {
      case "POST register": return send(res, 201, auth.register(body.email, body.password));
      case "POST login": return send(res, 200, auth.login(body.email, body.password));
      case "POST logout": auth.destroySession(token); return send(res, 204);
      case "POST reset-request": auth.requestPasswordReset(body.email, origin); return send(res, 204);
      case "POST reset": auth.resetPassword(body.token, body.newPassword); return send(res, 204);
      case "GET me": {
        const user = auth.userFromToken(token);
        return user ? send(res, 200, user) : send(res, 401, { error: "Authentication required" });
      }
    }
    return send(res, 404, { error: "Not found" });
  }

  // ---- device I/O (unauthenticated hardware access) ----
  if (parts[0] === "devices") {
    // Probe endpoints - check real device connectivity
    if (parts[1] === "probe" && parts[2] === "uart" && method === "GET") {
      return send(res, 200, serial.probe());
    }
    if (parts[1] === "probe" && parts[2] === "cam" && method === "GET") {
      return send(res, 200, camera.probe());
    }

    // SSE stream of live serial readings from /dev/copra-uart
    if (parts[1] === "stream" && method === "GET") {
      res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
      res.write(": connected\n\n");
      serial.subscribe(res);
      const ping = setInterval(() => res.write(": ping\n\n"), 25000);
      req.on("close", () => { clearInterval(ping); serial.unsubscribe(res); });
      return;
    }

    // Latest reading snapshot
    if (parts[1] === "reading" && parts[2] === "latest" && method === "GET") {
      const reading = serial.getLatest();
      return reading ? send(res, 200, reading) : send(res, 204);
    }

    return send(res, 404, { error: "Not found" });
  }

  // ---- camera (unauthenticated hardware access) ----
  if (parts[0] === "camera") {
    // MJPEG live stream from /dev/copra-cam
    if (parts[1] === "stream" && method === "GET") {
      return camera.streamMjpeg(req, res);
    }

    // Capture a single frame + optional contour analysis
    if (parts[1] === "capture" && method === "POST") {
      let frame;
      try {
        frame = camera.captureFrame();
      } catch (err) {
        return send(res, 503, { error: err.message });
      }

      const contour = camera.analyzeContour(frame);
      const base64 = "data:image/jpeg;base64," + frame.toString("base64");

      return send(res, 200, {
        image: base64,
        contour: contour,            // null if OpenCV is unavailable
        sensor: serial.getLatest(),  // attach the latest sensor reading
      });
    }

    return send(res, 404, { error: "Not found" });
  }

  // everything below needs a signed-in user
  if (!auth.userFromToken(token)) return send(res, 401, { error: "Authentication required" });

  if (parts[0] === "events" && method === "GET") {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    res.write(": connected\n\n");
    clients.add(res);
    const ping = setInterval(() => res.write(": ping\n\n"), 25000);
    req.on("close", () => { clearInterval(ping); clients.delete(res); });
    return;
  }

  if (parts[0] === "entities" && store.ENTITIES[parts[1]]) {
    const name = parts[1];
    const id = parts[2];
    if (!id && method === "GET")
      return send(res, 200, store.list(name, url.searchParams.get("sort") || "-created_date", url.searchParams.get("limit") || 100));
    if (!id && method === "POST") {
      const rec = store.create(name, await readBody(req));
      broadcast(name);
      return send(res, 201, rec);
    }
    if (!id && method === "DELETE") {
      const filter = JSON.parse(url.searchParams.get("filter") || "{}");
      const deleted = store.removeMany(name, filter);
      broadcast(name);
      return send(res, 200, { deleted });
    }
    if (id && method === "GET") {
      const rec = store.get(name, id);
      return rec ? send(res, 200, rec) : send(res, 404, { error: "Not found" });
    }
    if (id && (method === "PATCH" || method === "PUT")) {
      const rec = store.update(name, id, await readBody(req));
      if (!rec) return send(res, 404, { error: "Not found" });
      broadcast(name);
      return send(res, 200, rec);
    }
    if (id && method === "DELETE") {
      const ok = store.remove(name, id);
      if (ok) broadcast(name);
      return ok ? send(res, 204) : send(res, 404, { error: "Not found" });
    }
  }

  // ---- PNS/BAFS 43:2009 grading (authenticated) ----
  if (parts[0] === "grade" && method === "POST") {
    const body = await readBody(req);
    const result = classifyPNS(body);
    return send(res, 200, { ...result, table: GRADE_TABLE });
  }

  return send(res, 404, { error: "Not found" });
}

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json", ".ico": "image/x-icon" };

function serveStatic(req, res, url) {
  if (!fs.existsSync(dist)) { res.writeHead(404); return res.end("Build the frontend first (npm run build) or use the Vite dev server."); }
  let file = path.join(dist, path.normalize(decodeURIComponent(url.pathname)));
  if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, "index.html");
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    try {
      if (url.pathname.startsWith("/api/")) await handleApi(req, res, url);
      else serveStatic(req, res, url);
    } catch (e) {
      if (e instanceof SyntaxError) return send(res, 400, { error: "Invalid request" });
      if (/constraint failed/.test(e.errstr || e.message || "")) return send(res, 400, { error: "Invalid data" });
      const status = e.status || 500;
      if (status === 500) console.error(e);
      if (!res.headersSent) send(res, status, { error: status === 500 ? "Server error" : e.message });
      else res.end();
    }
  })
  .listen(PORT, () => {
    console.log(`CopraSense API on http://localhost:${PORT} (db: ${process.env.DB_PATH || "server/data/coprasense.db"})`);
    // Start the serial reader — will log a warning if /dev/copra-uart is absent.
    serial.start();
  });
