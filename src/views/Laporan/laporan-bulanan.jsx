import { useEffect, useState } from "react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  CalendarDays, TrendingUp, DollarSign, FileText,
  Search, X, AlertCircle, Smartphone, Package2
} from "lucide-react"
import { getlaporanbulanan } from "@/api/Laporanapi"
import dayjs from "dayjs"
import "dayjs/locale/id"

dayjs.locale('id')

// ─── Skeleton ────────────────────────────────────────────────────────────────
function SkeletonLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 space-y-6">

        {/* Header skeleton */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-7 w-72 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>

        {/* Filter card skeleton */}
        <Card className="shadow border border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <div className="h-5 w-36 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-10 w-full bg-gray-100 rounded-md animate-pulse" />
                </div>
              ))}
              <div className="flex items-end">
                <div className="h-10 w-full bg-gray-800/10 rounded-md animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="border border-gray-200 shadow-sm">
              <CardContent className="pt-6 text-center space-y-2">
                <div className="h-8 w-8 bg-gray-200 rounded-full mx-auto animate-pulse" />
                <div className="h-3 w-28 bg-gray-100 rounded mx-auto animate-pulse" />
                <div className="h-7 w-36 bg-gray-200 rounded mx-auto animate-pulse" />
                <div className="h-3 w-12 bg-gray-100 rounded mx-auto animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desktop table skeleton */}
        <Card className="hidden md:block shadow border border-gray-200">
          <CardContent className="p-0">
            <div className="bg-gray-50 px-4 py-3 flex gap-8 border-b border-gray-200">
              {['w-8', 'w-24', 'w-48', 'w-28', 'w-28', 'w-24'].map((w, i) => (
                <div key={i} className={`h-3 ${w} bg-gray-200 rounded animate-pulse`} />
              ))}
            </div>
            <div className="divide-y divide-gray-200">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={`px-4 py-4 flex items-center gap-8 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  <div className="h-4 w-8 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded animate-pulse flex-1" />
                  <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
            <div className="bg-gray-50 px-4 py-3 flex items-center gap-8 border-t border-gray-200">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse ml-auto" />
              <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>

        {/* Mobile card skeleton */}
        <div className="block md:hidden space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="shadow border border-gray-200">
              <CardHeader className="pb-3 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-1/3 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="h-5 w-8 bg-gray-100 rounded animate-pulse" />
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-28 bg-green-100 rounded animate-pulse" />
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LaporanBulanan() {
  const today = dayjs()
  const currentMonth = today.format('MM')
  const currentYear = today.format('YYYY')

  const [laporanData, setLaporanData] = useState({
    laporanBulanan: [],
    totalKeseluruhan: { jumlah_terjual: 0, pembelian: 0, keuntungan: 0 },
    penjualanPerHari: {},
    totalPenjualanHarian: 0,
    namaBulan: '',
    tahun: currentYear,
    bulan: currentMonth,
    tanggal: null,
    total_data: 0,
    message: ''
  })

  const [bulan, setBulan] = useState(currentMonth)
  const [tahun, setTahun] = useState(currentYear)
  const [loading, setLoading] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [filterDate, setFilterDate] = useState("")
  const [error, setError] = useState(null)
  const [isDailyMode, setIsDailyMode] = useState(false)

  const GetLaporanBulanan = async (selectedBulan, selectedTahun, tglAwal = "") => {
    try {
      setLoading(true)
      setError(null)
      setIsDailyMode(!!tglAwal)

      const data = await getlaporanbulanan(selectedBulan, selectedTahun, tglAwal)

      if (data.success === 200) {
        const transformedData = Array.isArray(data.laporanBulanan)
          ? data.laporanBulanan.map(item => ({
              ...item,
              total_jumlah_terjual: item.total_jumlah_terjual || 0,
              total_pembelian: item.total_pembelian || 0,
              produk: item.produk || {
                kode_barang: item.kode_barang || '-',
                nama_barang: item.nama_barang || 'Produk tidak diketahui',
                harga: item.harga || 0
              }
            }))
          : []

        setLaporanData({
          laporanBulanan: transformedData,
          totalKeseluruhan: data.totalKeseluruhan || { jumlah_terjual: 0, pembelian: 0, keuntungan: 0 },
          penjualanPerHari: data.penjualanPerHari || {},
          totalPenjualanHarian: data.totalPenjualanHarian || 0,
          namaBulan: data.namaBulan || '',
          tahun: data.tahun || selectedTahun,
          bulan: data.bulan || selectedBulan,
          tanggal: data.tanggal || null,
          total_data: data.total_data || 0,
          message: data.message || ''
        })
      } else {
        setError(data.message || 'Terjadi kesalahan saat mengambil data')
        setLaporanData(prev => ({
          ...prev,
          laporanBulanan: [],
          totalKeseluruhan: { jumlah_terjual: 0, pembelian: 0, keuntungan: 0 },
        }))
      }
    } catch (err) {
      setError("Gagal terhubung ke server. Periksa koneksi internet Anda.")
      setLaporanData(prev => ({
        ...prev,
        laporanBulanan: [],
        totalKeseluruhan: { jumlah_terjual: 0, pembelian: 0, keuntungan: 0 },
      }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const tglAwal = filterDate ? dayjs(filterDate).format('YYYY-MM-DD') : ""
    GetLaporanBulanan(bulan, tahun, tglAwal)
  }, [bulan, tahun, filterDate])

  const bulanList = [
    { value: "01", label: "Januari" }, { value: "02", label: "Februari" },
    { value: "03", label: "Maret" },   { value: "04", label: "April" },
    { value: "05", label: "Mei" },     { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },    { value: "08", label: "Agustus" },
    { value: "09", label: "September" },{ value: "10", label: "Oktober" },
    { value: "11", label: "November" }, { value: "12", label: "Desember" },
  ]

  const tahunList = Array.from({ length: 5 }, (_, i) => String(today.year() - i))
  const selectedBulanLabel = bulanList.find(b => b.value === bulan)?.label || laporanData.namaBulan || ""

  const calculateAverageDaily = () => {
    const hariCount = Object.keys(laporanData.penjualanPerHari).length
    if (hariCount === 0) return 0
    return laporanData.totalPenjualanHarian / hariCount
  }

  const formatCurrency = (value) => {
    if (!value && value !== 0) return "Rp 0"
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(value)
  }

  const formatNumber = (value) => {
    if (!value && value !== 0) return "0"
    return new Intl.NumberFormat('id-ID').format(value)
  }

  const formatTanggal = (dateString) => {
    if (!dateString) return ''
    return dayjs(dateString).format('dddd, D MMMM YYYY')
  }

  const formatShortDate = (dateString) => {
    if (!dateString) return ''
    return dayjs(dateString).format('DD/MM/YYYY')
  }

  const handleDateSelect = (date) => {
    if (date) {
      setSelectedDate(date)
      setFilterDate(dayjs(date).format('YYYY-MM-DD'))
    }
    setShowDatePicker(false)
  }

  const handleClearDateFilter = () => {
    setFilterDate("")
    setSelectedDate(null)
    setIsDailyMode(false)
  }

  const handleClearAllFilters = () => {
    setBulan(currentMonth)
    setTahun(currentYear)
    setFilterDate("")
    setSelectedDate(null)
    setIsDailyMode(false)
  }

  const getTableData = () => {
    if (!laporanData.laporanBulanan || laporanData.laporanBulanan.length === 0) return []
    return laporanData.laporanBulanan.map((item, index) => ({
      kode_barang: item.produk?.kode_barang || item.kode_barang || '-',
      nama_produk: item.produk?.nama_barang || item.nama_barang || 'Produk tidak diketahui',
      jumlah_terjual: item.total_jumlah_terjual || 0,
      total_pembelian: item.total_pembelian || 0,
      tanggal_terakhir: item.waktu_pembelian || "",
      harga_satuan: item.produk?.harga || 0
    }))
  }

  if (loading) return <SkeletonLoading />

  const tableData = getTableData()
  const sortedData = [...tableData].sort((a, b) =>
    parseFloat(b.total_pembelian || 0) - parseFloat(a.total_pembelian || 0)
  )

  const penjualanHarian = laporanData.penjualanPerHari || {}
  const hariCount = Object.keys(penjualanHarian).length

  // Total qty terjual — backend key is jumlah_terjual in totalKeseluruhan
  const totalQty = laporanData.totalKeseluruhan.jumlah_terjual
    ?? laporanData.totalKeseluruhan.total_jumlah_terjual
    ?? 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 space-y-6">

        {/* ── Header ── */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-8 h-8" />
                Laporan Penjualan {isDailyMode ? 'Harian' : 'Bulanan'} Sembako
              </h1>
              <p className="text-gray-600 mt-1">
                {filterDate
                  ? formatTanggal(filterDate)
                  : `${selectedBulanLabel} ${laporanData.tahun}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-sm">{dayjs().format('D MMMM YYYY')}</p>
              {laporanData.message && (
                <p className="text-green-600 text-sm mt-1">{laporanData.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* ── Filter ── */}
        <Card className="shadow border border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Search className="w-5 h-5" />
              Filter Laporan {isDailyMode ? 'Harian' : 'Bulanan'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Bulan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Bulan</label>
                <select
                  value={bulan}
                  onChange={(e) => { setBulan(e.target.value); setFilterDate(""); setSelectedDate(null) }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white"
                >
                  {bulanList.map(b => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>

              {/* Tahun */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Tahun</label>
                <select
                  value={tahun}
                  onChange={(e) => { setTahun(e.target.value); setFilterDate(""); setSelectedDate(null) }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white"
                >
                  {tahunList.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Filter Harian */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter Harian
                  {isDailyMode && (
                    <span className="ml-2 text-xs text-blue-600 font-normal">(aktif)</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filterDate ? formatShortDate(filterDate) : ""}
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    readOnly
                    placeholder="Pilih tanggal"
                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white cursor-pointer"
                  />
                  {filterDate ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleClearDateFilter() }}
                      className="absolute right-3 top-2.5"
                    >
                      <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  ) : (
                    <CalendarDays className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                  )}
                </div>
                {showDatePicker && (
                  <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      initialFocus
                      className="rounded-md border"
                    />
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Pilih tanggal untuk laporan 1 hari</p>
              </div>

              {/* Reset */}
              <div className="flex flex-col justify-end gap-2">
                {(filterDate || bulan !== currentMonth || tahun !== currentYear) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClearAllFilters}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100 text-sm"
                  >
                    <X className="w-4 h-4 mr-1" /> Reset Semua
                  </Button>
                )}
              </div>
            </div>

            {/* Active filter badge */}
            {(filterDate || bulan !== currentMonth || tahun !== currentYear) && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-700">
                    Filter aktif:&nbsp;
                    <strong>
                      {filterDate
                        ? formatTanggal(filterDate)
                        : `${selectedBulanLabel} ${tahun}`}
                    </strong>
                    {isDailyMode && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                        Mode Harian
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Stats Cards ── */}
        {tableData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="pt-6 text-center">
                <DollarSign className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <h3 className="text-sm font-medium text-gray-600 mb-1">Total Penjualan</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(laporanData.totalKeseluruhan.pembelian)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Rupiah</p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="pt-6 text-center">
                <TrendingUp className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  {isDailyMode ? 'Total Penjualan Hari Ini' : 'Rata-rata Harian'}
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  {isDailyMode
                    ? formatCurrency(laporanData.totalPenjualanHarian)
                    : formatCurrency(calculateAverageDaily())}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {isDailyMode ? `Tanggal ${formatShortDate(filterDate)}` : `${hariCount} hari aktif`}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Data Display ── */}
        {sortedData.length > 0 ? (
          <>
            {/* Mobile Cards */}
            <div className="block md:hidden space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isDailyMode
                    ? `Penjualan ${formatShortDate(filterDate)} (${sortedData.length} produk)`
                    : `Detail Penjualan (${sortedData.length} produk)`}
                </h3>
                <Smartphone className="w-5 h-5 text-gray-400" />
              </div>

              {sortedData.map((item, index) => (
                <Card key={index} className="shadow border border-gray-200">
                  <CardHeader className="pb-3 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{item.nama_produk}</h4>
                        <p className="text-sm text-gray-600 font-mono mt-1">Kode: {item.kode_barang}</p>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">#{index + 1}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Package2 className="w-4 h-4" /> Jumlah Terjual
                        </span>
                        <span className="font-semibold text-gray-900">
                          {formatNumber(item.jumlah_terjual)} pcs
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Penjualan</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(item.total_pembelian)}
                        </span>
                      </div>
                      {item.tanggal_terakhir && (
                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                          <span className="text-sm text-gray-600">
                            {isDailyMode ? 'Tanggal' : 'Terakhir Penjualan'}
                          </span>
                          <span className="text-sm text-gray-700">
                            {dayjs(item.tanggal_terakhir).format('DD/MM/YYYY')}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Mobile total */}
              <Card className="border-2 border-gray-300 bg-gray-50">
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm font-semibold text-gray-700">Ringkasan</p>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Produk</span>
                    <span className="font-semibold text-gray-900">{sortedData.length} jenis</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Qty Terjual</span>
                    <span className="font-semibold text-gray-900">{formatNumber(totalQty)} pcs</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-300 pt-2">
                    <span className="text-sm font-semibold text-gray-700">Total Penjualan</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(laporanData.totalKeseluruhan.pembelian)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Desktop Table */}
            <Card className="hidden md:block shadow border border-gray-200">
              <CardHeader className="bg-gray-50 border-b border-gray-200 py-3 px-4">
                <CardTitle className="text-base text-gray-800">
                  {isDailyMode
                    ? `Data Penjualan Tanggal ${formatTanggal(filterDate)}`
                    : `Data Penjualan ${selectedBulanLabel} ${tahun}`}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({sortedData.length} produk)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Kode Barang</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Nama Produk</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Jumlah Terjual</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Total Penjualan</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                          {isDailyMode ? 'Tanggal' : 'Terakhir Penjualan'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sortedData.map((item, index) => (
                        <tr key={index} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                          <td className="px-4 py-4 text-center text-gray-500 text-sm">{index + 1}</td>
                          <td className="px-4 py-4 font-mono text-sm text-gray-700">{item.kode_barang}</td>
                          <td className="px-4 py-4 font-medium text-gray-900">{item.nama_produk}</td>
                          <td className="px-4 py-4 text-right text-gray-900">
                            {formatNumber(item.jumlah_terjual)} pcs
                           </td>
                          <td className="px-4 py-4 text-right font-semibold text-gray-900">
                            {formatCurrency(item.total_pembelian)}
                           </td>
                          <td className="px-4 py-4 text-center text-sm text-gray-600">
                            {item.tanggal_terakhir
                              ? dayjs(item.tanggal_terakhir).format('DD/MM/YY')
                              : '-'}
                           </td>
                         </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right font-semibold text-gray-700 uppercase text-sm">
                          Total
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {formatNumber(totalQty)} pcs
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {formatCurrency(laporanData.totalKeseluruhan.pembelian)}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-500 text-sm">
                          {isDailyMode ? '1 hari' : `${hariCount} hari`}
                        </td>
                       </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : !loading && (
          <Card className="shadow border border-gray-200">
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Data Transaksi</h3>
              <p className="text-gray-600">
                {isDailyMode
                  ? `Tidak ada transaksi pada tanggal ${filterDate ? formatShortDate(filterDate) : 'ini'}`
                  : `Tidak ada transaksi untuk periode ${selectedBulanLabel} ${tahun}`}
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── Footer summary ── */}
        {sortedData.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="text-center md:text-left">
                <p><span className="font-semibold">Periode:</span> {isDailyMode ? 'Harian' : 'Bulanan'}</p>
                <p><span className="font-semibold">Total Produk:</span> {sortedData.length}</p>
              </div>
              <div className="text-center">
                <p><span className="font-semibold">Total Hari:</span> {isDailyMode ? '1' : hariCount} hari</p>
                <p><span className="font-semibold">Keuntungan:</span> {formatCurrency(laporanData.totalKeseluruhan.keuntungan)}</p>
              </div>
              <div className="text-center md:text-right">
                <p>
                  <span className="font-semibold">Rata-rata/Produk:</span>{' '}
                  {formatCurrency(laporanData.totalKeseluruhan.pembelian / sortedData.length)}
                </p>
                <p className="text-green-600 font-medium">✓ Data berhasil dimuat</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}