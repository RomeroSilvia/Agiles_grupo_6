export function createTtlCache({ ttlMs, maxEntries, now = () => Date.now() }) {
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

  function get(key) {
    const entry = entries.get(key);
    if (!entry) {
      return undefined;
    }
    if (entry.expiresAt <= now()) {
      entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  function set(key, value) {
    removeExpired();
    entries.delete(key);
    entries.set(key, {
      value,
      promise: Promise.resolve(value),
      expiresAt: now() + ttlMs,
    });
    removeOldest();
  }

  function getOrSet(key, load) {
    const entry = entries.get(key);
    if (entry && entry.expiresAt > now()) {
      return entry.promise;
    }

    const currentEntry = { promise: null, value: undefined, expiresAt: now() + ttlMs };
    const promise = Promise.resolve()
      .then(load)
      .then((value) => {
        currentEntry.value = value;
        return value;
      });
    currentEntry.promise = promise;

    removeExpired();
    entries.delete(key);
    entries.set(key, currentEntry);
    removeOldest();

    promise.catch(() => {
      if (entries.get(key)?.promise === promise) {
        entries.delete(key);
      }
    });

    return promise;
  }

  return {
    get,
    set,
    getOrSet,
    get size() {
      return entries.size;
    },
  };
}
