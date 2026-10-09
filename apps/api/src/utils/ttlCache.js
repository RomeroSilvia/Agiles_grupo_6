export function createTtlCache({ ttlMs, maxEntries, now = Date.now }) {
  const entries = new Map();

  function removeExpired() {
    const currentTime = now();
    for (const [key, entry] of entries) {
      if (entry.expiresAt <= currentTime) {
        entries.delete(key);
      }
    }
  }

  function removeOldest() {
    while (entries.size > maxEntries) {
      const oldestKey = entries.keys().next().value;
      entries.delete(oldestKey);
    }
  }

  function getOrSet(key, load) {
    const entry = entries.get(key);
    if (entry && entry.expiresAt > now()) {
      return entry.promise;
    }

    const promise = Promise.resolve().then(load);
    removeExpired();
    entries.delete(key);
    entries.set(key, { promise, expiresAt: now() + ttlMs });
    removeOldest();

    promise.catch(() => {
      if (entries.get(key)?.promise === promise) {
        entries.delete(key);
      }
    });

    return promise;
  }

  return {
    getOrSet,
    get size() {
      return entries.size;
    },
  };
}
