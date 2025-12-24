"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CreditCard,
  Users,
  Receipt,
  TrendingUp,
  XCircle,
  AlertCircle,
} from "lucide-react";
import TicketStatusDonut from "./chart/ticket-status-donut";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const stats = [
  {
    title: "Card Issues",
    value: 500,
    sub: "Rp-",
    icon: CreditCard,
    iconBg: "bg-blue-500",
    subColor: "text-blue-500",
  },
  {
    title: "Ticket Issued",
    value: 500,
    sub: "Rp-",
    icon: Users,
    iconBg: "bg-green-500",
    subColor: "text-green-500",
  },
  {
    title: "Ticket Redeemed",
    value: 500,
    sub: "Rp-",
    icon: Receipt,
    iconBg: "bg-red-500",
    subColor: "text-red-500",
  },
  {
    title: "Expired Ticket",
    value: 500,
    sub: "Rp-",
    icon: XCircle,
    iconBg: "bg-red-500",
    subColor: "text-red-500",
  },
  {
    title: "Remaining Ticket",
    value: 500,
    sub: "Rp-",
    icon: AlertCircle,
    iconBg: "bg-orange-500",
    subColor: "text-orange-500",
  },
];

const recentActivities = [
  {
    id: 1,
    action: "Pendaftaran Member Baru",
    user: "John Doe",
    time: "5 menit yang lalu",
  },
  {
    id: 2,
    action: "Transaksi Kartu",
    user: "Jane Smith",
    time: "15 menit yang lalu",
  },
  {
    id: 3,
    action: "Update Stock Kartu",
    user: "Admin",
    time: "1 jam yang lalu",
  },
  {
    id: 4,
    action: "Penambahan Petugas",
    user: "Manager",
    time: "2 jam yang lalu",
  },
];

const data = [
  { name: "Halim", gold: 120, silver: 80, kai: 40 },
  { name: "Karawang", gold: 90, silver: 60, kai: 30 },
  { name: "Padalarang", gold: 150, silver: 110, kai: 55 },
  { name: "Tegalluar", gold: 70, silver: 40, kai: 20 },
];

// const tabs = ['Halim', 'Karawang', 'Padalarang', 'Tegalluar'];

// const tablePerTab: Record<string, number> = {
//   Halim: 6,
//   Karawang: 4,
//   Padalarang: 8,
//   Tegalluar: 5,
// };

// const [activeTab, setActiveTab] = useState('Halim');

