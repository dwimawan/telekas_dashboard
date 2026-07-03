import crypto from "crypto";

// Same pattern as the Tele-Finance Bot's lib/sheets.js JWT auth (Phase 1),
// reused here for read-only access from the dashboard's server side.
// No external auth library needed — Node's built-in crypto handles RS256 signing.

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

let cachedToken = null;
let cachedTokenExpiry = 0;

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function buildJwt() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (!email || !privateKey) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY env vars"
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(
    JSON.stringify(payload)
  )}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  const signature = signer.sign(privateKey, "base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${unsigned}.${signature}`;
}

// Fetches (and caches in-memory) an OAuth2 access token for the Sheets API.
// Serverless functions are short-lived, so the cache mostly helps warm
// invocations, but it costs nothing to keep.
export async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiry - 60_000) {
    return cachedToken;
  }

  const jwt = buildJwt();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  cachedTokenExpiry = now + data.expires_in * 1000;
  return cachedToken;
}
