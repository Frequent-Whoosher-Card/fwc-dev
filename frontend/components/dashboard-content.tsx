"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CreditCard,
  Users,
  Receipt,
  XCircle,
  AlertCircle,
  CheckCircle,
  Ticket,
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
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchMetrics, fetchDailySales, fetchDailyTotals, fetchExpiredDailySales, fetchCardsSummary, fetchMetricsSummary, fetchSalesPerStation, type MetricsData, type DailySalesData, type DailyTotal, type ExpiredDailySalesData, type CardsSummaryData, type MetricsSummaryData, type StationSalesData } from "@/lib/api";

const statsConfig = [
  {
    title: "Card Issues",
    key: "cardIssued" as keyof MetricsData,
    revenueKey: "cardIssued" as keyof MetricsData["revenue"],
    icon: CreditCard,
    iconBg: "bg-blue-500",
    subColor: "text-blue-500",
  },
  {
    title: "Ticket Issued",
    key: "quotaTicketIssued" as keyof MetricsData,
    revenueKey: "quotaTicketIssued" as keyof MetricsData["revenue"],
    icon: Users,
    iconBg: "bg-green-500",
    subColor: "text-green-500",
  },
  {
    title: "Ticket Redeemed",
    key: "redeem" as keyof MetricsData,
    revenueKey: "redeem" as keyof MetricsData["revenue"],
    icon: Receipt,
    iconBg: "bg-red-500",
    subColor: "text-red-500",
  },
  {
    title: "Expired Ticket",
    key: "expiredTicket" as keyof MetricsData,
    revenueKey: "expiredTicket" as keyof MetricsData["revenue"],
    icon: XCircle,
    iconBg: "bg-red-500",
    subColor: "text-red-500",
  },
  {
    title: "Remaining Ticket",
    key: "remainingActiveTickets" as keyof MetricsData,
    revenueKey: "remainingActiveTickets" as keyof MetricsData["revenue"],
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

  const [activeTab, setActiveTab] = useState("Halim");
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [dailySales, setDailySales] = useState<DailySalesData | null>(null);
  const [dailyTotals, setDailyTotals] = useState<DailyTotal[]>([]);
  const [expiredDailySales, setExpiredDailySales] = useState<ExpiredDailySalesData | null>(null);
  const [cardsSummary, setCardsSummary] = useState<CardsSummaryData | null>(null);
  const [metricsSummary, setMetricsSummary] = useState<MetricsSummaryData | null>(null);
  const [salesPerStation, setSalesPerStation] = useState<StationSalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("current");

  // Get date range based on selected month
  const getDateRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    let month = now.getMonth();
    
    // Map selected month to month index
    const monthMap: Record<string, number> = {
      "januari": 0,
      "februari": 1,
      "maret": 2,
      "april": 3,
      "mei": 4,
      "juni": 5,
      "juli": 6,
      "agustus": 7,
      "september": 8,
      "oktober": 9,
      "november": 10,
      "desember": 11,
    };
    
    if (selectedMonth && selectedMonth !== "current" && monthMap[selectedMonth] !== undefined) {
      month = monthMap[selectedMonth];
    }
    
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    return {
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
    };
  };

  // Fetch metrics and sales data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const { start, end } = getDateRange();
        
        // Fetch metrics with date range
        const metricsData = await fetchMetrics(start, end);
        setMetrics(metricsData);

        // Fetch daily sales for selected month
        const salesData = await fetchDailySales(start, end);
        setDailySales(salesData);

        // Fetch daily totals for chart
        const totalsData = await fetchDailyTotals(start, end);
        setDailyTotals(totalsData);

        // Fetch expired daily sales
        const expiredSalesData = await fetchExpiredDailySales(start, end);
        setExpiredDailySales(expiredSalesData);

        // Fetch active cards data
        const cardsSummaryData = await fetchCardsSummary(start, end);
        setCardsSummary(cardsSummaryData);

        // Fetch metrics summary with date range
        const summaryData = await fetchMetricsSummary(start, end);
        setMetricsSummary(summaryData);

        // Fetch sales per station with date range
        const salesPerStationData = await fetchSalesPerStation(start, end);
        setSalesPerStation(salesPerStationData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedMonth]);

  // Update last update time
  const lastUpdate = new Date().toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6">
      {/* LAST UPDATE */}
      <p className="mb-4 text-xs text-muted-foreground italic">
        Last update: {lastUpdate}
      </p>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Ticket Overview</CardTitle>

        <Select 
          value={selectedMonth || "current"} 
          onValueChange={setSelectedMonth}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Bulan Ini</SelectItem>
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
          {loading ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {statsConfig.map((stat) => (
                  <Card key={stat.title} className="p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          ...
                        </p>
                        <p className={`text-xs ${stat.subColor} font-medium`}>
                          Rp0
                        </p>
                      </div>
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${stat.iconBg}`}
                      >
                        <stat.icon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              {/* Metrics Summary Loading */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 mt-4">
                <Card className="p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Total Card Issued
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        ...
                      </p>
                      <p className="text-xs text-blue-500 font-medium">
                        Loading...
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </Card>
                <Card className="p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Total Quota Ticket Issued
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        ...
                      </p>
                      <p className="text-xs text-green-500 font-medium">
                        Loading...
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
                      <Ticket className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </Card>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 mt-4">
                <Card className="p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Active Cards
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        ...
                      </p>
                      <p className="text-xs text-purple-500 font-medium">
                        Loading...
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </Card>
                <Card className="p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Quota Ticket Issued
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        ...
                      </p>
                      <p className="text-xs text-indigo-500 font-medium">
                        Loading...
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500">
                      <Ticket className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </Card>
              </div>
            </>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>Error: {error}</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {statsConfig.map((stat) => {
                  const value = metrics ? metrics[stat.key] : 0;
                  const revenueValue = metrics?.revenue ? metrics.revenue[stat.revenueKey] : 0;
                  const formattedRevenue = new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(revenueValue);
                  
                  return (
                    <Card key={stat.title} className="p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        {/* LEFT CONTENT */}
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            {stat.title}
                          </p>

                          <p className="text-2xl font-bold text-foreground">
                            {value.toLocaleString("id-ID")}
                          </p>

                          <p className={`text-xs ${stat.subColor} font-medium`}>
                            {formattedRevenue}
                          </p>
                        </div>

                        {/* RIGHT ICON */}
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${stat.iconBg}`}
                        >
                          <stat.icon className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Metrics Summary Section */}
              {metricsSummary && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 mt-4">
                  <Card className="p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Total Card Issued
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {metricsSummary.cardIssued.toLocaleString("id-ID")}
                        </p>
                        <p className="text-xs text-blue-500 font-medium">
                          Total kartu diterbitkan
                        </p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500">
                        <CreditCard className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Total Quota Ticket Issued
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {metricsSummary.quotaTicketIssued.toLocaleString("id-ID")}
                        </p>
                        <p className="text-xs text-green-500 font-medium">
                          Total kuota tiket diterbitkan
                        </p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
                        <Ticket className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Cards Summary Section */}
              {cardsSummary && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 mt-4">
                  <Card className="p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Active Cards
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {cardsSummary.activeCardsCount.toLocaleString("id-ID")}
                        </p>
                        <p className="text-xs text-purple-500 font-medium">
                          Total kartu aktif
                        </p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Quota Ticket Issued
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {cardsSummary.activeCardsQuotaIssued.toLocaleString("id-ID")}
                        </p>
                        <p className="text-xs text-indigo-500 font-medium">
                          Dari kartu aktif
                        </p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500">
                        <Ticket className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Today Sales Cards */}
      {dailySales && !loading && (
        <div className="grid gap-4 md:grid-cols-2">
          {(() => {
            // Get today's date
            const today = new Date();
            const todayDay = today.getDate();
            const todayMonth = today.toLocaleDateString("en-GB", { month: "short" }).toLowerCase();
            const todayYear = today.getFullYear();
            
            // Format: "DD MMM YYYY" (e.g., "28 dec 2025")
            const todayFormatted = `${todayDay} ${todayMonth} ${todayYear}`;

            // Find today row - single date format (not a range)
            // Match format like "28 dec 2025" (starts with day number, not "1-")
            const todayRow = dailySales.rows.find((row) => {
              const rowDate = row.tanggal.toLowerCase().trim();
              // Must start with today's day number and not be a range (doesn't start with "1-")
              return !rowDate.startsWith("1-") && 
                     rowDate.startsWith(`${todayDay} `) && 
                     rowDate.includes(todayMonth) && 
                     rowDate.includes(todayYear.toString());
            });

            // Find range to today row - format: "1-X MMM YYYY" where X is today's day
            // Example: "1-28 dec 2025"
            const rangeToTodayRow = dailySales.rows.find((row) => {
              const rowDate = row.tanggal.toLowerCase().trim();
              // Must start with "1-" and include today's day number
              return rowDate.startsWith("1-") && 
                     (rowDate.includes(`-${todayDay} `) || rowDate.includes(`-${todayDay} ${todayMonth}`)) &&
                     rowDate.includes(todayMonth) &&
                     rowDate.includes(todayYear.toString());
            });

            return (
              <>
                {/* Card: Today Sales */}
                <Card className="p-4 rounded-xl">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Penjualan Hari Ini</p>
                        <p className="text-lg font-semibold text-foreground mt-1">
                          {todayRow?.tanggal || todayFormatted}
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500">
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Card</span>
                        <span className="text-lg font-bold text-foreground">
                          {todayRow?.total.toLocaleString("id-ID") || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Revenue</span>
                        <span className="text-lg font-bold text-blue-600">
                          {todayRow?.soldPrice
                            ? new Intl.NumberFormat("id-ID", {
                                style: "currency",
                                currency: "IDR",
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(todayRow.soldPrice)
                            : "Rp0"}
                        </span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">Gold</p>
                            <p className="font-semibold">
                              {(todayRow?.gold.jaBan || 0) +
                                (todayRow?.gold.jaKa || 0) +
                                (todayRow?.gold.kaBan || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Silver</p>
                            <p className="font-semibold">
                              {(todayRow?.silver.jaBan || 0) +
                                (todayRow?.silver.jaKa || 0) +
                                (todayRow?.silver.kaBan || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">KAI</p>
                            <p className="font-semibold">{todayRow?.kai || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Card: Cumulative Sales (1 to Today) */}
                <Card className="p-4 rounded-xl">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Penjualan Kumulatif</p>
                        <p className="text-lg font-semibold text-foreground mt-1">
                          {rangeToTodayRow?.tanggal || `1-${today.getDate()} ${today.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`}
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500">
                        <Receipt className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Card</span>
                        <span className="text-lg font-bold text-foreground">
                          {rangeToTodayRow?.total.toLocaleString("id-ID") || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Revenue</span>
                        <span className="text-lg font-bold text-green-600">
                          {rangeToTodayRow?.soldPrice
                            ? new Intl.NumberFormat("id-ID", {
                                style: "currency",
                                currency: "IDR",
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(rangeToTodayRow.soldPrice)
                            : "Rp0"}
                        </span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">Gold</p>
                            <p className="font-semibold">
                              {(rangeToTodayRow?.gold.jaBan || 0) +
                                (rangeToTodayRow?.gold.jaKa || 0) +
                                (rangeToTodayRow?.gold.kaBan || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Silver</p>
                            <p className="font-semibold">
                              {(rangeToTodayRow?.silver.jaBan || 0) +
                                (rangeToTodayRow?.silver.jaKa || 0) +
                                (rangeToTodayRow?.silver.kaBan || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">KAI</p>
                            <p className="font-semibold">{rangeToTodayRow?.kai || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            );
          })()}
        </div>
      )}

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
                    {tabs.map((item) => (
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
                    ))}
                  </div>

                  {/* Table */}
                  <div className="overflow-auto rounded-lg border">
                    {loading ? (
                      <div className="p-8 text-center text-muted-foreground">
                        Loading...
                      </div>
                    ) : error ? (
                      <div className="p-8 text-center text-red-500">
                        Error: {error}
                      </div>
                    ) : (
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
                          {dailySales?.rows.map((row, i) => (
                            <tr key={i}>
                              <td className="border px-3 py-2 text-center">
                                {row.tanggal}
                              </td>
                              <td className="border px-3 py-2 text-center">
                                {row.gold.jaBan}
                              </td>
                              <td className="border px-3 py-2 text-center">
                                {row.gold.jaKa}
                              </td>
                              <td className="border px-3 py-2 text-center">
                                {row.gold.kaBan}
                              </td>
                              <td className="border px-3 py-2 text-center">
                                {row.silver.jaBan}
                              </td>
                              <td className="border px-3 py-2 text-center">
                                {row.silver.jaKa}
                              </td>
                              <td className="border px-3 py-2 text-center">
                                {row.silver.kaBan}
                              </td>
                              <td className="border px-3 py-2 text-center">
                                {row.kai}
                              </td>
                              <td className="border px-3 py-2 text-center font-semibold">
                                {row.total}
                              </td>
                            </tr>
                          ))}
                          {dailySales?.totals && (
                            <tr className="bg-muted/50 font-semibold">
                              <td className="border px-3 py-2 text-center">
                                {dailySales.totals.tanggal}
                              </td>
                              <td className="border px-3 py-2 text-center">
                                {dailySales.totals.gold.jaBan}
                              </td>
                              <td className="border px-3 py-2 text-center">
                                {dailySales.totals.gold.jaKa}
                              </td>
                              <td className="border px-3 py-2 text-center">
                                {dailySales.totals.gold.kaBan}
                              </td>
                              <td className="border px-3 py-2 text-center">
                                {dailySales.totals.silver.jaBan}
                              </td>
                              <td className="border px-3 py-2 text-center">
                                {dailySales.totals.silver.jaKa}
                              </td>
                              <td className="border px-3 py-2 text-center">
                                {dailySales.totals.silver.kaBan}
                              </td>
                              <td className="border px-3 py-2 text-center">
                                {dailySales.totals.kai}
                              </td>
                              <td className="border px-3 py-2 text-center">
                                {dailySales.totals.total}
                              </td>
                            </tr>
                          )}
                          {(!dailySales || dailySales.rows.length === 0) && (
                            <tr>
                              <td
                                colSpan={9}
                                className="border px-3 py-8 text-center text-muted-foreground"
                              >
                                No data available
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Card Issued by Type Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Card Issued by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto rounded-lg border">
                    {loading ? (
                      <div className="p-8 text-center text-muted-foreground">
                        Loading...
                      </div>
                    ) : error ? (
                      <div className="p-8 text-center text-red-500">
                        Error: {error}
                      </div>
                    ) : (
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-muted">
                          <tr>
                            <th className="border px-3 py-2 text-center">
                              No
                            </th>
                            <th className="border px-3 py-2 text-center">
                              Jenis Kartu
                            </th>
                            <th className="border px-3 py-2 text-center">
                              Total Card Issued
                            </th>
                            <th className="border px-3 py-2 text-center">
                              Percentage
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailySales?.totals ? (
                            <>
                              {(() => {
                                // Build array of card types with their counts and percentages
                                const cardTypes = [
                                  { 
                                    name: "Gold JaBan", 
                                    count: dailySales.totals.gold.jaBan,
                                    percentage: dailySales.totals.percentage?.gold.jaBan || 0
                                  },
                                  { 
                                    name: "Gold JaKa", 
                                    count: dailySales.totals.gold.jaKa,
                                    percentage: dailySales.totals.percentage?.gold.jaKa || 0
                                  },
                                  { 
                                    name: "Gold KaBan", 
                                    count: dailySales.totals.gold.kaBan,
                                    percentage: dailySales.totals.percentage?.gold.kaBan || 0
                                  },
                                  { 
                                    name: "Silver JaBan", 
                                    count: dailySales.totals.silver.jaBan,
                                    percentage: dailySales.totals.percentage?.silver.jaBan || 0
                                  },
                                  { 
                                    name: "Silver JaKa", 
                                    count: dailySales.totals.silver.jaKa,
                                    percentage: dailySales.totals.percentage?.silver.jaKa || 0
                                  },
                                  { 
                                    name: "Silver KaBan", 
                                    count: dailySales.totals.silver.kaBan,
                                    percentage: dailySales.totals.percentage?.silver.kaBan || 0
                                  },
                                  { 
                                    name: "KAI", 
                                    count: dailySales.totals.kai,
                                    percentage: dailySales.totals.percentage?.kai || 0
                                  },
                                ].filter((type) => type.count > 0); // Only show types with data

                                return (
                                  <>
                                    {cardTypes.map((type, index) => (
                                      <tr key={type.name}>
                                        <td className="border px-3 py-2 text-center">
                                          {index + 1}
                                        </td>
                                        <td className="border px-3 py-2">
                                          {type.name}
                                        </td>
                                        <td className="border px-3 py-2 text-center">
                                          {type.count.toLocaleString("id-ID")}
                                        </td>
                                        <td className="border px-3 py-2 text-center">
                                          {type.percentage.toFixed(2)}%
                                        </td>
                                      </tr>
                                    ))}
                                    {/* Grand Total */}
                                    <tr className="bg-muted/50 font-semibold">
                                      <td className="border px-3 py-2 text-center" colSpan={2}>
                                        Grand Total Card Issued
                                      </td>
                                      <td className="border px-3 py-2 text-center">
                                        {dailySales.totals.total.toLocaleString("id-ID")}
                                      </td>
                                      <td className="border px-3 py-2 text-center">
                                        {dailySales.totals.percentage?.total?.toFixed(2) || "100.00"}%
                                      </td>
                                    </tr>
                                  </>
                                );
                              })()}
                            </>
                          ) : (
                            <tr>
                              <td
                                colSpan={4}
                                className="border px-3 py-8 text-center text-muted-foreground"
                              >
                                No data available
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
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
                    data={cardsSummary ? [
                      { name: "Sudah Redeem", value: cardsSummary.redeemedTickets, color: "#22c55e" },
                      { name: "Belum Redeem", value: cardsSummary.unredeemedTickets, color: "#eab308" },
                    ] : [
                      { name: "Sudah Redeem", value: 0, color: "#22c55e" },
                      { name: "Belum Redeem", value: 0, color: "#eab308" },
                    ]}
                    legends={["Sudah Redeem", "Belum Redeem"]}
                  />

                  <TicketStatusDonut
                    title="Status Ticket"
                    data={metricsSummary ? [
                      { name: "Redeem", value: metricsSummary.redeem, color: "#22c55e" },
                      { name: "Active", value: metricsSummary.remainingActiveTickets, color: "#3b82f6" },
                      { name: "Expired", value: metricsSummary.expiredTicket, color: "#ef4444" },
                    ] : [
                      { name: "Redeem", value: 0, color: "#22c55e" },
                      { name: "Active", value: 0, color: "#3b82f6" },
                      { name: "Expired", value: 0, color: "#ef4444" },
                    ]}
                    legends={["Redeem", "Active", "Expired"]}
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
                  {loading ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Loading...
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center h-full text-red-500">
                      Error: {error}
                    </div>
                  ) : salesPerStation.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={salesPerStation.map(station => ({
                          name: station.stationName,
                          cardIssued: station.cardIssued,
                        }))}
                      >
                        <XAxis 
                          dataKey="name" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="cardIssued"
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                          name="Total Penjualan"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* GRAFIK PENJUALAN */}
              <Card>
                <CardHeader className="text-center">
                  <CardTitle>Grafik Penjualan Card (Per hari)</CardTitle>
                </CardHeader>

                <CardContent className="h-[180px]">
                  {loading ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Loading...
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center h-full text-red-500">
                      Error: {error}
                    </div>
                  ) : dailyTotals.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={dailyTotals.map(item => ({
                          date: new Date(item.date).toLocaleDateString('id-ID', { 
                            day: 'numeric', 
                            month: 'short' 
                          }),
                          total: item.total
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => [value, 'Total']}
                          labelFormatter={(label) => `Tanggal: ${label}`}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="#2563eb"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                          name="Total Penjualan"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
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
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading...
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">
                Error: {error}
              </div>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead className="bg-muted">
                  <tr>
                    <th className="border px-3 py-2 text-center align-middle">
                      Expired Date
                    </th>
                    <th className="border px-3 py-2 text-center align-middle">
                      Tiket
                    </th>
                    <th className="border px-3 py-2 text-center align-middle">
                      Jumlah
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expiredDailySales?.rows.map((row, i) => (
                    <tr key={i}>
                      <td className="border px-3 py-2 text-center">
                        {row.tanggal}
                      </td>
                      <td className="border px-3 py-2 text-center">
                        {row.expired.toLocaleString("id-ID")}
                      </td>
                      <td className="border px-3 py-2 text-center">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(row.expiredPrice)}
                      </td>
                    </tr>
                  ))}
                  {expiredDailySales?.totals && (
                    <tr className="bg-muted/50 font-semibold">
                      <td className="border px-3 py-2 text-center">
                        {expiredDailySales.totals.tanggal}
                      </td>
                      <td className="border px-3 py-2 text-center">
                        {expiredDailySales.totals.expired.toLocaleString("id-ID")}
                      </td>
                      <td className="border px-3 py-2 text-center">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(expiredDailySales.totals.expiredPrice)}
                      </td>
                    </tr>
                  )}
                  {(!expiredDailySales || expiredDailySales.rows.length === 0) && (
                    <tr>
                      <td
                        colSpan={3}
                        className="border px-3 py-8 text-center text-muted-foreground"
                      >
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