export function DashboardContent() {
  const tabs = ["Halim", "Karawang", "Padalarang", "Tegalluar"];

  const tablePerTab: Record<string, number> = {
    Halim: 6,
    Karawang: 4,
    Padalarang: 8,
    Tegalluar: 5,
  };

  const [activeTab, setActiveTab] = useState("Halim");
  return (
    <div className="space-y-6">
      {/* LAST UPDATE */}
      <p className="mb-4 text-xs text-muted-foreground italic">
        Last update: 12 December 2025, 09.30 AM
      </p>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Ticket Overview</CardTitle>

        <Select defaultValue="januari">
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="januari">Januari</SelectItem>
            <SelectItem value="februari">Februari</SelectItem>
            <SelectItem value="maret">Maret</SelectItem>
            <SelectItem value="april">April</SelectItem>
            <SelectItem value="mei">Mei</SelectItem>
            <SelectItem value="juni">Juni</SelectItem>
            <SelectItem value="juli">Juli</SelectItem>
            <SelectItem value="agustus">Agustus</SelectItem>
            <SelectItem value="september">September</SelectItem>
            <SelectItem value="oktober">Oktober</SelectItem>
            <SelectItem value="november">November</SelectItem>
            <SelectItem value="desember">Desember</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      {/* Stats Grid */}
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {stats.map((stat) => (
              <Card key={stat.title} className="p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  {/* LEFT CONTENT */}
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {stat.title}
                    </p>

                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>

                    <p className={`text-xs ${stat.subColor}`}>{stat.sub}</p>
                  </div>

                  {/* RIGHT ICON */}
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${stat.iconBg}`}
                  >
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-foreground">
            Dashboard Penjualan & Ticket
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 space-y-6">
              {/* TABEL PENJUALAN */}
              <Card>
                <CardHeader>
                  <CardTitle>Tabel Penjualan Card Harian</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Tabs */}
                  <div className="flex gap-4">
                    {["Halim", "Karawang", "Padalarang", "Tegalluar"].map(
                      (item) => (
                        <button
                          key={item}
                          onClick={() => setActiveTab(item)}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition
        ${
          activeTab === item
            ? "bg-primary text-white"
            : "bg-muted hover:bg-primary hover:text-white"
        }
      `}
                        >
                          {item}
                        </button>
                      )
                    )}
                  </div>

                  {/* Table */}
                  <div className="overflow-auto rounded-lg border">
                    <table className="w-full text-sm border-collapse">
                      <thead className="bg-muted">
                        <tr>
                          <th
                            rowSpan={2}
                            className="border px-3 py-2 text-center align-middle"
                          >
                            Tanggal
                          </th>
                          <th
                            colSpan={3}
                            className="border px-3 py-2 text-center"
                          >
                            GOLD
                          </th>
                          <th
                            colSpan={3}
                            className="border px-3 py-2 text-center"
                          >
                            SILVER
                          </th>
                          <th
                            rowSpan={2}
                            className="border px-3 py-2 text-center "
                          >
                            KAI
                          </th>
                          <th
                            rowSpan={2}
                            className="border px-3 py-2 text-center align-middle"
                          >
                            Total
                          </th>
                        </tr>

                        <tr className="bg-muted/70">
                          {[
                            "JaBan",
                            "JaKa",
                            "KaBan",
                            "JaBan",
                            "JaKa",
                            "KaBan",
                          ].map((h, i) => (
                            <th
                              key={i}
                              className="border px-3 py-2 text-center"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...Array(6)].map((_, i) => (
                          <tr key={i}>
                            {[...Array(9)].map((_, j) => (
                              <td key={j} className="border px-3 py-2">
                                &nbsp;
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* EXPIRED TICKET */}
              <Card>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* CARD IN / OUT */}
                  <TicketStatusDonut
                    title="Card In/Out"
                    data={[
                      { name: "In", value: 40, color: "#94a3b8" },
                      { name: "Out", value: 60, color: "#2563eb" },
                    ]}
                    legends={["In (belum terjual)", "Out (sudah terjual)"]}
                  />

                  <TicketStatusDonut
                    title="Status Card"
                    data={[
                      { name: "Redeem", value: 70, color: "#22c55e" },
                      { name: "Belum Redeem", value: 30, color: "#eab308" },
                    ]}
                    legends={["Sudah Redeem", "Belum Redeem"]}
                  />

                  <TicketStatusDonut
                    title="Status Ticket"
                    data={[
                      { name: "Active", value: 50, color: "#22c55e" },
                      { name: "Redeemed", value: 30, color: "#3b82f6" },
                      { name: "Expired", value: 20, color: "#ef4444" },
                    ]}
                    legends={["Active", "Redeemed", "Expired"]}
                  />
                </div>
              </Card>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              {/* STATUS TICKET */}
              <Card>
                <CardHeader>
                  <CardTitle>Grafik Penjualan Card (Per Stasiun)</CardTitle>
                </CardHeader>

                <CardContent className="relative h-[352px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="gold"
                        fill="#facc15"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="silver"
                        fill="#94a3b8"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar dataKey="kai" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* GRAFIK PENJUALAN */}
              <Card>
                <CardHeader className="text-center">
                  <CardTitle>Grafik Penjualan Card (Per hari)</CardTitle>
                </CardHeader>

                <CardContent className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />

                      <Line
                        type="monotone"
                        dataKey="gold"
                        stroke="#facc15"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />

                      <Line
                        type="monotone"
                        dataKey="silver"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />

                      <Line
                        type="monotone"
                        dataKey="kai"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="w-full rounded-xl bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Expired Ticket
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-300 text-black">
                  <th className="border px-4 py-2 text-center font-medium">
                    Expired Date
                  </th>
                  <th className="border px-4 py-2 text-center font-medium">
                    Card Category
                  </th>
                  <th className="border px-4 py-2 text-center font-medium">
                    Card Type
                  </th>
                  <th className="border px-4 py-2 text-center font-medium">
                    Ticket
                  </th>
                  <th className="border px-4 py-2 text-center font-medium">
                    Jumlah
                  </th>
                </tr>
              </thead>

              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="border px-4 py-3">&nbsp;</td>
                    <td className="border px-4 py-3">&nbsp;</td>
                    <td className="border px-4 py-3">&nbsp;</td>
                    <td className="border px-4 py-3">&nbsp;</td>
                    <td className="border px-4 py-3">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
