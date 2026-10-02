// Frontend client for the local SQLite-backed API (see /server).
// Mirrors the small slice of the old Base44 SDK this app used:
//   api.entities.<Name>.list/create/update/delete/deleteMany/subscribe
//   api.auth.*   and   api.integrations.Core.GenerateImage
const TOKEN_KEY = "coprasense_token";

const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
const setToken = (t) => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
};

async function request(method, path, body) {
  const token = getToken();
  const res = await fetch("/api" + path, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// One shared EventSource; entities re-fetch when the server reports a change.
const listeners = new Map(); // entityName -> Set<fn>
let source = null;
function ensureSource() {
  if (source || !getToken()) return;
  source = new EventSource("/api/events?token=" + encodeURIComponent(getToken()));
  source.onmessage = (e) => {
    try {
      const { entity } = JSON.parse(e.data);
      listeners.get(entity)?.forEach((fn) => fn({ entity }));
    } catch { /* ignore */ }
  };
  source.onerror = () => { /* EventSource retries automatically */ };
}
function closeSource() {
  source?.close();
  source = null;
}

const entity = (name) => ({
  list: (sort = "-created_date", limit = 100) =>
    request("GET", `/entities/${name}?sort=${encodeURIComponent(sort)}&limit=${limit}`),
  get: (id) => request("GET", `/entities/${name}/${id}`),
  create: (data) => request("POST", `/entities/${name}`, data),
  update: (id, data) => request("PATCH", `/entities/${name}/${id}`, data),
  delete: (id) => request("DELETE", `/entities/${name}/${id}`),
  deleteMany: (filter = {}) =>
    request("DELETE", `/entities/${name}?filter=${encodeURIComponent(JSON.stringify(filter))}`),
  subscribe: (fn) => {
    if (!listeners.has(name)) listeners.set(name, new Set());
    listeners.get(name).add(fn);
    ensureSource();
    return () => listeners.get(name)?.delete(fn);
  },
});

export const api = {
  entities: { CopraBatch: entity("CopraBatch"), CopraSample: entity("CopraSample") },

  auth: {
    getToken,
    setToken,
    me: () => request("GET", "/auth/me"),
    async login(email, password) {
      const r = await request("POST", "/auth/login", { email, password });
      setToken(r.access_token);
      return r;
    },
    async register(email, password) {
      const r = await request("POST", "/auth/register", { email, password });
      setToken(r.access_token);
      return r;
    },
    async logout() {
      try { await request("POST", "/auth/logout", {}); } catch { /* token may already be invalid */ }
      setToken(null);
      closeSource();
    },
    resetPasswordRequest: (email) => request("POST", "/auth/reset-request", { email }),
    resetPassword: ({ resetToken, newPassword }) => request("POST", "/auth/reset", { token: resetToken, newPassword }),
  },

  integrations: {
    Core: {
      // Image generation was a Base44 hosted integration; there is no local equivalent.
      // Callers already fall back to a sample without an image when this throws.
      GenerateImage: async () => {
        throw new Error("Image generation is not available without Base44");
      },
    },
  },
};
