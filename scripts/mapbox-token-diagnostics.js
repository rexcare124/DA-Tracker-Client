#!/usr/bin/env node
/**
 * Mapbox token diagnostic script for PK-Website client.
 *
 * Checks:
 * - Which Mapbox env vars are set (.env: NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN vs code: NEXT_PUBLIC_MAPBOX_TOKEN)
 * - Token format (public pk.* / secret sk.*, length)
 * - Token validity via Mapbox Geocoding API and Styles API (same as Map.tsx / SMRCReviewsPanel)
 *
 * Run from repo root or client: node client/scripts/mapbox-token-diagnostics.js
 * From client: node scripts/mapbox-token-diagnostics.js
 */

const path = require("path");
const fs = require("fs");

const CLIENT_DIR = path.resolve(__dirname, "..");

// Next.js load order: .env, .env.local, .env.development, .env.development.local (later overrides)
const ENV_FILES = [".env", ".env.local", ".env.development", ".env.development.local"];

function parseEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1).replace(/\\n/g, "\n");
    }
    env[key] = value;
  }
  return env;
}

/** Load env the way Next.js does: merge in order, later overrides. */
function loadEnvNextJsOrder() {
  let merged = {};
  for (const name of ENV_FILES) {
    const filePath = path.join(CLIENT_DIR, name);
    if (fs.existsSync(filePath)) {
      const parsed = parseEnvFile(filePath);
      merged = { ...merged, ...parsed };
    }
  }
  return merged;
}

function loadEnv() {
  return parseEnvFile(path.join(CLIENT_DIR, ".env"));
}

function formatTokenForLog(token) {
  if (!token || token.length < 12) return token || "(empty)";
  return token.slice(0, 8) + "..." + token.slice(-4);
}

