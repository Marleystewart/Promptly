// Guard against SSRF through push subscriptions.
//
// web-push issues a POST to whatever `subscription.endpoint` says. That value
// arrives from the client, so without a check an anonymous caller can make our
// serverless function fire requests at any host it likes — internal addresses,
// cloud metadata endpoints, anything. Browsers only ever mint endpoints on a
// small set of vendor push services, so we allowlist those and refuse the rest.

const ALLOWED_HOSTS = [
  /(^|\.)push\.services\.mozilla\.com$/i,   // Firefox
  /(^|\.)fcm\.googleapis\.com$/i,           // Chrome / Edge / Android
  /(^|\.)android\.googleapis\.com$/i,       // legacy GCM endpoint
  /(^|\.)notify\.windows\.com$/i,           // Windows / older Edge
  /(^|\.)push\.apple\.com$/i,               // Safari / iOS
];

// Returns true only for an https endpoint on a known push service.
function isAllowedPushEndpoint(endpoint) {
  let url;
  try {
    url = new URL(String(endpoint || "").trim());
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  return ALLOWED_HOSTS.some((pattern) => pattern.test(url.hostname));
}

// Validate a whole subscription object before it is used or stored.
function isSafePushSubscription(subscription) {
  if (!subscription || typeof subscription !== "object") return false;
  return isAllowedPushEndpoint(subscription.endpoint);
}

module.exports = { isAllowedPushEndpoint, isSafePushSubscription, ALLOWED_HOSTS };
