let crypto;
// Edge runtime uses Web Crypto (crypto.subtle); Node uses require("crypto").
try {
  crypto = require("crypto");
} catch {
  // Fallback: Web Crypto available globally in Edge
  crypto = null;
}

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET env var is required");
  return s;
}

const ENC = { alg: "sha256" };

function b64url(buf) {
  return buf.toString("base64url");
}

// Node.js path — used in API routes (serverless Node runtime)
export function sign(payload, ttlSeconds = 86400) {
  const secret = getSecret();
  const nodeCrypto = crypto; // captured at module load
  const header = b64url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const now = Math.floor(Date.now() / 1000);
  const body = b64url(Buffer.from(JSON.stringify({ ...payload, iat: now, exp: now + ttlSeconds })));
  const sig = b64url(nodeCrypto.createHmac("sha256", Buffer.from(secret, "utf-8")).update(`${header}.${body}`).digest());
  return `${header}.${body}.${sig}`;
}

export function verify(token) {
  const secret = getSecret();
  const nodeCrypto = crypto;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const key = Buffer.from(secret, "utf-8");
    const expected = b64url(nodeCrypto.createHmac("sha256", key).update(`${header}.${body}`).digest());
    if (!nodeCrypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
