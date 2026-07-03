export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-700">
      <span className="text-xs text-slate-500 dark:text-slate-400">
        Halaman {page} dari {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40 dark:border-slate-600 dark:text-slate-300"
        >
          Sebelumnya
        </button>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40 dark:border-slate-600 dark:text-slate-300"
        >
          Berikutnya
        </button>
      </div>
    </div>
  );
}
