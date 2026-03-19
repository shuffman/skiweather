const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000;

export async function fetchConditions(conditionsConfig) {
  if (!conditionsConfig) return null;
  const { source, id } = conditionsConfig;
  const key = `${source}-${id}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;

  const url = `/api/conditions/${source}/${id}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  cache.set(key, { data, ts: Date.now() });
  return data;
}
