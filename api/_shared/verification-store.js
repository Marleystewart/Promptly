// Verification-token storage with an email -> token index for erasure.
//
// The public token mapping has to resolve back to an email address, but that
// means it is personal data too. Keep a short-lived reverse index so account
// deletion can remove every active mapping. The scan is a migration fallback:
// tokens issued before this index existed still have up to seven days of TTL.

const VERIFY_PREFIX = "promptly:verify:";
const VERIFY_INDEX_PREFIX = "promptly:verify-index:";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase().slice(0, 254);
}

function indexKey(email) {
  return `${VERIFY_INDEX_PREFIX}${normalizeEmail(email)}`;
}

async function saveVerificationToken(redis, email, token, ttl) {
  const normalized = normalizeEmail(email);
  const cleanToken = String(token || "").trim();
  if (!redis || !normalized || !cleanToken) return false;

  // Write the discoverable index first. A process failure can then leave only
  // an expiring index member, never an undiscoverable token -> email mapping.
  const key = indexKey(normalized);
  await redis.sadd(key, cleanToken);
  await redis.expire(key, ttl);
  try {
    await redis.set(`${VERIFY_PREFIX}${cleanToken}`, normalized, { ex: ttl });
  } catch (error) {
    await redis.srem(key, cleanToken).catch(() => {});
    throw error;
  }
  return true;
}

async function consumeVerificationToken(redis, token) {
  const cleanToken = String(token || "").trim();
  if (!redis || !cleanToken) return null;
  const key = `${VERIFY_PREFIX}${cleanToken}`;
  const email = await redis.get(key);
  if (!email) return null;

  const normalized = normalizeEmail(email);
  await Promise.all([
    redis.del(key),
    normalized ? redis.srem(indexKey(normalized), cleanToken) : Promise.resolve(),
  ]);
  return normalized || null;
}

async function deleteVerificationTokensForEmail(redis, email) {
  const normalized = normalizeEmail(email);
  if (!redis || !normalized) return 0;

  const tokens = new Set(await redis.smembers(indexKey(normalized)));

  // Migration cleanup for mappings minted before the reverse index shipped.
  // The scan is bounded naturally by the token's seven-day TTL and disappears
  // from the hot path once those pre-deployment mappings expire.
  if (typeof redis.scan === "function") {
    let cursor = "0";
    do {
      const result = await redis.scan(cursor, { match: `${VERIFY_PREFIX}*`, count: 100 });
      cursor = String(Array.isArray(result) ? result[0] : (result && result.cursor) || "0");
      const keys = (Array.isArray(result) ? result[1] : result && result.keys) || [];
      const values = await Promise.all(keys.map((key) => redis.get(key)));
      keys.forEach((key, i) => {
        if (normalizeEmail(values[i]) === normalized) tokens.add(key.slice(VERIFY_PREFIX.length));
      });
    } while (cursor !== "0");
  }

  const tokenKeys = Array.from(tokens, (token) => `${VERIFY_PREFIX}${token}`);
  if (tokenKeys.length) await redis.del(...tokenKeys);
  await redis.del(indexKey(normalized));
  return tokenKeys.length;
}

module.exports = {
  VERIFY_PREFIX,
  VERIFY_INDEX_PREFIX,
  saveVerificationToken,
  consumeVerificationToken,
  deleteVerificationTokensForEmail,
};
