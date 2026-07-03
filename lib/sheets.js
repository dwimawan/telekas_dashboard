import { getAccessToken } from "./googleAuth";

// Sheet column layout (A-I):
// A Tanggal Transaksi | B Jenis | C Nominal | D Kategori | E Keterangan | F Source | G Sumber Data | H Created By | I Timestamp
const COLUMNS = [
  "tanggal",      // A
  "jenis",        // B
  "nominal",      // C
  "kategori",     // D
  "keterangan",   // E
  "source",       // F
  "sumberData",   // G
  "createdBy",    // H
  "timestamp",    // I
];

function rowToTransaction(row, index) {
  const obj = { id: index };
  COLUMNS.forEach((key, i) => {
    obj[key] = row[i] ?? "";
  });
  obj.nominal = Number(String(obj.nominal).replace(/[^0-9.-]/g, "")) || 0;
  return obj;
}

export async function fetchTransactions() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.SHEET_NAME || "Transaksi";
  if (!sheetId) throw new Error("Missing GOOGLE_SHEET_ID env var");

  const token = await getAccessToken();
  const range = `${sheetName}!A2:I`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
    range
  )}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets API error: ${res.status} ${text}`);
  }

  const data = await res.json();
  const rows = data.values || [];
  return rows
    .filter((row) => row.length > 0 && row[0]) // skip empty rows (needs Tanggal di kolom A)
    .map(rowToTransaction);
}
