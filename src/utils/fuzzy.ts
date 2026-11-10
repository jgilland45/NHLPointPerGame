import Fuse from 'fuse.js'

export function fuzzySearch<T extends Record<string, any>>(
  items: T[],
  query: string,
  keys: string[],
  threshold = 0.4,
  ignoreLocation = true,
) {
  const q = query?.trim?.() ?? '';
  if (q.length === 0) return items;

  const fuse = new Fuse(items, {
    keys,
    threshold,
    ignoreLocation,
  });

  return fuse.search(q).map((r) => r.item);
}

export default fuzzySearch;
