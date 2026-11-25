/** localStorage keys used by the app (per-device preferences). */
export const STORAGE_KEYS = {
  theme: "lumbung:theme",
  lastMember: "lumbung:last-member",
} as const

/** Old (Indonesian) key → new key. */
const LEGACY_KEYS: Record<string, string> = {
  "lumbung:tema": STORAGE_KEYS.theme,
  "lumbung:profil-terakhir": STORAGE_KEYS.lastMember,
}

/**
 * Moves values stored under the old key names so preferences are not lost.
 * Safe to call on every start-up.
 */
export function migrateLegacyStorageKeys() {
  try {
    for (const [oldKey, newKey] of Object.entries(LEGACY_KEYS)) {
      const value = localStorage.getItem(oldKey)
      if (value === null) continue
      if (localStorage.getItem(newKey) === null) localStorage.setItem(newKey, value)
      localStorage.removeItem(oldKey)
    }
  } catch {
    // storage blocked (private mode) — nothing to migrate
  }
}
