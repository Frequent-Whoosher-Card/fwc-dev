'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Users, Receipt, TrendingUp } from 'lucide-react';
import TicketStatusDonut from './chart/ticket-status-donut';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const stats = [
  {
    title: 'Card Issues',
    value: '1,234',
    change: '+12.5%',
    icon: CreditCard,
    trend: 'up',
  },
  {
    title: 'Ticket Issues',
    value: '856',
    change: '+8.2%',
    icon: Users,
    trend: 'up',
  },
  {
    title: 'Redeem',
    value: '45',
    change: '+23.1%',
    icon: Receipt,
    trend: 'up',
  },
  {
    title: 'expired ticket',
    value: 'Rp 45.2M',
    change: '+15.3%',
    icon: TrendingUp,
    trend: 'up',
  },
  {
    title: 'remaining ticket',
    value: 'Rp 45.2M',
    change: '+15.3%',
    icon: TrendingUp,
    trend: 'up',
  },
];

const recentActivities = [
  {
    id: 1,
    action: 'Pendaftaran Member Baru',
    user: 'John Doe',
    time: '5 menit yang lalu',
  },
  {
    id: 2,
    action: 'Transaksi Kartu',
    user: 'Jane Smith',
    time: '15 menit yang lalu',
  },
  {
    id: 3,
    action: 'Update Stock Kartu',
    user: 'Admin',
    time: '1 jam yang lalu',
  },
  {
    id: 4,
    action: 'Penambahan Petugas',
    user: 'Manager',
    time: '2 jam yang lalu',
  },
];

const data = [
  { name: 'Halim', gold: 120, silver: 80, kai: 40 },
  { name: 'Karawang', gold: 90, silver: 60, kai: 30 },
  { name: 'Padalarang', gold: 150, silver: 110, kai: 55 },
  { name: 'Tegalluar', gold: 70, silver: 40, kai: 20 },
];

export function DashboardContent() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <Card className="border-border">
        <CardContent className="p-6">
          {/* LAST UPDATE */}
          <p className="mb-4 text-xs text-muted-foreground italic">Last update: 12 December 2025, 09.30 AM</p>

          {/* GRID STAT */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {stats.map((stat) => (
              <Card key={stat.title} className="border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-green-500 mt-1">{stat.change} dari bulan lalu</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-foreground">Dashboard Penjualan & Ticket</CardTitle>
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
                    {['Halim', 'Karawang', 'Padalarang', 'Tegalluar'].map((item) => (
                      <button key={item} className="px-4 py-2 rounded-md bg-muted text-sm font-medium hover:bg-primary hover:text-white transition">
                        {item}
                      </button>
                    ))}
                  </div>

                  {/* Table */}
                  <div className="overflow-auto rounded-lg border">
                    <table className="w-full text-sm border-collapse">
                      <thead className="bg-muted">
                        <tr>
                          <th rowSpan={2} className="border px-3 py-2 text-center align-middle">
                            Tanggal
                          </th>
                          <th colSpan={3} className="border px-3 py-2 text-center">
                            GOLD
                          </th>
                          <th colSpan={3} className="border px-3 py-2 text-center">
                            SILVER
                          </th>
                          <th rowSpan={2} className="border px-3 py-2 text-center ">
                            KAI
                          </th>
                          <th rowSpan={2} className="border px-3 py-2 text-center align-middle">
                            Total
                          </th>
                        </tr>

                        <tr className="bg-muted/70">
                          {['JaBan', 'JaKa', 'KaBan', 'JaBan', 'JaKa', 'KaBan'].map((h, i) => (
                            <th key={i} className="border px-3 py-2 text-center">
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
                <CardHeader>
                  <CardTitle>Expired Ticket Table</CardTitle>
                </CardHeader>
                <CardContent className="h-[180px] flex items-center justify-center text-muted-foreground">(isi tabel expired ticket)</CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              {/* STATUS TICKET */}
              <Card>
                <CardHeader>
                  <CardTitle>Status Ticket</CardTitle>
                </CardHeader>

                <CardContent className="relative h-[280px]">
                  <TicketStatusDonut />
                </CardContent>
              </Card>

              {/* GRAFIK PENJUALAN */}
              <Card>
                <CardHeader className="text-center">
                  <CardTitle>Grafik Penjualan Card</CardTitle>
                </CardHeader>

                <CardContent className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="gold" fill="#facc15" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="silver" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="kai" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
