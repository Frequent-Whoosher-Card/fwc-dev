<<<<<<< HEAD
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Users, Receipt, XCircle, AlertCircle } from 'lucide-react';
import TicketStatusDonut from './chart/ticket-status-donut';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import { API_BASE_URL } from '@/lib/apiConfig';

/* ======================
   TYPES
====================== */
type StationValue = {
  jaBan: number;
  jaKa: number;
  kaBan: number;
};

type SalesRow = {
  tanggal: string;
  gold: StationValue;
  silver: StationValue;
  kai: number;
  total: number;
  soldPrice: number;
};

type DailySalesResponse = {
  success: boolean;
  message?: string;
  data?: {
    rows: SalesRow[];
    totals: SalesRow;
  };
  error?: {
    code?: string;
  };
};

type StationSalesRow = {
  stationName: string;
  gold: number;
  silver: number;
  kai: number;
};

/* ======================
   STATS CONFIG
====================== */
const statsConfig = [
  { title: 'Card Issues', icon: CreditCard, iconBg: 'bg-blue-500' },
  { title: 'Ticket Issued', icon: Users, iconBg: 'bg-green-500' },
  { title: 'Ticket Redeemed', icon: Receipt, iconBg: 'bg-red-500' },
  { title: 'Expired Ticket', icon: XCircle, iconBg: 'bg-red-500' },
  { title: 'Remaining Ticket', icon: AlertCircle, iconBg: 'bg-orange-500' },
];

