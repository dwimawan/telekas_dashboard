function formatRupiah(n) {
  return "Rp " + n.toLocaleString("id-ID");
}

export default function SummaryCards({ transactions }) {
  const income = transactions
    .filter((t) => t.jenis?.toLowerCase() === "pemasukan")
    .reduce((sum, t) => sum + t.nominal, 0);
  const expense = transactions
    .filter((t) => t.jenis?.toLowerCase() !== "pemasukan")
    .reduce((sum, t) => sum + t.nominal, 0);
  const net = income - expense;

  const cards = [
    { label: "Pemasukan", value: income, color: "text-income" },
    { label: "Pengeluaran", value: expense, color: "text-expense" },
    {
      label: "Selisih",
      value: net,
      color: net >= 0 ? "text-income" : "text-expense",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {c.label}
          </p>
          <p className={`tabular mt-1 text-xl font-semibold ${c.color}`}>
            {formatRupiah(c.value)}
          </p>
        </div>
      ))}
    </div>
  );
}
