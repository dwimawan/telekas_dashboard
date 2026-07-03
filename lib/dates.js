// Shared date parsing for the Tele-Finance sheet's "Tanggal" column.
// Handles DD/MM/YYYY (bot default) and YYYY-MM-DD as fallback.
export const WEEKDAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function parseTanggal(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return new Date(value);
  const match = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    const [, d, m, y] = match;
    return new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
  }
  const fallback = new Date(value);
  return isNaN(fallback) ? null : fallback;
}

export function toISODate(date) {
  if (!date) return "";
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function clampMonthlyStartDay(day) {
  const value = Number(day) || 1;
  return Math.min(28, Math.max(1, value));
}

export function getLastDayOfMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function getMonthlyCycleRange(year, month, monthlyStartDay = 1) {
  const startDay = clampMonthlyStartDay(monthlyStartDay);
  const monthIndex = Number(month) - 1;
  if (startDay === 1) {
    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 0);
    return { start: toISODate(start), end: toISODate(end), label: formatMonthLabel(start) };
  }

  const start = new Date(year, monthIndex - 1, startDay);
  const end = new Date(year, monthIndex, startDay - 1);
  return { start: toISODate(start), end: toISODate(end), label: `${formatMonthLabel(start)} – ${formatMonthLabel(end)}` };
}

export function getWeekRange(referenceDate, weekStartDay = "monday") {
  const ref = typeof referenceDate === "string" ? parseTanggal(referenceDate) : referenceDate;
  if (!ref) return null;
  const normalized = new Date(ref);
  normalized.setHours(0, 0, 0, 0);
  const targetDay = WEEKDAY_NAMES.indexOf(String(weekStartDay).toLowerCase()) || 1;
  const delta = (normalized.getDay() - targetDay + 7) % 7;
  const start = new Date(normalized);
  start.setDate(normalized.getDate() - delta);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: toISODate(start), end: toISODate(end), label: `${formatShort(start)} – ${formatShort(end)}` };
}

export function formatMonthLabel(date) {
  if (!date) return "";
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatShort(date) {
  if (!date) return "";
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${d}/${m}`;
}

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export function formatDateLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  const day = d.getDate();
  const mon = MONTH_SHORT[d.getMonth()];
  const year = d.getFullYear();
  const now = new Date();
  return now.getFullYear() === year
    ? `${day} ${mon}`
    : `${day} ${mon} ${year}`;
}

export function formatRangeLabel(startIso, endIso) {
  return `${formatDateLabel(startIso)} – ${formatDateLabel(endIso)}`;
}