function run() {
  console.log("========================================");
  console.log("Mapbox token diagnostics (PK-Website)");
  console.log("========================================\n");

  const VAR_ACCESS_TOKEN = "NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN";
  const VAR_TOKEN = "NEXT_PUBLIC_MAPBOX_TOKEN";

  console.log("1. Next.js env file load order (client directory)");
  console.log("   Next.js merges in this order; later files override. Only NEXT_PUBLIC_* are sent to the browser.\n");
  let merged = {};
  for (const name of ENV_FILES) {
    const filePath = path.join(CLIENT_DIR, name);
    const exists = fs.existsSync(filePath);
    console.log("   " + name + ":", exists ? path.join(CLIENT_DIR, name) : "(not present)");
    if (exists) {
      const parsed = parseEnvFile(filePath);
      const tokenVal = parsed[VAR_TOKEN];
      const accessVal = parsed[VAR_ACCESS_TOKEN];
      if (tokenVal !== undefined || accessVal !== undefined) {
        console.log("      -> " + VAR_TOKEN + ":", tokenVal !== undefined ? (tokenVal ? formatTokenForLog(tokenVal) : "empty string") : "(not set)");
        if (accessVal !== undefined) console.log("      -> " + VAR_ACCESS_TOKEN + ":", accessVal ? formatTokenForLog(accessVal) : "empty string");
      }
      merged = { ...merged, ...parsed };
    }
  }

  const fromAccessToken = merged[VAR_ACCESS_TOKEN];
  const fromToken = merged[VAR_TOKEN];
  const effectiveToken = (fromToken !== undefined ? fromToken : fromAccessToken) ?? "";

  console.log("\n2. Effective value Next.js would send to the browser");
  console.log("   Variable name the app uses: process.env." + VAR_TOKEN);
  console.log("   Effective value (after overrides):", effectiveToken ? formatTokenForLog(effectiveToken) : "(empty or undefined)");

  if (effectiveToken === "" && (fromToken === "" || (fromToken === undefined && fromAccessToken === ""))) {
    console.log("\n   >>> ROOT CAUSE: NEXT_PUBLIC_MAPBOX_TOKEN is empty in the browser.");
    console.log("   >>> A later env file (.env.local, .env.development, or .env.development.local) may be");
    console.log("   >>> setting it to empty, or the variable is missing. Remove/rename the override or set");
    console.log("   >>> NEXT_PUBLIC_MAPBOX_TOKEN in the file that wins (e.g. .env) and restart the dev server.");
  }
  if (fromAccessToken !== undefined && fromToken === undefined) {
    console.log("\n   >>> MISMATCH: Only " + VAR_ACCESS_TOKEN + " is set; code expects " + VAR_TOKEN + ".");
    console.log("   >>> Add " + VAR_TOKEN + " with the same value (or rename the key) and restart the dev server.");
  }
  if (fromToken === undefined && fromAccessToken === undefined) {
    console.log("\n   >>> No Mapbox token in any env file. Add " + VAR_TOKEN + " to client/.env and restart.");
  }

  if (!effectiveToken) {
    console.log("\n3. Token format / API checks skipped (no token).");
    process.exit(1);
  }

  console.log("\n3. Token format");
  const trimmedToken = (effectiveToken && typeof effectiveToken === "string" ? effectiveToken : "").trim();
  if (effectiveToken && effectiveToken !== trimmedToken) {
    console.log("   >>> WARNING: Token has leading/trailing whitespace. Remove spaces so the value is exactly the token.");
  }
  const hasNonPrintable = trimmedToken && /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(trimmedToken);
  if (hasNonPrintable) {
    console.log("   >>> WARNING: Token contains non-printable/control characters. Re-paste the token from Mapbox.");
  }
  const isPublic = trimmedToken.startsWith("pk.");
  const isSecret = trimmedToken.startsWith("sk.");
  const len = trimmedToken.length;
  console.log("   Prefix: " + (isPublic ? "pk. (public, OK for client)" : isSecret ? "sk. (secret; use pk. in browser)" : len ? "unexpected (expected pk. or sk.)" : "N/A (no token)"));
  console.log("   Length: " + len + " chars");

  if (isSecret) {
    console.log("   >>> Use a public token (pk.) in NEXT_PUBLIC_* for maps/geocoding in the browser.");
  }

  console.log("\n4. Mapbox API checks (using effective token)");

  const tokenForApi = trimmedToken;
  const tests = [
    {
      name: "Geocoding API (reverse geocode)",
      url: "https://api.mapbox.com/geocoding/v5/mapbox.places/-98.5795,39.8283.json?access_token=" + tokenForApi + "&types=region,place&limit=1",
    },
    {
      name: "Styles API (mapbox.streets used by Map)",
      url: "https://api.mapbox.com/styles/v1/mapbox/light-v11?access_token=" + tokenForApi,
    },
  ];

  let allPassed = true;

  async function runTest(t) {
    try {
      const res = await fetch(t.url);
      const ok = res.ok;
      const status = res.status;
      let body = "";
      try {
        body = await res.text();
      } catch (_) {}

      if (ok) {
        console.log("   OK  " + t.name + " (HTTP " + status + ")");
        return true;
      }

      let msg = "HTTP " + status;
      try {
        const j = JSON.parse(body);
        if (j.message) msg += ": " + j.message;
      } catch (_) {
        if (body.length < 120) msg += " " + body;
      }
      console.log("   FAIL " + t.name + " - " + msg);
      return false;
    } catch (err) {
      console.log("   FAIL " + t.name + " - " + (err.message || String(err)));
      return false;
    }
  }

  (async () => {
    for (const t of tests) {
      const ok = await runTest(t);
      if (!ok) allPassed = false;
    }

    console.log("\n5. Why the map might show 'Loading map...' when this script passes");
    console.log("   Next.js inlines NEXT_PUBLIC_* only when the dev server STARTS. The browser");
    console.log("   receives whatever was in the bundle at that moment. If the client was started");
    console.log("   from the repo root (e.g. 'npm run dev' at root runs all workspaces), the process");
    console.log("   may have started with a different cwd and not loaded client/.env, so the inlined");
    console.log("   value can be empty. Cached .next output can also serve an old bundle.");
    console.log("");
    console.log("   >>> ROOT CAUSE when file checks pass: stale or wrong-context bundle.");
    console.log("   >>> FIX (do in order):");
    console.log("   1. Stop the Next.js dev server (Ctrl+C in the terminal where it runs).");
    console.log("   2. Delete the cache:  Remove-Item -Recurse -Force client\\.next  (PowerShell, from repo root).");
    console.log("   3. Start the client from the CLIENT directory only:  cd client  then  npm run dev");
    console.log("      (Do not start via root 'npm run dev'; use a dedicated terminal for the client.)");
    console.log("   4. Wait for 'Ready' in the terminal, then hard-refresh /datasearch (Ctrl+Shift+R).");
    console.log("");
    console.log("   Verify in browser: DevTools -> Network -> filter 'mapbox' -> reload page.");
    console.log("   If requests to api.mapbox.com return 401, the token in the bundle is wrong or missing.");

    console.log("\n========================================");
    if (allPassed && effectiveToken) {
      console.log("Result: Token format and API checks passed (server-side).");
      if (fromAccessToken && !fromToken) {
        console.log("Action: Add NEXT_PUBLIC_MAPBOX_TOKEN to .env (same value) so the app receives the token.");
      }
      console.log("Action: If map still loads in browser, RESTART the Next.js dev server and reload the page.");
    } else {
      console.log("Result: One or more checks failed. Fix variable name and/or token (pk. for client).");
    }
    console.log("========================================\n");
    process.exit(allPassed && effectiveToken ? 0 : 1);
  })();
}

run();
