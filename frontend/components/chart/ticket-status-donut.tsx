'use client';

type DonutItem = {
  label: string;
  value: number;
  color: string;
};

const data: DonutItem[] = [
  { label: 'Redeemed', value: 45, color: 'stroke-green-500' },
  { label: 'Active', value: 70, color: 'stroke-blue-500' },
  { label: 'Expired', value: 20, color: 'stroke-red-500' },
];

export default function TicketStatusDonut() {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <svg width="160" height="160" viewBox="0 0 120 120">
        {/* Background circle */}
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="12" className="stroke-muted" />

        {data.map((item, i) => {
          const dash = (item.value / 100) * circumference;
          const dashArray = `${dash} ${circumference - dash}`;
          const dashOffset = -offset;

          offset += dash;

          return <circle key={i} cx="60" cy="60" r={radius} fill="none" strokeWidth="12" strokeDasharray={dashArray} strokeDashoffset={dashOffset} className={`${item.color}`} transform="rotate(-90 60 60)" strokeLinecap="round" />;
        })}
      </svg>

      {/* Center text */}
      <div className="absolute text-center">
        <p className="text-xl font-bold text-foreground">100%</p>
        <p className="text-xs text-muted-foreground">Ticket</p>
      </div>

      {/* Legend */}
      <div className="mt-4 flex gap-4 text-xs">
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${item.color.replace('stroke', 'bg')}`} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
