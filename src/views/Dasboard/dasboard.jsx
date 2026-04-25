import React from "react"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid,
} from "recharts"
import { getDasboard } from "@/api/Dasboardapi"
const toNumber = (val) => {
  if (!val) return 0
  return Number(String(val).replace(/[^\d.-]/g, "")) || 0
}

const formatCurrency = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(toNumber(value))

const formatCompact = (value) => {
  const n = toNumber(value)
  const fmt = (v) => (Number.isInteger(v) ? v : v.toFixed(1))
  if (n >= 1_000_000_000_000) return `Rp ${fmt(n / 1_000_000_000_000)} T`
  if (n >= 1_000_000_000)     return `Rp ${fmt(n / 1_000_000_000)} M`
  if (n >= 1_000_000)         return `Rp ${fmt(n / 1_000_000)} Jt`
  if (n >= 1_000)             return `Rp ${fmt(n / 1_000)} Rb`
  return `Rp ${n}`
}

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"]
const getMonthName = (m) => MONTHS[(Number(m) - 1)] ?? "-"

const processChartData = (chartData) => {
  if (!Array.isArray(chartData)) return []
  return chartData.map((item, index) => ({
    ...item,
    total_pendapatan: toNumber(item.total_pendapatan),
    bulanName: getMonthName(item.bulan),
    originalBulan: item.bulan ?? null,
    isCurrentMonth: index === chartData.length - 1,
  }))
}

