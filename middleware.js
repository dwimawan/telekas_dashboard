import { NextResponse } from "next/server";

// Edge-compatible JWT verification (crypto.subtle instead of Node crypto)

function b64urlToBytes(str) {
  // Edge-safe base64url decode
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const decoded = atob(base64);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i);
  }
  return bytes;
}

function arrayBufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyEdge(token, secret) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, bodyB64, sigB64] = parts;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const data = enc.encode(`${headerB64}.${bodyB64}`);
    const sig = b64urlToBytes(sigB64);
    const valid = await crypto.subtle.verify("HMAC", key, sig, data);
    if (!valid) return null;

    const bodyJson = new TextDecoder().decode(b64urlToBytes(bodyB64));
    const payload = JSON.parse(bodyJson);
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

const PUBLIC_PATHS = ["/login", "/api/login"];

// PWA assets must be reachable without auth (manifest fetch, SW registration, icons)
const PUBLIC_ASSETS = ["/manifest.webmanifest", "/sw.js", "/icons/"];

export default async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ASSETS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const token = request.cookies.get("telefinance_token")?.value;
    // If already logged in, redirect from /login to /
    if (pathname === "/login" && token) {
      const payload = await verifyEdge(token, process.env.JWT_SECRET);
      if (payload) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    const token = request.cookies.get("telefinance_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await verifyEdge(token, process.env.JWT_SECRET);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // All other paths (/, /_next, /favicon.ico, etc.)
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("telefinance_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  const payload = await verifyEdge(token, process.env.JWT_SECRET);
  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("telefinance_token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
