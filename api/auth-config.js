// Kill switch: Supabase auth is parked while we sort out the project account.
// The app falls back to a clean on-device profile flow (easy to demo).
// Flip to true when Google/Supabase login is ready to come back.
const AUTH_ENABLED = false;

module.exports = function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const url = process.env.SUPABASE_URL || "";
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "";

  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  return res.status(200).json({
    enabled: AUTH_ENABLED && Boolean(url && publishableKey),
    url: AUTH_ENABLED ? url : "",
    publishableKey: AUTH_ENABLED ? publishableKey : "",
  });
};
