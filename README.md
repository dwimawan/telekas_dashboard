# TeleFinance Dashboard

Web dashboard (Phase 3) untuk **Tele-Finance Bot**. Baca langsung dari Google Sheets
yang sama dipakai bot — tidak ada database tambahan.

Stack: Next.js 14 (App Router) + Tailwind CSS. Tanpa dependency eksternal untuk auth
Google (pakai `crypto` bawaan Node, pola yang sama seperti `lib/sheets.js` di bot).

## Fitur

- Filter rentang tanggal (custom + preset 7/30/90 hari)
- Ringkasan pemasukan / pengeluaran / selisih
- Tabel transaksi dengan pagination (15 baris/halaman)
- Toggle dark mode (tersimpan di localStorage, tanpa flash saat reload)
- Responsive: HP, tablet, laptop, monitor besar

## 1. Setup Google Service Account

1. Buka [Google Cloud Console](https://console.cloud.google.com/) → pilih/buat project.
2. **IAM & Admin → Service Accounts → Create Service Account**.
3. Setelah dibuat, buka tab **Keys → Add Key → Create new key → JSON**. File JSON akan terdownload.
4. Dari file JSON itu, ambil `client_email` dan `private_key`.
5. Buka Google Sheet-mu (yang dipakai Tele-Finance Bot), klik **Share**, tambahkan
   `client_email` tadi dengan akses **Viewer**.
6. Aktifkan **Google Sheets API** untuk project tersebut (Cloud Console → APIs & Services → Enable APIs).

## 2. Setup Lokal

```bash
npm install
cp .env.example .env.local
# isi .env.local dengan GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID
npm run dev
```

Buka `http://localhost:3000`.

> Catatan `GOOGLE_PRIVATE_KEY`: saat paste ke `.env.local`, biarkan `\n` sebagai teks literal
> (bukan newline asli) — kode di `lib/googleAuth.js` sudah otomatis convert.

## 3. Deploy ke Vercel

1. Push folder ini ke repo GitHub baru.
2. Import repo di [Vercel](https://vercel.com/new).
3. Di **Project Settings → Environment Variables**, tambahkan 4 variable dari `.env.example`.
4. Deploy. Selesai — tidak perlu build step tambahan.

## Struktur Data yang Diharapkan

Sheet tab (default nama `Transaksi`, bisa diubah lewat `SHEET_NAME`) dengan kolom:

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| Timestamp | Tanggal | Jenis | Nominal | Kategori | Keterangan | Sumber Data |

Ini persis skema yang sudah ditulis oleh Tele-Finance Bot, jadi tidak perlu ubah apa pun
di sheet yang sudah ada.

## Struktur Proyek

```
app/
├── layout.js              — root layout + anti-flash dark mode script
├── page.js                — dashboard utama (client component)
├── globals.css
└── api/transactions/route.js  — server route: fetch + filter tanggal

lib/
├── googleAuth.js           — JWT signing (RS256) + token exchange
└── sheets.js                — fetch & normalize baris sheet

components/
├── DateRangeFilter.jsx
├── SummaryCards.jsx
├── TransactionTable.jsx
├── Pagination.jsx
└── DarkModeToggle.jsx
```

## Kenapa Desainnya Seperti Ini

- **Pagination di client-side**: data personal finance biasanya ratusan–ribuan baris,
  jauh di bawah batas nyaman browser. Menghindari kompleksitas cursor-based pagination
  di server → lebih mudah dirawat.
- **Tanpa library Google API resmi (`googleapis`)**: cukup pakai `fetch` + `crypto`
  bawaan Node, konsisten dengan pola JWT yang sudah dipakai di bot, dan menghindari
  dependency besar yang jarang diperlukan untuk read-only access.
- **`revalidate: 60`** di `lib/sheets.js`: data cache 60 detik di server supaya tidak
  memanggil Sheets API di setiap request, tapi tetap terasa "live".

## Pengembangan Selanjutnya (opsional)

- Grafik kategori (bar/pie) — bisa pakai `recharts` bila dibutuhkan nanti.
- Export ke CSV/Excel dari hasil filter.
- Multi-sheet / multi-user jika bot juga dikembangkan ke arah itu.