const calculateGrowth = (data) => {
  const grafik = data?.grafik
  if (!Array.isArray(grafik) || grafik.length < 2) return null
  const curr = toNumber(grafik[grafik.length - 1]?.total_pendapatan)
  const prev = toNumber(grafik[grafik.length - 2]?.total_pendapatan)
  if (prev === 0) return null
  const growth = ((curr - prev) / prev) * 100
  return { value: Math.round(growth * 10) / 10, isPositive: growth >= 0 }
}
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-md">
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">
        {formatCurrency(payload[0]?.value ?? 0)}
      </p>
    </div>
  )
}
function StatCard({ label, value, sub, tag, tagColor = "gray", live = false, spinning = false }) {
  const tagColors = {
    gray:  "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    red:   "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    blue:  "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  }

  return (
    <div className="
      bg-white dark:bg-gray-900
      border border-gray-200 dark:border-gray-800
      rounded-2xl p-6
      shadow-[0_2px_12px_rgba(0,0,0,0.06)]
      hover:shadow-[0_6px_24px_rgba(0,0,0,0.10)]
      transition-shadow duration-200
    ">
      <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.12em] mb-4">
        {label}
      </p>
      <p className="text-3xl xl:text-4xl font-bold text-gray-900 dark:text-white leading-none mb-3 tabular-nums">
        {value}
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        {sub && (
          <span className="text-xs text-gray-400 dark:text-gray-500 truncate">{sub}</span>
        )}
        {tag && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${tagColors[tagColor]}`}>
            {tag}
          </span>
        )}
        {live && (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-blue-500 dark:text-blue-400 shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full bg-blue-500 ${spinning ? "animate-ping" : "animate-pulse"}`} />
            Live
          </span>
        )}
      </div>
    </div>
  )
}
function LoadingState() {
  return (
    <div className="min-h-screen bg-[#f5f5f6] dark:bg-gray-950 p-5 md:p-8">
      <div className="max-w-screen-xl mx-auto">
        <Skeleton className="h-8 w-36 mb-1 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        <Skeleton className="h-4 w-52 mb-10 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl bg-gray-200 dark:bg-gray-800 mb-4" />
        <Skeleton className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-800" />
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDasboard,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })

  const { data: dailyRevenue, isRefetching: isRefetchingDaily } = useQuery({
    queryKey: ["pendapatanHarian"],
    queryFn: getDasboard,
    staleTime: 0,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  })

  if (isLoading) return <LoadingState />

  if (isError) {
    return (
      <div className="min-h-screen bg-[#f5f5f6] dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">⚠️</p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Gagal memuat data</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            {error?.message ?? "Terjadi kesalahan saat mengambil data dashboard."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:opacity-90 transition-opacity"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    )
  }

  const chartData         = processChartData(data?.grafik)
  const growthData        = calculateGrowth(data)
  const lowStockItem      = data?.stoksedikit
  const pendapatanBulanan = toNumber(data?.totalbulanan)
  const pendapatanBersih  = pendapatanBulanan * 0.1
  const totalChart        = chartData.reduce((acc, c) => acc + (c.total_pendapatan || 0), 0)
  const avgChart          = chartData.length > 0 ? totalChart / chartData.length : 0
  const bestMonth         = chartData.length > 0
    ? chartData.reduce((max, c) => c.total_pendapatan > max.total_pendapatan ? c : max).bulanName
    : "-"

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })

  const cardCls = `
    bg-white dark:bg-gray-900
    border border-gray-200 dark:border-gray-800
    rounded-2xl
    shadow-[0_2px_12px_rgba(0,0,0,0.06)]
    hover:shadow-[0_6px_24px_rgba(0,0,0,0.10)]
    transition-shadow duration-200
  `

  return (
    <div className="min-h-screen bg-[#f5f5f6] dark:bg-gray-950">
      <div className="max-w-screen-xl mx-auto p-5 md:p-8">

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
              Dashboard
            </h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 capitalize">{today}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 pb-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Data diperbarui setiap 5 detik
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
          <StatCard
            label="Total Produk"
            value={data?.totalProduk ?? 0}
            sub="Semua kategori"
            tag="Aktif"
            tagColor="gray"
          />
          <StatCard
            label="Pendapatan Bulan Ini"
            value={formatCompact(pendapatanBulanan)}
            sub={formatCurrency(pendapatanBulanan)}
            tag={growthData ? `${growthData.isPositive ? "+" : ""}${growthData.value}% vs bulan lalu` : undefined}
            tagColor={growthData?.isPositive ? "green" : "red"}
          />
          <StatCard
            label="Pendapatan Hari Ini"
            value={formatCompact(dailyRevenue?.totalPendapatanHarian ?? 0)}
            sub={formatCurrency(dailyRevenue?.totalPendapatanHarian ?? 0)}
            live
            spinning={isRefetchingDaily}
          />
          <StatCard
            label="Status Stok"
            value={lowStockItem ? lowStockItem.stok : "Aman"}
            sub={
              lowStockItem
                ? `${lowStockItem.nama_barang}`
                : "Tidak ada stok menipis"
            }
            tag={lowStockItem ? "Perlu Restok" : "Semua Aman"}
            tagColor={lowStockItem ? "amber" : "green"}
          />
        </div>

        {/* Chart */}
        <div className={`${cardCls} p-6 mb-5`}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.12em] mb-1">
                Tren Pendapatan
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                6 Bulan Terakhir
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                {chartData.length} bulan
              </span>
              {growthData && (
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
                  growthData.isPositive
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                }`}>
                  {growthData.isPositive ? "▲" : "▼"} {Math.abs(growthData.value)}%
                </span>
              )}
            </div>
          </div>

          <div className="h-[300px] md:h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" strokeOpacity={0.6} vertical={false} />
                <XAxis
                  dataKey="bulanName"
                  axisLine={false} tickLine={false}
                  tick={{ fontSize: 12, fill: "#9ca3af" }} tickMargin={10}
                />
                <YAxis
                  axisLine={false} tickLine={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickFormatter={(v) => formatCompact(v)}
                  width={76}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                <Bar dataKey="total_pendapatan" radius={[5, 5, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isCurrentMonth ? "#111827" : "#d1d5db"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center gap-6 mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              <span className="w-3 h-3 rounded-sm bg-gray-900 dark:bg-white inline-block" />
              Bulan berjalan
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              <span className="w-3 h-3 rounded-sm bg-gray-300 dark:bg-gray-600 inline-block" />
              Bulan sebelumnya
            </div>
          </div>
        </div>
        <div className={`${cardCls} p-6`}>
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.12em] mb-6">
            Ringkasan Performa
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 xl:gap-0 xl:divide-x divide-gray-100 dark:divide-gray-800">
            {[
              { label: "Rata-rata / Bulan",       value: formatCurrency(avgChart) },
              { label: "Bulan Terbaik",            value: bestMonth },
              { label: "Total 6 Bulan",            value: formatCurrency(totalChart) },
              { label: "Est. Bersih (10% margin)", value: formatCurrency(pendapatanBersih) },
            ].map(({ label, value }) => (
              <div key={label} className="xl:px-6 xl:first:pl-0 xl:last:pr-0 flex flex-col gap-1.5">
                <span className="text-xs text-gray-400 dark:text-gray-500">{label}</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}