import { useEffect, useState } from "react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { CalendarDays, TrendingUp, Package2, DollarSign, FileText, Search, X, AlertCircle, Smartphone } from "lucide-react"
import { getlaporanbulanan } from "@/api/Laporanapi"
import dayjs from "dayjs"
import "dayjs/locale/id"

dayjs.locale('id')

export default function LaporanBulanan() {
  const today = dayjs()
  const currentMonth = today.format('MM')
  const currentYear = today.format('YYYY')
  
  const [laporanData, setLaporanData] = useState({
    laporanBulanan: [],
    totalKeseluruhan: { total_jumlah_terjual: 0, pembelian: 0, keuntungan: 0 },
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
        const transformedData = Array.isArray(data.laporanBulanan) ? data.laporanBulanan.map(item => ({
          ...item,
          total_jumlah_terjual: item.total_jumlah_terjual || 0,
          total_pembelian: item.total_pembelian || 0,
          produk: item.produk || {
            kode_barang: item.kode_barang || '-',
            nama_barang: item.nama_barang || 'Produk tidak diketahui',
            harga: item.harga || 0
          }
        })) : []
        
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
          totalKeseluruhan: { total_jumlah_terjual: 0, pembelian: 0, keuntungan: 0 },
          success: false,
          message: data.message || ''
        }))
      }
    } catch (error) {
      setError("Gagal terhubung ke server. Periksa koneksi internet Anda.")
      setLaporanData(prev => ({
        ...prev,
        laporanBulanan: [],
        totalKeseluruhan: { total_jumlah_terjual: 0, total_pembelian: 0, keuntungan: 0 },
  
        success: false,
        message: 'Gagal mengambil data'
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
    { value: "01", label: "Januari" },
    { value: "02", label: "Februari" },
    { value: "03", label: "Maret" },
    { value: "04", label: "April" },
    { value: "05", label: "Mei" },
    { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },
    { value: "08", label: "Agustus" },
    { value: "09", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
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
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
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

  const handleFilterSubmit = (e) => {
    e.preventDefault()
    const tglAwal = filterDate ? dayjs(filterDate).format('YYYY-MM-DD') : ""
    GetLaporanBulanan(bulan, tahun, tglAwal)
  }

  const handleExportPDF = () => {
    const params = new URLSearchParams({
      bulan: bulan,
      tahun: tahun,
      ...(filterDate && { tgl_awal: filterDate })
    })
    window.open(`/api/laporan/bulanan/pdf?${params.toString()}`, '_blank')
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
    if (!laporanData.laporanBulanan || laporanData.laporanBulanan.length === 0) {
      return []
    }

    return laporanData.laporanBulanan.map((item, index) => {
      const jumlahTerjual = item.total_jumlah_terjual || 0
      const totalPembelian = item.total_pembelian || 0
      
      return {
        no: index + 1,
        kode_barang: item.produk?.kode_barang || item.kode_barang || '-',
        nama_produk: item.produk?.nama_barang || item.nama_barang || 'Produk tidak diketahui',
        jumlah_terjual: jumlahTerjual,
        total_pembelian: totalPembelian,
        tanggal_terakhir: item.waktu_pembelian || "",
        harga_satuan: item.produk?.harga || 0
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat laporan {isDailyMode ? 'harian' : 'bulanan'}...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const tableData = getTableData()
  const sortedData = [...tableData].sort((a, b) => 
    parseFloat(b.total_pembelian || 0) - parseFloat(a.total_pembelian || 0)
  )

  const penjualanHarian = laporanData.penjualanPerHari || {}
  const hariCount = Object.keys(penjualanHarian).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-8 h-8" />
                Laporan Penjualan {isDailyMode ? 'Harian' : 'Bulanan'} Sembako
              </h1>
              <p className="text-gray-600 mt-1">
                {filterDate ? formatTanggal(filterDate) : `${selectedBulanLabel} ${laporanData.tahun}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-sm">
                {dayjs().format('D MMMM YYYY')}
              </p>
              {laporanData.message && (
                <p className="text-green-600 text-sm mt-1">
                  {laporanData.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Section */}
        <Card className="shadow border border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Search className="w-5 h-5" />
              Filter Laporan {isDailyMode ? 'Harian' : 'Bulanan'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleFilterSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Pilih Bulan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Bulan</label>
                  <select 
                    value={bulan} 
                    onChange={(e) => setBulan(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white"
                  >
                    {bulanList.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pilih Tahun */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Tahun</label>
                  <select 
                    value={tahun} 
                    onChange={(e) => setTahun(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white"
                  >
                    {tahunList.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter Harian</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={filterDate ? formatShortDate(filterDate) : ""}
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      readOnly
                      placeholder="Pilih tanggal"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white cursor-pointer"
                    />
                    <CalendarDays className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
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

                <div className="flex flex-col gap-1 md:flex-row md:items-center mb-2">
                  <Button 
                    type="submit" 
                    className="gap-2 bg-gray-800 hover:bg-gray-900 text-white"
                    disabled={loading}
                  >
                    <Search className="w-4 h-4" />
                    {loading ? 'Memuat...' : 'Tampilkan'}
                  </Button>
                 
                </div>
              </div>
              {(filterDate || bulan !== currentMonth || tahun !== currentYear) && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-700">
                        Filter aktif: 
                        <strong className="ml-1">
                          {filterDate ? formatTanggal(filterDate) : `${selectedBulanLabel} ${tahun}`}
                        </strong>
                        {isDailyMode && (
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            Mode Harian
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {filterDate && (
                        <button
                          type="button"
                          onClick={handleClearDateFilter}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Hapus Filter Tanggal
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleClearAllFilters}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Reset Semua
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
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
                  {isDailyMode ? 'Total Harian' : 'Rata-rata Harian'}
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  {isDailyMode 
                    ? formatCurrency(laporanData.totalPenjualanHarian)
                    : formatCurrency(calculateAverageDaily())
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {isDailyMode ? 'Penjualan Hari Ini' : 'Per Hari'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Data Display */}
        {sortedData.length > 0 ? (
          <>
            {/* Mobile View - Cards */}
            <div className="block md:hidden space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detail Penjualan ({sortedData.length} produk)
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
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">#{item.no}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">                
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
            </div>
            <Card className="hidden md:block shadow border border-gray-200">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Kode Barang</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Nama Produk</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Total Penjualan</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                          {isDailyMode ? 'Tanggal' : 'Terakhir Penjualan'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sortedData.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-center text-gray-500">{item.no}</td>
                          <td className="px-4 py-4 text-center font-mono text-sm">
                            {item.kode_barang}
                          </td>
                          <td className="px-4 py-4 font-medium text-gray-900">
                            {item.nama_produk}
                          </td>
                          <td className="px-4 py-4 text-right font-semibold text-gray-900">
                            {formatCurrency(item.total_pembelian)}
                          </td>
                          <td className="px-4 py-4 text-center text-sm text-gray-600">
                            {item.tanggal_terakhir ? dayjs(item.tanggal_terakhir).format('DD/MM/YY') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-semibold">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-center text-gray-700">TOTAL</td>
                        <td className="px-4 py-3 text-center text-gray-900">
                          {formatNumber(laporanData.totalKeseluruhan.total_jumlah_terjual)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">
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
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Tidak Ada Data Transaksi
                </h3>
                <p className="text-gray-600">
                  {isDailyMode 
                    ? `Tidak ada transaksi pada tanggal ${filterDate ? formatShortDate(filterDate) : 'ini'}`
                    : `Tidak ada transaksi untuk periode ${selectedBulanLabel} ${tahun}`
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        )}

      
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
                <p><span className="font-semibold">Rata-rata/Produk:</span> {formatCurrency(laporanData.totalKeseluruhan.pembelian / sortedData.length)}</p>
                <p className="text-green-600 font-medium">✓ Laporan siap diunduh</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 