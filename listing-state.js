(function attachListingState(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PromptlyListingState = api;
})(typeof window !== "undefined" ? window : globalThis, function listingStateFactory() {
  // A posting URL is the strongest stable identity available across refreshes.
  // Curated placeholders do not always have one, so their visible listing
  // fields form a deterministic fallback instead of collapsing to company.
  function listingIdentity(item = {}) {
    const url = String(item.sourceUrl || "").trim();
    if (url) return url;
    const parts = [item.company, item.role, item.program || item.cycle, item.location]
      .map((value) => String(value || "").trim());
    return `listing:${JSON.stringify(parts)}`;
  }

  function resolveListing(openings = [], reference = "") {
    const key = String(reference || "");
    if (!key) return null;
    return openings.find((item) => listingIdentity(item) === key)
      // Backward compatibility for company-keyed saved alerts and statuses.
      || openings.find((item) => String(item.company || "") === key)
      || null;
  }

  // Older builds stored a company name. Since those builds also opened the
  // first matching company row, assigning that state to the same first row is
  // the least surprising migration—and, crucially, does not mark every role.
  function migrateLegacyEntries(entries, openings = []) {
    const migrated = new Map(entries instanceof Map ? entries : Object.entries(entries || {}));
    let changed = false;
    for (const [key, value] of [...migrated.entries()]) {
      if (openings.some((item) => listingIdentity(item) === key)) continue;
      const legacyMatch = openings.find((item) => String(item.company || "") === key);
      if (!legacyMatch) continue;
      const listingKey = listingIdentity(legacyMatch);
      migrated.delete(key);
      if (!migrated.has(listingKey)) migrated.set(listingKey, value);
      changed = true;
    }
    return { entries: migrated, changed };
  }

  return { listingIdentity, resolveListing, migrateLegacyEntries };
});
