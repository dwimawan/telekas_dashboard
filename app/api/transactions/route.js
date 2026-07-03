import { NextResponse } from "next/server";
import { fetchTransactions } from "@/lib/sheets";
import { parseTanggal } from "@/lib/dates";
import { verify } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getUsername(request) {
  try {
    const token = request.cookies.get("telefinance_token")?.value;
    if (!token) return null;
    const payload = verify(token);
    return payload?.username || null;
  } catch {
    return null;
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const createdByParam = searchParams.get("createdBy");

    const username = getUsername(request);
    const createdBy = searchParams.has("createdBy") ? createdByParam : (username || "");

    const transactions = await fetchTransactions();

    const startDate = start ? new Date(`${start}T00:00:00`) : null;
    const endDate = end ? new Date(`${end}T23:59:59`) : null;

    const filtered = transactions.filter((tx) => {
      const d = parseTanggal(tx.tanggal);
      if (!d) return false;
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      if (createdBy && tx.createdBy?.toLowerCase() !== createdBy.toLowerCase()) return false;
      return true;
    });

    // Newest first
    filtered.sort((a, b) => parseTanggal(b.tanggal) - parseTanggal(a.tanggal));

    return NextResponse.json({ transactions: filtered });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Failed to load transactions" },
      { status: 500 }
    );
  }
}
