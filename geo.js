// ─────────────────────────────────────────────────────────────────────────
// Location resolution and distance, for both the browser and the alert
// pipeline (loaded as a <script> and require()d by Node — see the export
// shim at the bottom).
//
// Why this exists: location used to be substring matching. "Hartford" matched
// a listing only if the string "hartford" appeared in it, so Hartford, CT and
// Springfield, MA — 25 miles apart — were treated as unrelated, while
// "Springfield" matched Springfield IL, MO, MA and OR equally. There was no
// concept of distance anywhere in the product.
//
// Coordinates below are city centres to ~2 decimal places, which is well
// inside the tolerance of a 25-mile bucket. They cover the metros where
// student roles actually get posted, plus a centroid for every state so an
// unrecognised town still resolves to something honest rather than nothing.
// ─────────────────────────────────────────────────────────────────────────

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.PromptlyGeo = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // ── Reference points ────────────────────────────────────────────────────
  // [latitude, longitude]. Keyed by lowercase "city, st".
  const CITIES = {
    // Northeast
    "new york, ny": [40.71, -74.01], "brooklyn, ny": [40.68, -73.94],
    "buffalo, ny": [42.89, -78.88], "rochester, ny": [43.16, -77.61],
    "albany, ny": [42.65, -73.76], "syracuse, ny": [43.05, -76.15],
    "white plains, ny": [41.03, -73.76], "yonkers, ny": [40.93, -73.90],
    "jersey city, nj": [40.73, -74.06], "newark, nj": [40.74, -74.17],
    "princeton, nj": [40.35, -74.66], "hoboken, nj": [40.74, -74.03],
    "trenton, nj": [40.22, -74.76], "camden, nj": [39.93, -75.12],
    "philadelphia, pa": [39.95, -75.17], "pittsburgh, pa": [40.44, -79.996],
    "harrisburg, pa": [40.27, -76.88], "allentown, pa": [40.60, -75.47],
    "scranton, pa": [41.41, -75.66], "erie, pa": [42.13, -80.09],
    "state college, pa": [40.79, -77.86], "bethlehem, pa": [40.63, -75.38],
    "boston, ma": [42.36, -71.06], "cambridge, ma": [42.37, -71.11],
    "springfield, ma": [42.10, -72.59], "worcester, ma": [42.26, -71.80],
    "lowell, ma": [42.63, -71.32], "waltham, ma": [42.38, -71.24],
    "hartford, ct": [41.76, -72.69], "new haven, ct": [41.31, -72.93],
    "stamford, ct": [41.05, -73.54], "greenwich, ct": [41.03, -73.63],
    "bridgeport, ct": [41.18, -73.19], "norwalk, ct": [41.12, -73.41],
    "providence, ri": [41.82, -71.41], "portland, me": [43.66, -70.26],
    "manchester, nh": [42.99, -71.46], "burlington, vt": [44.48, -73.21],
    "wilmington, de": [39.75, -75.55], "baltimore, md": [39.29, -76.61],
    "bethesda, md": [38.98, -77.09], "rockville, md": [39.08, -77.15],
    "annapolis, md": [38.98, -76.49], "silver spring, md": [38.99, -77.03],
    "washington, dc": [38.91, -77.04], "arlington, va": [38.88, -77.10],
    "alexandria, va": [38.80, -77.05], "reston, va": [38.96, -77.34],
    "mclean, va": [38.93, -77.18], "richmond, va": [37.54, -77.44],
    "norfolk, va": [36.85, -76.29], "charlottesville, va": [38.03, -78.48],

    // Southeast
    "atlanta, ga": [33.75, -84.39], "savannah, ga": [32.08, -81.09],
    "athens, ga": [33.96, -83.38], "charlotte, nc": [35.23, -80.84],
    "raleigh, nc": [35.78, -78.64], "durham, nc": [35.99, -78.90],
    "chapel hill, nc": [35.91, -79.06], "greensboro, nc": [36.07, -79.79],
    "charleston, sc": [32.78, -79.93], "columbia, sc": [34.00, -81.03],
    "greenville, sc": [34.85, -82.39], "nashville, tn": [36.16, -86.78],
    "memphis, tn": [35.15, -90.05], "knoxville, tn": [35.96, -83.92],
    "chattanooga, tn": [35.05, -85.31], "louisville, ky": [38.25, -85.76],
    "lexington, ky": [38.04, -84.50], "birmingham, al": [33.52, -86.80],
    "huntsville, al": [34.73, -86.59], "jackson, ms": [32.30, -90.18],
    "new orleans, la": [29.95, -90.07], "baton rouge, la": [30.45, -91.19],
    "little rock, ar": [34.75, -92.29], "fayetteville, ar": [36.06, -94.16],
    "bentonville, ar": [36.37, -94.21], "miami, fl": [25.76, -80.19],
    "orlando, fl": [28.54, -81.38], "tampa, fl": [27.95, -82.46],
    "jacksonville, fl": [30.33, -81.66], "fort lauderdale, fl": [26.12, -80.14],
    "gainesville, fl": [29.65, -82.32], "tallahassee, fl": [30.44, -84.28],
    "miramar, fl": [25.98, -80.30], "charleston, wv": [38.35, -81.63],

    // Midwest
    "chicago, il": [41.88, -87.63], "evanston, il": [42.05, -87.69],
    "naperville, il": [41.79, -88.15], "champaign, il": [40.12, -88.24],
    "springfield, il": [39.80, -89.64], "peoria, il": [40.69, -89.59],
    "detroit, mi": [42.33, -83.05], "ann arbor, mi": [42.28, -83.74],
    "grand rapids, mi": [42.96, -85.67], "lansing, mi": [42.73, -84.56],
    "cleveland, oh": [41.50, -81.69], "columbus, oh": [39.96, -83.00],
    "cincinnati, oh": [39.10, -84.51], "dayton, oh": [39.76, -84.19],
    "toledo, oh": [41.65, -83.54], "indianapolis, in": [39.77, -86.16],
    "bloomington, in": [39.17, -86.53], "south bend, in": [41.68, -86.25],
    "milwaukee, wi": [43.04, -87.91], "madison, wi": [43.07, -89.40],
    "minneapolis, mn": [44.98, -93.27], "saint paul, mn": [44.95, -93.09],
    "rochester, mn": [44.02, -92.47], "des moines, ia": [41.59, -93.62],
    "iowa city, ia": [41.66, -91.53], "kansas city, mo": [39.10, -94.58],
    "saint louis, mo": [38.63, -90.20], "columbia, mo": [38.95, -92.33],
    "omaha, ne": [41.26, -95.93], "lincoln, ne": [40.81, -96.68],
    "wichita, ks": [37.69, -97.34], "overland park, ks": [38.98, -94.67],
    "fargo, nd": [46.88, -96.79], "sioux falls, sd": [43.55, -96.73],

    // South Central
    "austin, tx": [30.27, -97.74], "dallas, tx": [32.78, -96.80],
    "houston, tx": [29.76, -95.37], "san antonio, tx": [29.42, -98.49],
    "fort worth, tx": [32.76, -97.33], "plano, tx": [33.02, -96.70],
    "el paso, tx": [31.76, -106.49], "college station, tx": [30.63, -96.33],
    "irving, tx": [32.81, -96.95], "oklahoma city, ok": [35.47, -97.52],
    "tulsa, ok": [36.15, -95.99],

    // Mountain / West
    "denver, co": [39.74, -104.99], "boulder, co": [40.01, -105.27],
    "colorado springs, co": [38.83, -104.82], "salt lake city, ut": [40.76, -111.89],
    "provo, ut": [40.23, -111.66], "phoenix, az": [33.45, -112.07],
    "tempe, az": [33.43, -111.94], "tucson, az": [32.22, -110.97],
    "scottsdale, az": [33.49, -111.93], "albuquerque, nm": [35.08, -106.65],
    "las vegas, nv": [36.17, -115.14], "reno, nv": [39.53, -119.81],
    "boise, id": [43.62, -116.20], "billings, mt": [45.78, -108.50],
    "bozeman, mt": [45.68, -111.04], "cheyenne, wy": [41.14, -104.82],
    "casper, wy": [42.85, -106.31], "laramie, wy": [41.31, -105.59],

    // Pacific
    "san francisco, ca": [37.77, -122.42], "san jose, ca": [37.34, -121.89],
    "palo alto, ca": [37.44, -122.14], "mountain view, ca": [37.39, -122.08],
    "sunnyvale, ca": [37.37, -122.04], "santa clara, ca": [37.35, -121.96],
    "menlo park, ca": [37.45, -122.18], "cupertino, ca": [37.32, -122.03],
    "oakland, ca": [37.80, -122.27], "berkeley, ca": [37.87, -122.27],
    "los angeles, ca": [34.05, -118.24], "santa monica, ca": [34.02, -118.49],
    "pasadena, ca": [34.15, -118.14], "irvine, ca": [33.68, -117.83],
    "san diego, ca": [32.72, -117.16], "sacramento, ca": [38.58, -121.49],
    "santa barbara, ca": [34.42, -119.70], "san luis obispo, ca": [35.28, -120.66],
    "fresno, ca": [36.74, -119.79], "seattle, wa": [47.61, -122.33],
    "bellevue, wa": [47.61, -122.20], "redmond, wa": [47.67, -122.12],
    "spokane, wa": [47.66, -117.43], "tacoma, wa": [47.25, -122.44],
    "portland, or": [45.52, -122.68], "eugene, or": [44.05, -123.09],
    "beaverton, or": [45.49, -122.80], "hillsboro, or": [45.52, -122.99],
    "anchorage, ak": [61.22, -149.90], "honolulu, hi": [21.31, -157.86],
  };

  // Fallback when a town isn't in the list: at least land in the right state.
  // Marked so callers can tell the difference between "we know this city" and
  // "we only know the state", and phrase results accordingly.
  const STATE_CENTROIDS = {
    al: [32.81, -86.79], ak: [61.37, -152.40], az: [33.73, -111.43],
    ar: [34.97, -92.37], ca: [36.12, -119.68], co: [39.06, -105.31],
    ct: [41.60, -72.76], de: [39.32, -75.51], fl: [27.77, -81.69],
    ga: [33.04, -83.64], hi: [21.09, -157.50], id: [44.24, -114.48],
    il: [40.35, -88.99], in: [39.85, -86.26], ia: [42.01, -93.21],
    ks: [38.53, -96.73], ky: [37.67, -84.67], la: [31.17, -91.87],
    me: [44.69, -69.38], md: [39.06, -76.80], ma: [42.23, -71.53],
    mi: [43.33, -84.54], mn: [45.69, -93.90], ms: [32.74, -89.68],
    mo: [38.46, -92.29], mt: [46.92, -110.45], ne: [41.13, -98.27],
    nv: [38.31, -117.06], nh: [43.45, -71.56], nj: [40.30, -74.52],
    nm: [34.84, -106.25], ny: [42.17, -74.95], nc: [35.63, -79.81],
    nd: [47.53, -99.78], oh: [40.39, -82.76], ok: [35.57, -96.93],
    or: [44.57, -122.07], pa: [40.59, -77.21], ri: [41.68, -71.51],
    sc: [33.86, -80.95], sd: [44.30, -99.44], tn: [35.75, -86.69],
    tx: [31.05, -97.56], ut: [40.15, -111.86], vt: [44.05, -72.71],
    va: [37.77, -78.17], wa: [47.40, -121.49], wv: [38.49, -80.95],
    wi: [44.27, -89.62], wy: [42.76, -107.30], dc: [38.91, -77.04],
  };

  const STATE_NAMES = {
    alabama: "al", alaska: "ak", arizona: "az", arkansas: "ar", california: "ca",
    colorado: "co", connecticut: "ct", delaware: "de", florida: "fl", georgia: "ga",
    hawaii: "hi", idaho: "id", illinois: "il", indiana: "in", iowa: "ia",
    kansas: "ks", kentucky: "ky", louisiana: "la", maine: "me", maryland: "md",
    massachusetts: "ma", michigan: "mi", minnesota: "mn", mississippi: "ms",
    missouri: "mo", montana: "mt", nebraska: "ne", nevada: "nv",
    "new hampshire": "nh", "new jersey": "nj", "new mexico": "nm", "new york": "ny",
    "north carolina": "nc", "north dakota": "nd", ohio: "oh", oklahoma: "ok",
    oregon: "or", pennsylvania: "pa", "rhode island": "ri", "south carolina": "sc",
    "south dakota": "sd", tennessee: "tn", texas: "tx", utah: "ut", vermont: "vt",
    virginia: "va", washington: "wa", "west virginia": "wv", wisconsin: "wi",
    wyoming: "wy", "district of columbia": "dc", "washington dc": "dc",
  };

  // Aliases students actually type. Without these, "NYC" and "the bay area"
  // resolve to nothing at all.
  const ALIASES = {
    nyc: "new york, ny", "new york city": "new york, ny", manhattan: "new york, ny",
    "the city": "new york, ny", sf: "san francisco, ca", "the bay": "san francisco, ca",
    "bay area": "san francisco, ca", "san fran": "san francisco, ca",
    "silicon valley": "palo alto, ca", la: "los angeles, ca", socal: "los angeles, ca",
    dc: "washington, dc", "d.c.": "washington, dc", "washington d.c.": "washington, dc",
    philly: "philadelphia, pa", chi: "chicago, il", atl: "atlanta, ga",
    "the triangle": "raleigh, nc", rtp: "raleigh, nc", "twin cities": "minneapolis, mn",
    boston: "boston, ma", seattle: "seattle, wa", denver: "denver, co",
    austin: "austin, tx", nola: "new orleans, la",
  };

  // Metros used for the "nearest major metro" expansion step. A student in
  // rural Arkansas is realistically looking at Little Rock or Dallas, not at
  // whatever town happens to be 90 miles away.
  const MAJOR_METROS = [
    "new york, ny", "boston, ma", "philadelphia, pa", "washington, dc",
    "atlanta, ga", "miami, fl", "charlotte, nc", "chicago, il", "detroit, mi",
    "minneapolis, mn", "saint louis, mo", "dallas, tx", "houston, tx",
    "austin, tx", "denver, co", "phoenix, az", "seattle, wa", "portland, or",
    "san francisco, ca", "los angeles, ca", "san diego, ca", "nashville, tn",
    "pittsburgh, pa", "columbus, oh", "indianapolis, in", "salt lake city, ut",
    "kansas city, mo", "las vegas, nv", "orlando, fl", "raleigh, nc",
  ];

  const REMOTE = /\bremote\b|\bwork from home\b|\bwfh\b|\banywhere\b|\bvirtual\b|\bdistributed\b/i;
  const HYBRID = /\bhybrid\b/i;

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/\bu\.?s\.?a?\.?\b/g, " ")   // drop trailing "USA"
      .replace(/\bunited states\b/g, " ")
      .replace(/[^a-z0-9,\s.-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // "New York, NY, USA" / "Hartford CT" / "Austin, Texas" → { city, state }
  function splitCityState(text) {
    const clean = normalize(text).replace(/,\s*$/, "");
    if (!clean) return null;

    // Comma form first — it's unambiguous.
    const parts = clean.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const city = parts[0];
      const tail = parts[1];
      const state = tail.length === 2 ? tail : STATE_NAMES[tail] || null;
      if (state) return { city, state };
    }

    // No comma: try a trailing state name or abbreviation.
    const words = clean.split(" ");
    for (let take = 2; take >= 1; take -= 1) {
      // `continue`, not `break`: a two-word input like "hartford ct" has
      // words.length === 2, which would abandon the loop before ever trying a
      // one-word state and resolve the whole thing to nothing.
      if (words.length <= take) continue;
      const tail = words.slice(-take).join(" ");
      const state = tail.length === 2 && !STATE_NAMES[tail] ? tail : STATE_NAMES[tail];
      if (state && STATE_CENTROIDS[state]) {
        return { city: words.slice(0, -take).join(" "), state };
      }
    }
    return { city: clean, state: null };
  }

  // Resolve free text to a point. `precision` says how much to trust it:
  //   "city"   – matched a known city
  //   "state"  – only the state is known, coordinates are a centroid
  //   "remote" – not a place
  function resolve(text) {
    const raw = String(text || "").trim();
    if (!raw) return null;
    const clean = normalize(raw);
    if (!clean) return null;

    if (REMOTE.test(raw)) return { kind: "remote", label: "Remote", precision: "remote" };

    const aliased = ALIASES[clean] || clean;
    if (CITIES[aliased]) {
      return { kind: "point", lat: CITIES[aliased][0], lon: CITIES[aliased][1], label: titleCaseLocation(aliased), precision: "city" };
    }

    const parsed = splitCityState(aliased);
    if (!parsed) return null;

    if (parsed.city && parsed.state) {
      const key = `${parsed.city}, ${parsed.state}`;
      if (CITIES[key]) {
        return { kind: "point", lat: CITIES[key][0], lon: CITIES[key][1], label: titleCaseLocation(key), precision: "city" };
      }
      if (STATE_CENTROIDS[parsed.state]) {
        return {
          kind: "point", lat: STATE_CENTROIDS[parsed.state][0], lon: STATE_CENTROIDS[parsed.state][1],
          label: titleCaseLocation(`${parsed.city}, ${parsed.state}`), precision: "state", state: parsed.state,
        };
      }
    }

    // Bare city with no state — only safe if exactly one known city matches.
    if (parsed.city) {
      const matches = Object.keys(CITIES).filter((key) => key.split(",")[0] === parsed.city);
      if (matches.length === 1) {
        return { kind: "point", lat: CITIES[matches[0]][0], lon: CITIES[matches[0]][1], label: titleCaseLocation(matches[0]), precision: "city" };
      }
      // Ambiguous ("springfield") — say so instead of guessing a state.
      if (matches.length > 1) {
        return { kind: "ambiguous", label: titleCaseLocation(parsed.city), options: matches.map(titleCaseLocation), precision: "ambiguous" };
      }
      const bare = STATE_NAMES[parsed.city];
      if (bare && STATE_CENTROIDS[bare]) {
        return { kind: "point", lat: STATE_CENTROIDS[bare][0], lon: STATE_CENTROIDS[bare][1], label: titleCaseLocation(parsed.city), precision: "state", state: bare };
      }
    }
    return null;
  }

  function titleCaseLocation(value) {
    return String(value)
      .split(",")
      .map((part, index) => {
        const trimmed = part.trim();
        if (index === 1 && trimmed.length === 2) return trimmed.toUpperCase();
        return trimmed.replace(/\b[a-z]/g, (ch) => ch.toUpperCase());
      })
      .join(", ");
  }

  // Great-circle distance in statute miles. Standard haversine; 3958.8 is the
  // mean Earth radius in miles.
  function milesBetween(a, b) {
    if (!a || !b) return null;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    return 2 * 3958.8 * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  function isRemoteText(text) { return REMOTE.test(String(text || "")); }
  function isHybridText(text) { return HYBRID.test(String(text || "")); }

  function nearestMetro(point) {
    if (!point || point.kind !== "point") return null;
    let best = null;
    for (const key of MAJOR_METROS) {
      const coords = CITIES[key];
      if (!coords) continue;
      const distance = milesBetween(point, { lat: coords[0], lon: coords[1] });
      if (distance === null) continue;
      if (!best || distance < best.miles) best = { key, label: titleCaseLocation(key), miles: distance, lat: coords[0], lon: coords[1] };
    }
    return best;
  }

  return {
    resolve, milesBetween, nearestMetro, isRemoteText, isHybridText,
    titleCaseLocation, CITIES, STATE_CENTROIDS, MAJOR_METROS,
  };
});
