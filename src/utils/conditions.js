const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000;

export async function fetchConditions(conditionsConfig) {
  if (!conditionsConfig) return null;
  const { source, id } = conditionsConfig;
  const key = `${source}-${id}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;

  const res = await fetch(`/api/conditions/${source}/${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  cache.set(key, { data, ts: Date.now() });
  return data;
}

// Pre-load all resort conditions in one batch call.
// Returns a Map<resortIndex, conditionsData>.
export async function fetchAllConditions(resorts) {
  const indexed = resorts
    .map((r, i) => ({ resort: r, index: i }))
    .filter(({ resort }) => resort.conditions);

  if (!indexed.length) return new Map();

  const ids = indexed
    .map(({ resort }) => `${resort.conditions.source}:${resort.conditions.id}`)
    .join(",");

  try {
    const res = await fetch(`/api/conditions/batch?ids=${encodeURIComponent(ids)}`);
    if (!res.ok) return new Map();
    const results = await res.json();
    const map = new Map();
    results.forEach(({ data }, i) => {
      if (data) {
        const key = `${indexed[i].resort.conditions.source}-${indexed[i].resort.conditions.id}`;
        cache.set(key, { data, ts: Date.now() });
        map.set(indexed[i].index, data);
      }
    });
    return map;
  } catch {
    return new Map();
  }
}
