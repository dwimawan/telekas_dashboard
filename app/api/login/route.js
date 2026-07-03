import { NextResponse } from "next/server";
import { sign } from "@/lib/auth";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { username, password } = body || {};
  if (!username || !password) {
    return NextResponse.json({ error: "Username dan password wajib diisi" }, { status: 400 });
  }

  let credentials;
  try {
    credentials = JSON.parse(process.env.CREDENTIALS || "{}");
  } catch {
    console.error("CREDENTIALS env var is not valid JSON");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  if (!credentials[username] || credentials[username] !== password) {
    return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
  }

  const token = sign({ username }, 86400); // 24 hours

  const response = NextResponse.json({ ok: true, username });
  response.cookies.set("telefinance_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 86400,
  });

  return response;
}
