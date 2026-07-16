import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(n) {
  return "Rp" + Math.round(n || 0).toLocaleString("id-ID");
}

// Compact IDR: 1864000 -> "1,86jt", 412000 -> "412rb"
export function formatRupiahCompact(n) {
  const v = Math.abs(Math.round(n || 0));
  if (v >= 1_000_000) {
    const jt = v / 1_000_000;
    return (jt >= 10 ? String(Math.round(jt)) : jt.toFixed(2).replace(/\.?0+$/, "").replace(".", ",")) + "jt";
  }
  if (v >= 1_000) return Math.round(v / 1_000) + "rb";
  return String(v);
}

// Design palette — deterministic color per category.
export const CATEGORY_PALETTE = [
  "#B6F53E", // lime (accent)
  "#0F9D8C", // teal
  "#D4880F", // amber
  "#5B4BC4", // purple
  "#3A6EA5", // blue
  "#B03A6B", // magenta
  "#8E5A2B", // brown
  "#C0392B", // red
];

export const OTHER_COLOR = "#3A3A3C";

export function categoryColor(name, index) {
  if (index != null) return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
  let hash = 0;
  for (const ch of String(name || "")) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return CATEGORY_PALETTE[Math.abs(hash) % CATEGORY_PALETTE.length];
}

// Emoji per category — keyword rules first, deterministic fallback otherwise.
const CATEGORY_EMOJI_RULES = [
  [/makan|minum|food|kuliner|jajan|snack|resto|kopi/i, "🍔"],
  [/transport|bensin|bbm|parkir|ojek|angkot|tol|kereta|bus/i, "🚗"],
  [/belanja|shopping|baju|pakaian/i, "🛍️"],
  [/rumah|kontrakan|kos|sewa|tangga/i, "🏠"],
  [/listrik|air|pln|pdam|gas|utilitas/i, "💡"],
  [/pulsa|internet|wifi|data|telepon/i, "📶"],
  [/sehat|obat|dokter|klinik/i, "💊"],
  [/didik|sekolah|buku|kursus|kuliah/i, "📚"],
  [/hibur|nonton|game|langganan|streaming|liburan/i, "🎮"],
  [/gaji|pemasukan|bonus|thr|penghasilan/i, "💰"],
  [/arisan/i, "🤝"],
  [/hadiah|kado/i, "🎁"],
  [/tabung|invest|saham/i, "🏦"],
  [/donasi|zakat|sedekah|infaq|amal/i, "🕌"],
  [/rawat|salon|skincare|kosmetik/i, "💅"],
  [/anak|bayi|susu/i, "🍼"],
  [/olahraga|gym|sport/i, "🏋️"],
  [/hewan|kucing|anjing/i, "🐾"],
];

const EMOJI_FALLBACK = ["🧾", "💸", "🪙", "📦", "✨", "🎯", "🧺", "🎨"];

export function categoryEmoji(name) {
  const label = String(name || "");
  for (const [re, emoji] of CATEGORY_EMOJI_RULES) {
    if (re.test(label)) return emoji;
  }
  let hash = 0;
  for (const ch of label) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return EMOJI_FALLBACK[Math.abs(hash) % EMOJI_FALLBACK.length];
}

export function initialsOf(text) {
  const words = String(text || "?").trim().split(/\s+/);
  const chars = words.length >= 2 ? words[0][0] + words[1][0] : String(words[0]).slice(0, 2);
  return chars.toUpperCase();
}

export function isIncome(tx) {
  return tx.jenis?.toLowerCase() === "pemasukan";
}
