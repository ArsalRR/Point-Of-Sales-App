import React from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  AlertTriangle,
  Calendar,
  BarChart3,
  CheckCircle,
  RefreshCw,
} from "lucide-react"
import { getDasboard } from "@/api/Dasboardapi"

const LoadingCard = () => (
  <Card className="shadow-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
    <CardHeader className="pb-3">
      <Skeleton className="h-5 w-32 bg-gray-300 dark:bg-gray-700" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-24 bg-gray-300 dark:bg-gray-700" />
      <Skeleton className="h-4 w-20 mt-2 bg-gray-300 dark:bg-gray-700" />
    </CardContent>
  </Card>
)

const LoadingChart = () => (
  <Card className="shadow-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 lg:col-span-full">
    <CardHeader className="pb-3">
      <Skeleton className="h-6 w-48 bg-gray-300 dark:bg-gray-700" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-[300px] w-full bg-gray-300 dark:bg-gray-700" />
    </CardContent>
  </Card>
)

export default function Dashboard() {
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDasboard,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })

  const {
    data: dailyRevenue,
    isLoading: isLoadingDaily,
    isRefetching: isRefetchingDaily,
  } = useQuery({
    queryKey: ["pendapatanHarian"],
    queryFn: getDasboard,
    staleTime: 0,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  })

  const formatCurrency = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)

  const formatCompactCurrency = (value) => {
    if (value >= 1000000000) {
      return `Rp${(value / 1000000000).toFixed(1)}M`
    } else if (value >= 1000000) {
      return `Rp${(value / 1000000).toFixed(1)}Jt`
    } else if (value >= 1000) {
      return `Rp${(value / 1000).toFixed(1)}K`
    }
    return formatCurrency(value)
  }

  const getMonthName = (monthNumber) => {
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
    ]
    const monthIndex = parseInt(monthNumber) - 1
    return monthNames[monthIndex] || monthNumber
  }

  const processChartData = (chartData) => {
    if (!chartData || !Array.isArray(chartData)) return []
    return chartData.map((item, index) => ({
      ...item,
      bulanName: getMonthName(item.bulan),
      originalBulan: item.bulan,
      isCurrentMonth: index === chartData.length - 1,
    }))
  }

  const calculateGrowth = (currentData) => {
    if (!currentData?.grafik || currentData.grafik.length < 2) return null
    const months = currentData.grafik
    const current = months[months.length - 1]?.total_pendapatan || 0
    const previous = months[months.length - 2]?.total_pendapatan || 0
    
    if (previous === 0) return null
    
    const growth = ((current - previous) / previous) * 100
    return {
      value: Math.round(growth * 10) / 10,
      isPositive: growth >= 0
    }
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
          <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Bulan ke-{payload[0].payload.originalBulan}
          </p>
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto p-4 md:p-6">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2 bg-gray-300 dark:bg-gray-700" />
            <Skeleton className="h-4 w-64 bg-gray-300 dark:bg-gray-700" />
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
            <LoadingChart />
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Terjadi Kesalahan
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error?.message || "Gagal memuat data dashboard"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    )
  }

  const chartData = processChartData(data?.grafik)
  const growthData = calculateGrowth(data)
  const lowStockItem = data?.stoksedikit

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Dashboard Overview
              </h1>
              <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 text-sm sm:text-base">
                <Calendar className="h-4 w-4" />
                Update terakhir: {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className="text-xs border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Auto-refresh 5s
              </Badge>
            </div>
          </div>
        </div>

        {/* Stat Cards Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
          {/* Total Produk */}
          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Total Produk
                </CardTitle>
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Package className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {data?.totalProduk || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Semua kategori produk
                  </p>
                </div>
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  Aktif
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Pendapatan Bulan Ini */}
          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Pendapatan Bulan Ini
                </CardTitle>
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                  <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCompactCurrency(data?.totalbulanan || 0)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatCurrency(data?.totalbulanan || 0)}
                  </p>
                </div>
                {growthData && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      growthData.isPositive
                        ? 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-900'
                        : 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-900'
                    }`}
                  >
                    {growthData.isPositive ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {growthData.isPositive ? '+' : ''}{growthData.value}%
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pendapatan Hari Ini */}
          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Pendapatan Hari Ini
                </CardTitle>
                <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30">
                  <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCompactCurrency(dailyRevenue?.totalPendapatanHarian || 0)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatCurrency(dailyRevenue?.totalPendapatanHarian || 0)}
                    </p>
                    {isRefetchingDaily && (
                      <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                    )}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900"
                >
                  Live
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Status Stok */}
          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Status Stok
                </CardTitle>
                <div className={`p-2 rounded-lg ${
                  lowStockItem 
                    ? 'bg-amber-50 dark:bg-amber-900/30' 
                    : 'bg-green-50 dark:bg-green-900/30'
                }`}>
                  {lowStockItem ? (
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {lowStockItem ? (
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {lowStockItem.nama_barang}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {lowStockItem.stok}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Sisa stok ({lowStockItem.satuan_barang})
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900"
                    >
                      Perlu Restok
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    0
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Produk stok menipis
                  </p>
                  <Badge
                    variant="outline"
                    className="text-xs text-green-600 dark:text-green-400 border-green-200 dark:border-green-900"
                  >
                    Semua aman
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Grafik Pendapatan */}
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-shadow mb-6 sm:mb-8">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <BarChart3 className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    Tren Pendapatan 6 Bulan Terakhir
                  </CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Perkembangan pendapatan bulanan
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className="text-xs border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                >
                  {chartData.length} bulan
                </Badge>
                {growthData && (
                  <Badge 
                    variant="outline"
                    className={`text-xs ${
                      growthData.isPositive
                        ? 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-900'
                        : 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-900'
                    }`}
                  >
                    {growthData.isPositive ? '+' : ''}{growthData.value}% growth
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] sm:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#e5e7eb"
                    strokeOpacity={0.3}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="bulanName"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickMargin={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickFormatter={(value) => formatCompactCurrency(value)}
                    width={60}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                  />
                  <Bar 
                    dataKey="total_pendapatan" 
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        className="transition-all duration-300 hover:opacity-80"
                        fill={entry.isCurrentMonth 
                          ? '#3b82f6' // Blue for current month
                          : index % 2 === 0 
                            ? '#4b5563' // Dark gray for even months
                            : '#6b7280' // Light gray for odd months
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-blue-500"></div>
                  <span>Bulan Berjalan</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-gray-600"></div>
                  <span>Bulan Sebelumnya</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-gray-400"></div>
                  <span>Bulan Lainnya</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informasi Tambahan */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Informasi Performa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Rata-rata Pendapatan/Bulan</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCompactCurrency(
                    chartData.reduce((acc, curr) => acc + (curr.total_pendapatan || 0), 0) / chartData.length || 0
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Bulan Terbaik</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {chartData.length > 0 
                    ? chartData.reduce((max, curr) => 
                        curr.total_pendapatan > max.total_pendapatan ? curr : max
                      ).bulanName
                    : '-'
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Pendapatan 6 Bulan</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCompactCurrency(
                    chartData.reduce((acc, curr) => acc + (curr.total_pendapatan || 0), 0)
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Status Update
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${
                    isLoadingDaily ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Pendapatan Harian</span>
                </div>
                <Badge 
                  variant="outline" 
                  className="text-xs border-gray-300 dark:border-gray-700"
                >
                  {isLoadingDaily ? 'Memuat...' : 'Live'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Data Dashboard</span>
                </div>
                <Badge 
                  variant="outline" 
                  className="text-xs border-gray-300 dark:border-gray-700"
                >
                  Updated
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${
                    lowStockItem ? 'bg-amber-500' : 'bg-green-500'
                  }`}></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Monitoring Stok</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    lowStockItem 
                      ? 'border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400'
                      : 'border-gray-300 dark:border-gray-700'
                  }`}
                >
                  {lowStockItem ? 'Perhatian' : 'Normal'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}