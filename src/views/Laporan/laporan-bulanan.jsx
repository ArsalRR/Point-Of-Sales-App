import { useEffect, useState } from "react"
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CalendarDays, TrendingUp, Package2, DollarSign, BarChart3 } from "lucide-react"
import { getlaporanbulanan } from "@/api/Laporanapi"

export default function LaporanBulanan() {
  const [laporanBulanan, setLaporanBulanan] = useState(null)
  const [bulan, setBulan] = useState("09")
  const [tahun, setTahun] = useState("2025")
  const [loading, setLoading] = useState(false)

  const GetLaporanBulanan = async (selectedBulan, selectedTahun) => {
    try {
      setLoading(true)
      const data = await getlaporanbulanan(selectedBulan, selectedTahun)
      setLaporanBulanan(data)
    } catch (error) {
      console.error("Error fetching laporan:", error)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    GetLaporanBulanan(bulan, tahun)
  }, [bulan, tahun])

  if (!laporanBulanan && !loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat laporan bulanan...</p>
        </div>
      </div>
    )
  }

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

  const tahunList = ["2023", "2024", "2025"]

  const selectedBulanLabel = bulanList.find(b => b.value === bulan)?.label || ""

  const laporanData = laporanBulanan?.laporanBulanan || []
  const sortedData = [...laporanData].sort((a, b) => 
    parseFloat(b.total_pembelian) - parseFloat(a.total_pembelian)
  )

  const penjualanHarian = laporanBulanan?.penjualanPerHari || {}
  const hariList = Object.entries(penjualanHarian).sort((a, b) => a[0].localeCompare(b[0]))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <CalendarDays className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                Laporan Bulanan
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {selectedBulanLabel} {tahun}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
            <Card className="p-6">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-600">Memuat data {selectedBulanLabel} {tahun}...</p>
              </div>
            </Card>
          </div>
        )}

        {/* Summary Cards */}
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
                Rp {laporanBulanan?.totalKeseluruhan?.pembelian?.toLocaleString() || '0'}
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
                {laporanBulanan?.totalKeseluruhan?.jumlah_terjual || 0}
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
                Rp {laporanBulanan?.totalKeseluruhan?.keuntungan?.toLocaleString() || '0'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Penjualan Per Hari */}
        {hariList.length > 0 && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Penjualan Per Hari
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {hariList.map(([tanggal, nilai]) => (
                  <div key={tanggal} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">{tanggal}</p>
                    <p className="text-lg font-bold text-gray-900">
                      Rp {parseFloat(nilai).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile Card View - TANPA GROUPING */}
        <div className="block lg:hidden space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Detail Penjualan Produk</h3>
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
                    <span className="font-mono text-sm">{item.produk?.kode_barang}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Jumlah Terjual:</span>
                    <span className="font-semibold text-blue-600">
                      {parseInt(item.total_jumlah_terjual) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Harga Satuan:</span>
                    <span className="font-semibold">
                      Rp {item.produk?.harga?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Penjualan:</span>
                    <span className="font-semibold text-green-600">
                      Rp {parseFloat(item.total_pembelian).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Waktu Transaksi:</span>
                      <span>{item.waktu_pembelian}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Desktop Table View - TANPA GROUPING */}
        <Card className="hidden lg:block shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package2 className="w-5 h-5" />
              Detail Penjualan Produk - {selectedBulanLabel} {tahun}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sortedData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Tidak ada data penjualan untuk periode ini
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[5%]">No</TableHead>
                      <TableHead className="w-[25%]">Nama Produk</TableHead>
                      <TableHead className="w-[15%]">Kode Barang</TableHead>
                      <TableHead className="text-center">Jumlah</TableHead>
                      <TableHead className="text-right">Harga Satuan</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-[15%]">Waktu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedData.map((item, idx) => (
                      <TableRow key={idx} className="hover:bg-gray-50">
                        <TableCell className="text-center text-gray-500">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.produk?.nama_barang || 'Produk Tidak Diketahui'}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs">
                            {item.produk?.kode_barang}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {parseInt(item.total_jumlah_terjual) || 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          Rp {item.produk?.harga?.toLocaleString() || '0'}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          Rp {parseFloat(item.total_pembelian).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-gray-600">
                          {item.waktu_pembelian}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}