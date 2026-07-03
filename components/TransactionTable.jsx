"use client";

import { useEffect, useMemo, useState } from "react";
import Pagination from "./Pagination";
import { parseTanggal } from "@/lib/dates";

function formatRupiah(n) {
  return "Rp " + n.toLocaleString("id-ID");
}

function SortHeader({ label, sortKey, sort, onSort, align = "left" }) {
  const active = sort.key === sortKey;
  return (
    <th
      className={`cursor-pointer select-none px-4 py-3 ${align === "right" ? "text-right" : "text-left"
        }`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={`text-[10px] ${active ? "text-brand-600" : "text-slate-300 dark:text-slate-600"}`}>
          {active ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </span>
    </th>
  );
}

export default function TransactionTable({ transactions, pageSize = 10, onPageSizeChange }) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: "tanggal", dir: "desc" });
  const size = Math.max(1, Number(pageSize) || 10);
  const pageSizeOptions = [10, 20, 50];

  useEffect(() => {
    setPage(1);
  }, [size]);

  function handleSort(key) {
    setPage(1);
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" }
    );
  }

  const sorted = useMemo(() => {
    const arr = [...transactions];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sort.key === "tanggal") {
        cmp = (parseTanggal(a.tanggal) || 0) - (parseTanggal(b.tanggal) || 0);
      } else if (sort.key === "nominal") {
        cmp = a.nominal - b.nominal;
      }
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [transactions, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / size));
  const currentPage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const startIdx = (currentPage - 1) * size;
    return sorted.slice(startIdx, startIdx + size);
  }, [sorted, currentPage, size]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
            <tr>
              <SortHeader label="Tanggal" sortKey="tanggal" sort={sort} onSort={handleSort} />
              <th className="px-4 py-3">Jenis</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Keterangan</th>
              <th className="px-4 py-3">Sumber</th>
              <SortHeader label="Nominal" sortKey="nominal" sort={sort} onSort={handleSort} align="right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {pageItems.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-slate-400 dark:text-slate-500"
                >
                  Tidak ada transaksi yang cocok dengan filter ini.
                </td>
              </tr>
            )}
            {pageItems.map((tx) => {
              const isIncome = tx.jenis?.toLowerCase() === "pemasukan";
              return (
                <tr
                  key={tx.id}
                  className="transition hover:bg-slate-50 dark:hover:bg-slate-700/40"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                    {tx.tanggal}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${isIncome
                        ? "bg-income/10 text-income"
                        : "bg-expense/10 text-expense"
                        }`}
                    >
                      {tx.jenis}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {tx.kategori}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {tx.keterangan}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {tx.sumberData}
                  </td>
                  <td
                    className={`tabular whitespace-nowrap px-4 py-3 text-right font-medium ${isIncome ? "text-income" : "text-expense"
                      }`}
                  >
                    {isIncome ? "+" : "-"}
                    {formatRupiah(tx.nominal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
            <tr>
              <td colSpan={6} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Baris / halaman</span>
                    <select
                      value={size}
                      onChange={(e) => onPageSizeChange?.(Number(e.target.value) || 10)}
                      className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    >
                      {pageSizeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Total transaksi: {sorted.length}
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
