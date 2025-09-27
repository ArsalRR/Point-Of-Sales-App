import React from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { TrendingUp, Package, DollarSign, AlertTriangle, Calendar } from "lucide-react"
import { getDasboard } from "@/api/Dasboardapi"
const LoadingCard = () => (
  <Card className="shadow-sm border border-slate-200 bg-white/50 backdrop-blur-sm">
    <CardHeader className="pb-3">
      <Skeleton className="h-5 w-32" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-24" />
    </CardContent>
  </Card>
)

const LoadingChart = () => (
  <Card className="shadow-sm border border-slate-200 bg-white/50 backdrop-blur-sm lg:col-span-full">
    <CardHeader className="pb-3">
      <Skeleton className="h-6 w-48" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-[300px] w-full" />
    </CardContent>
  </Card>
)

export default function Dashboard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDasboard,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })

  const formatCurrency = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value)

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-blue-600">
            Pendapatan: {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto p-6">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
            <LoadingChart />
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Ringkasan bisnis Anda hari ini
          </p>
        </div>

        {/* Grid Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Total Produk */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-blue-50 hover:from-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
                Total Produk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{data.totalProduk}</p>
              <Badge variant="secondary" className="text-xs">
                Semua kategori
              </Badge>
            </CardContent>
          </Card>

          {/* Pendapatan Bulanan */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-green-50 hover:from-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <div className="p-2 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                Pendapatan Bulan Ini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(data.totalbulanan)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                  +12.5% vs bulan lalu
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Laporan Harian */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-purple-50 hover:from-purple-100">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <div className="p-2 rounded-lg bg-purple-100 group-hover:bg-purple-200 transition-colors">
                  <Calendar className="h-4 w-4 text-purple-600" />
                </div>
                Pendapatan Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(data.totalPendapatanHarian)}
              </p>
              <Badge variant="outline" className="text-xs text-purple-600 border-purple-200">
                Update real-time
              </Badge>
            </CardContent>
          </Card>

          {/* Stok Sedikit */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-amber-50 hover:from-amber-100">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <div className="p-2 rounded-lg bg-amber-100 group-hover:bg-amber-200 transition-colors">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
                Stok Menipis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.stoksedikit ? (
                <div>
                  <p className="font-semibold text-gray-900 text-lg">
                    {data.stoksedikit.nama_barang}
                  </p>
                  <p className="text-amber-600 font-medium">
                    Sisa: {data.stoksedikit.stok} {data.stoksedikit.satuan_barang}
                  </p>
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 mt-2">
                    Perlu restok segera
                  </Badge>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">Semua produk stok aman</p>
                  <Badge variant="outline" className="text-xs text-green-600 border-green-200 mt-2">
                    Stok terkendali
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Grafik Pendapatan */}
          <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-white lg:col-span-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
                  <div className="p-2 rounded-lg bg-indigo-100">
                    <BarChart className="h-5 w-5 text-indigo-600" />
                  </div>
                  Tren Pendapatan Bulanan
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  6 bulan terakhir
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.grafik} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <XAxis
                    dataKey="bulan"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickFormatter={(value) => `${value / 1000000}M`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total_pendapatan" radius={[8, 8, 0, 0]}>
                    {data.grafik.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`hsl(${220 + index * 10}, 70%, ${55 - index * 2}%)`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