export function DashboardContent() {
  /* ======================
     STATE
  ====================== */
  const [rows, setRows] = useState<SalesRow[]>([]);
  const [total, setTotal] = useState<SalesRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /* ======================
     FETCH DASHBOARD (LOGIN STYLE)
  ====================== */
  const fetchDailySales = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const token = localStorage.getItem('fwc_token');
      if (!token) throw new Error('No auth token');

      const res = await fetch(`${API_BASE_URL}/sales/daily-grouped?startDate=2025-01-01&endDate=2025-01-31&stationId=`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const json: DailySalesResponse = await res.json();

      if (!res.ok || !json.success) {
        setErrorMessage('Gagal mengambil data dashboard.');
        return;
      }

      setRows(json.data!.rows);
      setTotal(json.data!.totals);
    } catch (err) {
      console.error('Dashboard error:', err);
      setErrorMessage('Terjadi gangguan sistem. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDailySales();
  }, []);

  const [stationData, setStationData] = useState<StationSalesRow[]>([]);
  const [stationLoading, setStationLoading] = useState(false);

  // Fungsi fetch harus dideklarasikan **sebelum dipakai**
  const fetchStationSales = async () => {
    setStationLoading(true);

    try {
      const token = localStorage.getItem('fwc_token');
      if (!token) throw new Error('No auth token');

      const res = await fetch(`${API_BASE_URL}/sales/per-station?startDate=&endDate=`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch station sales');

      const json = await res.json();
      setStationData(json.data ?? []);
    } catch (err) {
      console.error('Station sales error:', err);
    } finally {
      setStationLoading(false);
    }
  };

  /* ======================
     CHART DATA
  ====================== */
  const barChartData = useMemo(
    () =>
      rows.map((r) => ({
        name: r.tanggal,
        gold: r.gold.jaBan + r.gold.jaKa + r.gold.kaBan,
        silver: r.silver.jaBan + r.silver.jaKa + r.silver.kaBan,
        kai: r.kai,
      })),
    [rows]
  );

  /* ======================
     RENDER
  ====================== */
  return (
    <div className="space-y-6">
      <p className="mb-4 text-xs italic text-muted-foreground">Last update: December 2025</p>

      {/* ======================
          STATS
      ====================== */}
      <Card>
        <CardContent className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-5">
          {statsConfig.map((stat) => (
            <Card key={stat.title} className="p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{total?.total ?? '-'}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${stat.iconBg}`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* ======================
          LOADING / ERROR
      ====================== */}
      {isLoading && <div className="text-center text-sm text-muted-foreground">Loading dashboard...</div>}
      {errorMessage && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{errorMessage}</div>}

      {/* ======================
          MAIN CONTENT
      ====================== */}
      {!isLoading && !errorMessage && (
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Penjualan & Ticket</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT */}
              <div className="lg:col-span-2 space-y-6">
                {/* TABLE */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tabel Penjualan Card Harian</CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="overflow-auto rounded-lg border">
                      <table className="w-full border-collapse text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th rowSpan={2} className="border px-3 py-2">
                              Tanggal
                            </th>
                            <th colSpan={3} className="border px-3 py-2">
                              GOLD
                            </th>
                            <th colSpan={3} className="border px-3 py-2">
                              SILVER
                            </th>
                            <th rowSpan={2} className="border px-3 py-2">
                              KAI
                            </th>
                            <th rowSpan={2} className="border px-3 py-2">
                              Total
                            </th>
                          </tr>
                          <tr>
                            {['JaBan', 'JaKa', 'KaBan', 'JaBan', 'JaKa', 'KaBan'].map((h, i) => (
                              <th key={i} className="border px-3 py-2">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row, i) => (
                            <tr key={i}>
                              <td className="border px-3 py-2">{row.tanggal}</td>
                              <td className="border px-3 py-2 text-center">{row.gold.jaBan}</td>
                              <td className="border px-3 py-2 text-center">{row.gold.jaKa}</td>
                              <td className="border px-3 py-2 text-center">{row.gold.kaBan}</td>
                              <td className="border px-3 py-2 text-center">{row.silver.jaBan}</td>
                              <td className="border px-3 py-2 text-center">{row.silver.jaKa}</td>
                              <td className="border px-3 py-2 text-center">{row.silver.kaBan}</td>
                              <td className="border px-3 py-2 text-center">{row.kai}</td>
                              <td className="border px-3 py-2 text-center font-semibold">{row.total}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* DONUT */}
                <Card>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <TicketStatusDonut
                      title="Card In/Out"
                      data={[
                        { name: 'In', value: 40, color: '#94a3b8' },
                        { name: 'Out', value: 60, color: '#2563eb' },
                      ]}
                      legends={['In (belum terjual)', 'Out (sudah terjual)']}
                    />

                    <TicketStatusDonut
                      title="Status Card"
                      data={[
                        { name: 'Redeem', value: 70, color: '#22c55e' },
                        { name: 'Belum Redeem', value: 30, color: '#eab308' },
                      ]}
                      legends={['Sudah Redeem', 'Belum Redeem']}
                    />

                    <TicketStatusDonut
                      title="Status Ticket"
                      data={[
                        { name: 'Active', value: 50, color: '#22c55e' },
                        { name: 'Redeemed', value: 30, color: '#3b82f6' },
                        { name: 'Expired', value: 20, color: '#ef4444' },
                      ]}
                      legends={['Active', 'Redeemed', 'Expired']}
                    />
                  </div>
                </Card>
              </div>

              {/* RIGHT */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Grafik Penjualan (Per Hari)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={barChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line dataKey="gold" stroke="#facc15" />
                        <Line dataKey="silver" stroke="#94a3b8" />
                        <Line dataKey="kai" stroke="#22c55e" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Grafik Penjualan (Per Stasiun)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stationData}>
                        <XAxis dataKey="stationName" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="gold" fill="#facc15" />
                        <Bar dataKey="silver" fill="#94a3b8" />
                        <Bar dataKey="kai" fill="#22c55e" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card className="col-span-3">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-base sm:text-lg">Daftar Ticket Expired</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  {/* Wrapper responsive */}
                  <div className="relative w-full p-4 overflow-x-auto">
                    <div className="min-w-200 rounded-lg border">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-gray-300 text-black">
                            <th className="border px-3 py-2 text-center font-medium sm:px-4">Expired Date</th>
                            <th className="border px-3 py-2 text-center font-medium sm:px-4">Card Category</th>
                            <th className="border px-3 py-2 text-center font-medium sm:px-4">Card Type</th>
                            <th className="border px-3 py-2 text-center font-medium sm:px-4">Ticket</th>
                            <th className="border px-3 py-2 text-center font-medium sm:px-4">Jumlah</th>
                          </tr>
                        </thead>

                        <tbody>
                          {[...Array(5)].map((_, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="border px-3 py-3 text-center sm:px-4">&nbsp;</td>
                              <td className="border px-3 py-3 text-center sm:px-4">&nbsp;</td>
                              <td className="border px-3 py-3 text-center sm:px-4">&nbsp;</td>
                              <td className="border px-3 py-3 text-center sm:px-4">&nbsp;</td>
                              <td className="border px-3 py-3 text-center sm:px-4">&nbsp;</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
=======
// 'use client';

// import { useEffect, useMemo, useState } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { CreditCard, Users, Receipt, XCircle, AlertCircle } from 'lucide-react';
// import TicketStatusDonut from './chart/ticket-status-donut';
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid } from 'recharts';
// import { API_BASE_URL } from '@/lib/apiConfig';

// /* ======================
//    TYPES
// ====================== */
// type StationValue = {
//   jaBan: number;
//   jaKa: number;
//   kaBan: number;
// };

// type SalesRow = {
//   tanggal: string;
//   gold: StationValue;
//   silver: StationValue;
//   kai: number;
//   total: number;
//   soldPrice: number;
// };

// type DailySalesResponse = {
//   success: boolean;
//   message?: string;
//   data?: {
//     rows: SalesRow[];
//     totals: SalesRow;
//   };
//   error?: {
//     code?: string;
//   };
// };

// type StationSalesRow = {
//   stationName: string;
//   gold: number;
//   silver: number;
//   kai: number;
// };

// /* ======================
//    STATS CONFIG
// ====================== */
// const statsConfig = [
//   { title: 'Card Issues', icon: CreditCard, iconBg: 'bg-blue-500' },
//   { title: 'Ticket Issued', icon: Users, iconBg: 'bg-green-500' },
//   { title: 'Ticket Redeemed', icon: Receipt, iconBg: 'bg-red-500' },
//   { title: 'Expired Ticket', icon: XCircle, iconBg: 'bg-red-500' },
//   { title: 'Remaining Ticket', icon: AlertCircle, iconBg: 'bg-orange-500' },
// ];

// export function DashboardContent() {
//   /* ======================
//      STATE
//   ====================== */
//   const [rows, setRows] = useState<SalesRow[]>([]);
//   const [total, setTotal] = useState<SalesRow | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [errorMessage, setErrorMessage] = useState<string | null>(null);

//   /* ======================
//      FETCH DASHBOARD (LOGIN STYLE)
//   ====================== */
//   const fetchDailySales = async () => {
//     setIsLoading(true);
//     setErrorMessage(null);

//     try {
//       const token = localStorage.getItem('fwc_token');
//       if (!token) throw new Error('No auth token');

//       const res = await fetch(`${API_BASE_URL}/sales/daily-grouped?startDate=2025-01-01&endDate=2025-01-31&stationId=`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       const json: DailySalesResponse = await res.json();

//       if (!res.ok || !json.success) {
//         setErrorMessage('Gagal mengambil data dashboard.');
//         return;
//       }

//       setRows(json.data!.rows);
//       setTotal(json.data!.totals);
//     } catch (err) {
//       console.error('Dashboard error:', err);
//       setErrorMessage('Terjadi gangguan sistem. Silakan coba lagi.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDailySales();
//   }, []);

//   const [stationData, setStationData] = useState<StationSalesRow[]>([]);
//   const [stationLoading, setStationLoading] = useState(false);

//   // Fungsi fetch harus dideklarasikan **sebelum dipakai**
//   const fetchStationSales = async () => {
//     setStationLoading(true);

//     try {
//       const token = localStorage.getItem('fwc_token');
//       if (!token) throw new Error('No auth token');

//       const res = await fetch(`${API_BASE_URL}/sales/per-station?startDate=&endDate=`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!res.ok) throw new Error('Failed to fetch station sales');

//       const json = await res.json();
//       setStationData(json.data ?? []);
//     } catch (err) {
//       console.error('Station sales error:', err);
//     } finally {
//       setStationLoading(false);
//     }
//   };

//   /* ======================
//      CHART DATA
//   ====================== */
//   const barChartData = useMemo(
//     () =>
//       rows.map((r) => ({
//         name: r.tanggal,
//         gold: r.gold.jaBan + r.gold.jaKa + r.gold.kaBan,
//         silver: r.silver.jaBan + r.silver.jaKa + r.silver.kaBan,
//         kai: r.kai,
//       })),
//     [rows]
//   );

//   /* ======================
//      RENDER
//   ====================== */
//   return (
//     <div className="space-y-6">
//       <p className="mb-4 text-xs italic text-muted-foreground">Last update: December 2025</p>

//       {/* ======================
//           STATS
//       ====================== */}
//       <Card>
//         <CardContent className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-5">
//           {statsConfig.map((stat) => (
//             <Card key={stat.title} className="p-4 rounded-xl">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-muted-foreground">{stat.title}</p>
//                   <p className="text-2xl font-bold">{total?.total ?? '-'}</p>
//                 </div>
//                 <div className={`flex h-10 w-10 items-center justify-center rounded-full ${stat.iconBg}`}>
//                   <stat.icon className="h-5 w-5 text-white" />
//                 </div>
//               </div>
//             </Card>
//           ))}
//         </CardContent>
//       </Card>

//       {/* ======================
//           LOADING / ERROR
//       ====================== */}
//       {isLoading && <div className="text-center text-sm text-muted-foreground">Loading dashboard...</div>}
//       {errorMessage && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{errorMessage}</div>}

//       {/* ======================
//           MAIN CONTENT
//       ====================== */}
//       {!isLoading && !errorMessage && (
//         <Card>
//           <CardHeader>
//             <CardTitle>Dashboard Penjualan & Ticket</CardTitle>
//           </CardHeader>

//           <CardContent>
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//               {/* LEFT */}
//               <div className="lg:col-span-2 space-y-6">
//                 {/* TABLE */}
//                 <Card>
//                   <CardHeader>
//                     <CardTitle>Tabel Penjualan Card Harian</CardTitle>
//                   </CardHeader>

//                   <CardContent>
//                     <div className="overflow-auto rounded-lg border">
//                       <table className="w-full border-collapse text-sm">
//                         <thead className="bg-muted">
//                           <tr>
//                             <th rowSpan={2} className="border px-3 py-2">
//                               Tanggal
//                             </th>
//                             <th colSpan={3} className="border px-3 py-2">
//                               GOLD
//                             </th>
//                             <th colSpan={3} className="border px-3 py-2">
//                               SILVER
//                             </th>
//                             <th rowSpan={2} className="border px-3 py-2">
//                               KAI
//                             </th>
//                             <th rowSpan={2} className="border px-3 py-2">
//                               Total
//                             </th>
//                           </tr>
//                           <tr>
//                             {['JaBan', 'JaKa', 'KaBan', 'JaBan', 'JaKa', 'KaBan'].map((h, i) => (
//                               <th key={i} className="border px-3 py-2">
//                                 {h}
//                               </th>
//                             ))}
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {rows.map((row, i) => (
//                             <tr key={i}>
//                               <td className="border px-3 py-2">{row.tanggal}</td>
//                               <td className="border px-3 py-2 text-center">{row.gold.jaBan}</td>
//                               <td className="border px-3 py-2 text-center">{row.gold.jaKa}</td>
//                               <td className="border px-3 py-2 text-center">{row.gold.kaBan}</td>
//                               <td className="border px-3 py-2 text-center">{row.silver.jaBan}</td>
//                               <td className="border px-3 py-2 text-center">{row.silver.jaKa}</td>
//                               <td className="border px-3 py-2 text-center">{row.silver.kaBan}</td>
//                               <td className="border px-3 py-2 text-center">{row.kai}</td>
//                               <td className="border px-3 py-2 text-center font-semibold">{row.total}</td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   </CardContent>
//                 </Card>

//                 {/* DONUT */}
//                 <Card>
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                     <TicketStatusDonut
//                       title="Card In/Out"
//                       data={[
//                         { name: 'In', value: 40, color: '#94a3b8' },
//                         { name: 'Out', value: 60, color: '#2563eb' },
//                       ]}
//                       legends={['In (belum terjual)', 'Out (sudah terjual)']}
//                     />

//                     <TicketStatusDonut
//                       title="Status Card"
//                       data={[
//                         { name: 'Redeem', value: 70, color: '#22c55e' },
//                         { name: 'Belum Redeem', value: 30, color: '#eab308' },
//                       ]}
//                       legends={['Sudah Redeem', 'Belum Redeem']}
//                     />

//                     <TicketStatusDonut
//                       title="Status Ticket"
//                       data={[
//                         { name: 'Active', value: 50, color: '#22c55e' },
//                         { name: 'Redeemed', value: 30, color: '#3b82f6' },
//                         { name: 'Expired', value: 20, color: '#ef4444' },
//                       ]}
//                       legends={['Active', 'Redeemed', 'Expired']}
//                     />
//                   </div>
//                 </Card>
//               </div>

//               {/* RIGHT */}
//               <div className="space-y-6">
//                 <Card>
//                   <CardHeader>
//                     <CardTitle>Grafik Penjualan (Per Hari)</CardTitle>
//                   </CardHeader>
//                   <CardContent className="h-[200px]">
//                     <ResponsiveContainer width="100%" height="100%">
//                       <LineChart data={barChartData}>
//                         <CartesianGrid strokeDasharray="3 3" />
//                         <XAxis dataKey="name" />
//                         <YAxis />
//                         <Tooltip />
//                         <Legend />
//                         <Line dataKey="gold" stroke="#facc15" />
//                         <Line dataKey="silver" stroke="#94a3b8" />
//                         <Line dataKey="kai" stroke="#22c55e" />
//                       </LineChart>
//                     </ResponsiveContainer>
//                   </CardContent>
//                 </Card>

//                 <Card>
//                   <CardHeader>
//                     <CardTitle>Grafik Penjualan (Per Stasiun)</CardTitle>
//                   </CardHeader>
//                   <CardContent className="h-[220px]">
//                     <ResponsiveContainer width="100%" height="100%">
//                       <BarChart data={stationData}>
//                         <XAxis dataKey="stationName" />
//                         <YAxis />
//                         <Tooltip />
//                         <Legend />
//                         <Bar dataKey="gold" fill="#facc15" />
//                         <Bar dataKey="silver" fill="#94a3b8" />
//                         <Bar dataKey="kai" fill="#22c55e" />
//                       </BarChart>
//                     </ResponsiveContainer>
//                   </CardContent>
//                 </Card>
//               </div>

//               <Card className="col-span-3">
//                 <CardHeader className="px-4 sm:px-6">
//                   <CardTitle className="text-base sm:text-lg">Daftar Ticket Expired</CardTitle>
//                 </CardHeader>
//                 <CardContent className="px-0">
//                   {/* Wrapper responsive */}
//                   <div className="relative w-full p-4 overflow-x-auto">
//                     <div className="min-w-200 rounded-lg border">
//                       <table className="w-full border-collapse text-sm">
//                         <thead>
//                           <tr className="bg-gray-300 text-black">
//                             <th className="border px-3 py-2 text-center font-medium sm:px-4">Expired Date</th>
//                             <th className="border px-3 py-2 text-center font-medium sm:px-4">Card Category</th>
//                             <th className="border px-3 py-2 text-center font-medium sm:px-4">Card Type</th>
//                             <th className="border px-3 py-2 text-center font-medium sm:px-4">Ticket</th>
//                             <th className="border px-3 py-2 text-center font-medium sm:px-4">Jumlah</th>
//                           </tr>
//                         </thead>

//                         <tbody>
//                           {[...Array(5)].map((_, i) => (
//                             <tr key={i} className="hover:bg-gray-50">
//                               <td className="border px-3 py-3 text-center sm:px-4">&nbsp;</td>
//                               <td className="border px-3 py-3 text-center sm:px-4">&nbsp;</td>
//                               <td className="border px-3 py-3 text-center sm:px-4">&nbsp;</td>
//                               <td className="border px-3 py-3 text-center sm:px-4">&nbsp;</td>
//                               <td className="border px-3 py-3 text-center sm:px-4">&nbsp;</td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// }

'use client';
import { useEffect, useState } from 'react';

export default function DashboardContent() {
  const [src, setSrc] = useState('');

  useEffect(() => {
    fetch('/api/superset/guest-token?dashboardId=1138237b-ff01-4ad9-be19-a576acdfb8ae')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSrc(
            `https://superset.fwc-kcic.me/superset/dashboard/p/v2YGXxyGXNL/?standalone=1&guest_token=${data.token}`
          );
        } else {
          throw new Error(data.message);
        }
      })
      .catch(err => {
        console.error("Failed load dashboard:", err);
      });
  }, []);

  if (!src) return <div>Loading dashboard...</div>;

  return (
    <iframe
      src={src}
      className="w-full h-[calc(100vh-64px)]"
      style={{ border: 'none' }}
    />
  );
}

>>>>>>> da9ad286010c29f3d8e17c72ef368bf0864559eb
