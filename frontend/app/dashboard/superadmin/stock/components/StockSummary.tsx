export function StockSummary() {
  const items = [
    { label: 'All Card', value: 500 },
    { label: 'Stock In', value: 500 },
    { label: 'Stock Out', value: 500 },
    { label: 'Out of Stock', value: 500 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border bg-white p-4 shadow-sm"
        >
          <p className="text-sm text-gray-500">{item.label}</p>
          <p className="text-2xl font-semibold">{item.value}</p>
          <p className="text-xs text-gray-400">Rp -</p>
        </div>
      ))}
    </div>
  );
}
