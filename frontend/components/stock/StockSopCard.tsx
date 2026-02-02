"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

interface StockSopCardProps {
  title?: string;
  items: string[];
}

export default function StockSopCard({
  title = "Standard Operating Procedure (SOP)",
  items,
}: StockSopCardProps) {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Info className="text-blue-600" size={20} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900 border border-blue-100">
          <p className="font-semibold mb-2">Panduan:</p>
          <ul className="list-inside list-decimal space-y-2">
            {items.map((item, index) => (
              <li key={index} className="leading-relaxed pl-1">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
