import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// ── In-memory cache ─────────────────────────────────────────────────────────
const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000;

function cached(key, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return Promise.resolve(hit.data);
  return fn().then((data) => {
    cache.set(key, { data, ts: Date.now() });
    return data;
  });
}

// ── Normalise mtnpowder response ─────────────────────────────────────────────
function normalizeMtnpowder(data) {
  const sr = data?.SnowReport;
  if (!sr) return null;
  return {
    baseDepthIn: sr.BaseArea?.BaseIn ?? null,
    midDepthIn: sr.MidMountainArea?.BaseIn ?? null,
    summitDepthIn: sr.SummitArea?.BaseIn ?? null,
    newSnow24In: sr.BaseArea?.Last24HoursIn ?? null,
    newSnow48In: sr.BaseArea?.Last48HoursIn ?? null,
    seasonTotalIn: sr.SeasonTotalIn ?? null,
    openLifts: sr.TotalOpenLifts ?? null,
    totalLifts: sr.TotalLifts ?? null,
    openTrails: sr.TotalOpenTrails ?? null,
    totalTrails: sr.TotalTrails ?? null,
    surfaceConditions: sr.BaseConditions || null,
    source: "mtnpowder",
  };
}

// ── Normalise SnoCountry response ────────────────────────────────────────────
function normalizeSnoCountry(data) {
  const r = Array.isArray(data?.items) ? data.items[0] : null;
  if (!r) return null;
  const baseMin = parseFloat(r.avgBaseDepthMin) || 0;
  const baseMax = parseFloat(r.avgBaseDepthMax) || 0;
  const base = baseMax > 0 ? Math.round((baseMin + baseMax) / 2) : baseMin;
  return {
    baseDepthIn: base || null,
    midDepthIn: null,
    summitDepthIn: null,
    newSnow24In: parseFloat(r.snowLast24Hours) || null,
    newSnow48In: parseFloat(r.snowLast48Hours) || null,
    seasonTotalIn: parseFloat(r.seasonTotal) || null,
    openLifts: parseInt(r.openDownHillLifts) || null,
    totalLifts: parseInt(r.maxOpenDownHillLifts) || null,
    openTrails: parseInt(r.openDownHillTrails) || null,
    totalTrails: parseInt(r.maxOpenDownHillTrails) || null,
    surfaceConditions: r.primarySurfaceCondition || null,
    source: "snocountry",
  };
}

// ── Shared fetch helpers (used by individual + batch routes) ─────────────────
async function fetchMtnpowder(id) {
  const raw = await cached(`mtnpowder-${id}`, () =>
    fetch(`https://mtnpowder.com/feed?resortId=${encodeURIComponent(id)}`).then((r) => r.json())
  );
  return normalizeMtnpowder(raw);
}

async function fetchSnocountry(id) {
  const raw = await cached(`snocountry-${id}`, () =>
    fetch(`http://feeds.snocountry.net/conditions.php?apiKey=SnoCountry.example&ids=${encodeURIComponent(id)}`).then((r) => r.json())
  );
  return normalizeSnoCountry(raw);
}

// ── API routes ────────────────────────────────────────────────────────────────
app.get("/api/conditions/mtnpowder/:id", async (req, res) => {
  try {
    const data = await fetchMtnpowder(req.params.id);
    if (!data) return res.status(404).json({ error: "No data" });
    res.json(data);
  } catch {
    res.status(502).json({ error: "Upstream error" });
  }
});

app.get("/api/conditions/snocountry/:id", async (req, res) => {
  try {
    const data = await fetchSnocountry(req.params.id);
    if (!data) return res.status(404).json({ error: "No data" });
    res.json(data);
  } catch {
    res.status(502).json({ error: "Upstream error" });
  }
});

// Batch endpoint — ?ids=mtnpowder:60,snocountry:303007,...
app.get("/api/conditions/batch", async (req, res) => {
  const { ids } = req.query;
  if (!ids) return res.json([]);
  const pairs = ids.split(",").filter(Boolean).map((p) => {
    const [source, id] = p.split(":");
    return { source, id };
  });
  const results = await Promise.allSettled(
    pairs.map(({ source, id }) =>
      source === "mtnpowder" ? fetchMtnpowder(id) : fetchSnocountry(id)
    )
  );
  res.json(
    pairs.map(({ source, id }, i) => ({
      source,
      id,
      data: results[i].status === "fulfilled" ? results[i].value : null,
    }))
  );
});

// ── Serve static Vite build ───────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "dist")));
app.get("/{*splat}", (_req, res) =>
  res.sendFile(path.join(__dirname, "dist", "index.html"))
);

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Ski Weather server listening on port ${PORT}`)
);
