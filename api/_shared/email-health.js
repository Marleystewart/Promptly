// Is email actually working? Nothing in the app could answer that.
//
// Resend accepts the shared sandbox sender (onboarding@resend.dev) but refuses
// to deliver it to anyone except the account owner. Because every send failure
// was swallowed, Promptly spent weeks unable to deliver a single confirmation
// email — and the only symptom was that signups never became verified.
//
// This records the outcome of every send and reports whether the configuration
// can actually reach a real student, so the state is visible in /admin.html
// instead of being inferred from silence.

const { getRedis } = require("./store");

const HEALTH_KEY = "promptly:email:health";
const SANDBOX_DOMAIN = "resend.dev";

function fromAddress() {
  return process.env.ALERT_FROM_EMAIL || "Promptly <onboarding@resend.dev>";
}

// The sandbox sender only ever reaches the Resend account owner. Treating this
// as "configured" is what made the outage invisible, so it gets its own flag.
function isSandboxSender(from = fromAddress()) {
  return String(from).toLowerCase().includes(SANDBOX_DOMAIN);
}

function configState() {
  const hasKey = Boolean(process.env.RESEND_API_KEY);
  const from = fromAddress();
  const sandbox = isSandboxSender(from);
  return {
    hasApiKey: hasKey,
    from,
    sandboxSender: sandbox,
    // The only state in which a real student can receive anything.
    canReachRealUsers: hasKey && !sandbox,
    blockedReason: !hasKey
      ? "RESEND_API_KEY is not set in Vercel."
      : sandbox
        ? "ALERT_FROM_EMAIL still uses Resend's sandbox sender, which only delivers to the Resend account owner. Verify a sending domain and set ALERT_FROM_EMAIL to an address on it."
        : null,
  };
}

// Never let diagnostics break a send. Every call is best-effort.
async function recordEmailOutcome(kind, result) {
  try {
    const redis = await getRedis();
    if (!redis) return;
    const now = new Date().toISOString();
    if (result && result.sent) {
      await redis.hset(HEALTH_KEY, { lastSuccessAt: now, lastSuccessKind: String(kind || "unknown") });
    } else {
      const reason = (result && (result.error || result.setupRequired)) || "Unknown send failure.";
      await redis.hset(HEALTH_KEY, {
        lastFailureAt: now,
        lastFailureKind: String(kind || "unknown"),
        lastFailureReason: String(reason).slice(0, 300),
      });
    }
  } catch {
    // Diagnostics are not worth failing a send over.
  }
}

async function readEmailHealth() {
  const config = configState();
  let recorded = {};
  try {
    const redis = await getRedis();
    if (redis) recorded = (await redis.hgetall(HEALTH_KEY)) || {};
  } catch {
    recorded = {};
  }
  return {
    ...config,
    lastSuccessAt: recorded.lastSuccessAt || null,
    lastSuccessKind: recorded.lastSuccessKind || null,
    lastFailureAt: recorded.lastFailureAt || null,
    lastFailureKind: recorded.lastFailureKind || null,
    lastFailureReason: recorded.lastFailureReason || null,
  };
}

module.exports = {
  recordEmailOutcome,
  readEmailHealth,
  configState,
  isSandboxSender,
  fromAddress,
  HEALTH_KEY,
};
