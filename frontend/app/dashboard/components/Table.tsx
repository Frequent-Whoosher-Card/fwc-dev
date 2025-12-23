"use client";

export default function Table({
  columns,
  data,
}: {
  columns: string[];
  data: React.ReactNode[][];
}) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-100">
        <tr>
          {columns.map((col) => (
            <th
              key={col}
              className="p-3 text-left font-medium"
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.map((row, i) => (
          <tr key={i} className="border-t">
            {row.map((cell, j) => (
              <td key={j} className="p-3">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
