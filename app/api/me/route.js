import { NextResponse } from "next/server";
import { verify } from "@/lib/auth";

export async function GET(request) {
  const token = request.cookies.get("telefinance_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = verify(token);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ username: payload.username });
}
