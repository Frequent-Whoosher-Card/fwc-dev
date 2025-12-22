'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Users, Receipt, TrendingUp } from 'lucide-react';

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
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Aktivitas Terkini</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-foreground">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.user}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Stock Kartu Tersedia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Kartu Gold</span>
                <span className="font-semibold text-foreground">450</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Kartu Silver</span>
                <span className="font-semibold text-foreground">680</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Kartu Bronze</span>
                <span className="font-semibold text-foreground">890</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Petugas Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Shift Pagi</span>
                <span className="font-semibold text-foreground">8 Petugas</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Shift Siang</span>
                <span className="font-semibold text-foreground">6 Petugas</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Shift Malam</span>
                <span className="font-semibold text-foreground">4 Petugas</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
