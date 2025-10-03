import { useEffect, useState } from "react"
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card"

import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CalendarDays, TrendingUp, Package2, DollarSign, BarChart3, X } from "lucide-react"
import { getlaporanbulanan } from "@/api/Laporanapi"
import { Input } from "@/components/ui/input"

export default function LaporanBulanan() {
  const today = new Date()
  const currentMonth = String(today.getMonth() + 1).padStart(2, '0')
  const currentYear = String(today.getFullYear())
  
  const [laporanBulanan, setLaporanBulanan] = useState(null)
  const [bulan, setBulan] = useState(currentMonth)
  const [tahun, setTahun] = useState(currentYear)
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState("bulanan")
  const [tglAwal, setTglAwal] = useState("")

  const GetLaporanBulanan = async (selectedBulan, selectedTahun, selectedTglAwal = "") => {
    try {
      setLoading(true)

      const data = await getlaporanbulanan(selectedBulan, selectedTahun, selectedTglAwal)

      setLaporanBulanan(data)
    } catch (error) {
      setLaporanBulanan(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    GetLaporanBulanan(bulan, tahun, tglAwal)
  }, [bulan, tahun, tglAwal])

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

  const tahunList = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i))

  const selectedBulanLabel = bulanList.find(b => b.value === bulan)?.label || ""
  
  if (loading || !laporanBulanan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat laporan bulanan...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  const laporanData = laporanBulanan?.laporanBulanan || []
  const sortedData = [...laporanData].sort((a, b) => 
    parseFloat(b.total_pembelian || 0) - parseFloat(a.total_pembelian || 0)
  )

  const penjualanHarian = laporanBulanan?.penjualanPerHari || {}
  const hariList = Object.entries(penjualanHarian).sort((a, b) => a[0].localeCompare(b[0]))
  const groupByDate = (data) => {
    const grouped = {}
    data.forEach(item => {
      const date = item.waktu_pembelian || 'Tanggal tidak diketahui'
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(item)
    })
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]))
  }

  const dailyGroupedData = groupByDate(laporanData)

  const formatTanggal = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <CalendarDays className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                Laporan Penjualan {tglAwal ? "Harian" : (viewMode === "bulanan" ? "Bulanan" : "Harian")}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {tglAwal ? formatTanggal(tglAwal) : `${selectedBulanLabel} ${tahun}`}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {!tglAwal && (
                <Select value={viewMode} onValueChange={setViewMode}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Pilih tampilan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bulanan">Bulanan</SelectItem>
                    <SelectItem value="harian">Harian</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <Select value={bulan} onValueChange={setBulan} disabled={loading}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>
                <SelectContent>
                  {bulanList.map((b) => (
                    <SelectItem key={b.value} value={b.value}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={tahun} onValueChange={setTahun} disabled={loading}>
                <SelectTrigger className="w-full sm:w-[100px]">
                  <SelectValue placeholder="Pilih tahun" />
                </SelectTrigger>
                <SelectContent>
                  {tahunList.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative w-full sm:w-[180px]">
                <Input
                  type="date"
                  value={tglAwal}
                  onChange={(e) => setTglAwal(e.target.value)}
                  placeholder="Filter Harian"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                {tglAwal && (
                  <button
                    onClick={() => setTglAwal("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-white rounded-full p-1"
                    disabled={loading}
                    title="Hapus filter tanggal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {tglAwal && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Filter aktif: <strong>{formatTanggal(tglAwal)}</strong>
                </span>
              </div>
              <button
                onClick={() => setTglAwal("")}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Tampilkan Semua
              </button>
            </div>
          )}
        </div>

        {/* Summary Cards - Tampil di mode bulanan atau saat ada filter tanggal */}
        {(viewMode === "bulanan" || tglAwal) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  Total Penjualan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  Rp {parseFloat(laporanBulanan?.totalKeseluruhan?.pembelian || 0).toLocaleString('id-ID')}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Package2 className="w-4 h-4 text-blue-600" />
                  Jumlah Terjual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                  {parseInt(laporanBulanan?.totalKeseluruhan?.jumlah_terjual || 0).toLocaleString('id-ID')}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  Keuntungan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl sm:text-2xl font-bold text-purple-600">
                  Rp {parseFloat(laporanBulanan?.totalKeseluruhan?.keuntungan || 0).toLocaleString('id-ID')}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {viewMode === "bulanan" && !tglAwal && hariList.length > 0 && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Penjualan Per Hari
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                {hariList.map(([tanggal, nilai]) => (
                  <div key={tanggal} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <p className="text-xs text-gray-600 mb-1 font-medium">{tanggal}</p>
                    <p className="text-base font-bold text-gray-900">
                      Rp {parseFloat(nilai || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* View Harian - Tampil saat mode harian dan tidak ada filter tanggal */}
        {viewMode === "harian" && !tglAwal && (
          <div className="space-y-6">
            {dailyGroupedData.length === 0 ? (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="py-8 text-center text-gray-500">
                  Tidak ada data penjualan untuk periode ini
                </CardContent>
              </Card>
            ) : (
              dailyGroupedData.map(([date, items]) => {
                const dailyTotal = items.reduce((sum, item) => sum + parseFloat(item.total_pembelian || 0), 0)
                const dailyQty = items.reduce((sum, item) => sum + parseInt(item.total_jumlah_terjual || 0), 0)
                
                return (
                  <Card key={date} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <CalendarDays className="w-5 h-5 text-blue-600" />
                          {formatTanggal(date)}
                        </CardTitle>
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Package2 className="w-4 h-4 text-blue-600" />
                            <span className="font-semibold text-blue-600">{dailyQty} item</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="font-semibold text-green-600">
                              Rp {dailyTotal.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      {/* Mobile View */}
                      <div className="block lg:hidden space-y-3">
                        {items.map((item, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-3 space-y-2">
                            <div className="font-semibold text-gray-900">{item.produk?.nama_barang || 'Produk Tidak Diketahui'}</div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">Kode:</span>
                                <span className="ml-1 font-mono">{item.produk?.kode_barang || '-'}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Qty:</span>
                                <span className="ml-1 font-semibold text-blue-600">
                                  {parseInt(item.total_jumlah_terjual || 0).toLocaleString('id-ID')}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Harga:</span>
                                <span className="ml-1">Rp {parseFloat(item.produk?.harga || 0).toLocaleString('id-ID')}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Total:</span>
                                <span className="ml-1 font-semibold text-green-600">
                                  Rp {parseFloat(item.total_pembelian || 0).toLocaleString('id-ID')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop View */}
                      <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Produk</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Harga</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {items.map((item, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-center text-gray-500">{idx + 1}</td>
                                <td className="px-4 py-3 font-medium text-gray-900">
                                  {item.produk?.nama_barang || 'Produk Tidak Diketahui'}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="font-mono text-xs">{item.produk?.kode_barang || '-'}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {parseInt(item.total_jumlah_terjual || 0).toLocaleString('id-ID')}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  Rp {parseFloat(item.produk?.harga || 0).toLocaleString('id-ID')}
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-green-600">
                                  Rp {parseFloat(item.total_pembelian || 0).toLocaleString('id-ID')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        )}

        {/* Detail Produk - Tampil di mode bulanan atau saat ada filter tanggal */}
        {(viewMode === "bulanan" || tglAwal) && (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Detail Penjualan Produk {tglAwal ? `- ${formatTanggal(tglAwal)}` : ''}
              </h3>
              {sortedData.length === 0 ? (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="py-8 text-center text-gray-500">
                    Tidak ada data penjualan untuk periode ini
                  </CardContent>
                </Card>
              ) : (
                sortedData.map((item, idx) => (
                  <Card key={idx} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold text-gray-900">
                        {item.produk?.nama_barang || 'Produk Tidak Diketahui'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Kode Barang:</span>
                        <span className="font-mono text-sm">{item.produk?.kode_barang || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Jumlah Terjual:</span>
                        <span className="font-semibold text-blue-600">
                          {parseInt(item.total_jumlah_terjual || 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Harga Satuan:</span>
                        <span className="font-semibold">
                          Rp {parseFloat(item.produk?.harga || 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Penjualan:</span>
                        <span className="font-semibold text-green-600">
                          Rp {parseFloat(item.total_pembelian || 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                      {!tglAwal && (
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Waktu Transaksi:</span>
                            <span>{item.waktu_pembelian || '-'}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <Card className="hidden lg:block shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package2 className="w-5 h-5" />
                  Detail Penjualan Produk - {tglAwal ? formatTanggal(tglAwal) : `${selectedBulanLabel} ${tahun}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sortedData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Tidak ada data penjualan untuk periode ini
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="w-[5%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                          <th className="w-[25%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Produk</th>
                          <th className="w-[15%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode Barang</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Harga Satuan</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          {!tglAwal && (
                            <th className="w-[15%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sortedData.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-4 text-center text-gray-500">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-4 font-medium text-gray-900">
                              {item.produk?.nama_barang || 'Produk Tidak Diketahui'}
                            </td>
                            <td className="px-4 py-4">
                              <span className="font-mono text-xs">
                                {item.produk?.kode_barang || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {parseInt(item.total_jumlah_terjual || 0).toLocaleString('id-ID')}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              Rp {parseFloat(item.produk?.harga || 0).toLocaleString('id-ID')}
                            </td>
                            <td className="px-4 py-4 text-right font-semibold text-green-600">
                              Rp {parseFloat(item.total_pembelian || 0).toLocaleString('id-ID')}
                            </td>
                            {!tglAwal && (
                              <td className="px-4 py-4 text-xs text-gray-600">
                                {item.waktu_pembelian || '-'}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}