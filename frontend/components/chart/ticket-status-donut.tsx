"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

type DonutItem = {
  name: string;
  value: number;
  color: string;
};

interface TicketStatusDonutProps {
  title: string;
  data: DonutItem[];
  legends?: string[]; // optional
}

export default function TicketStatusDonut({
  title,
  data,
  legends,
}: TicketStatusDonutProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Title */}
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>

      {/* Donut */}
      <div className="relative h-[150px] w-[150px]">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              innerRadius={45}
              outerRadius={65}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((item, index) => (
                <Cell key={index} fill={item.color} />
              ))}
            </Pie>

            {/* Tooltip (hover) */}
            <Tooltip
              formatter={(value: number, name: string) => {
                const percent = ((value / total) * 100).toFixed(1);
                return [`${value} (${percent}%)`, name];
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center total */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold">{total}</span>
          <span className="text-[10px] text-muted-foreground">Total</span>
        </div>
      </div>

      {/* Legend */}
      <ul className="w-2/3 space-y-1 text-xs">
        {data.map((item, index) => {
          const percent = ((item.value / total) * 100).toFixed(1);

          return (
            <li key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Kotak warna sesuai chart */}
                <span
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground">
                  {legends?.[index] ?? item.name}
                </span>
              </div>

              <span className="font-medium">
                {item.value} ({percent}%)
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
