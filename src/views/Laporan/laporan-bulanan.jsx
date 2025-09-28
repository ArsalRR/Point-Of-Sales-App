import { useEffect, useState } from "react"
import { getlaporanbulanan } from "@/api/Laporanapi"
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
import { CalendarDays, TrendingUp, Package2, DollarSign } from "lucide-react"

export default function LaporanBulanan() {
  const [laporanBulanan, setLaporanBulanan] = useState(null)
  const [bulan, setBulan] = useState("09")
  const [tahun, setTahun] = useState("2025")
  const [groupedData, setGroupedData] = useState([])

  const GetLaporanBulanan = async () => {
    try {
      const data = await getlaporanbulanan()
      setLaporanBulanan(data)
    } catch (error) {
      console.error("Error fetching laporan bulanan:", error)
    }
  }

  // Group products by name and sum their quantities and totals
  const groupProductsByName = (data) => {
    if (!data || !data.laporanBulanan) return []
    
    const grouped = data.laporanBulanan.reduce((acc, item) => {
      const productName = item.produk?.nama_barang || 'Produk Tidak Diketahui'
      
      if (acc[productName]) {
        acc[productName].total_jumlah_terjual += item.total_jumlah_terjual
        acc[productName].total_pembelian += Number(item.total_pembelian)
        acc[productName].transactions.push({
          tanggal: item.waktu_pembelian.split(" ")[0],
          jumlah: item.total_jumlah_terjual,
          total: Number(item.total_pembelian)
        })
      } else {
        acc[productName] = {
          nama_barang: productName,
          total_jumlah_terjual: item.total_jumlah_terjual,
          total_pembelian: Number(item.total_pembelian),
          transactions: [{
            tanggal: item.waktu_pembelian.split(" ")[0],
            jumlah: item.total_jumlah_terjual,
            total: Number(item.total_pembelian)
          }]
        }
      }
      return acc
    }, {})

    return Object.values(grouped).sort((a, b) => b.total_pembelian - a.total_pembelian)
  }

  useEffect(() => {
    GetLaporanBulanan()
  }, [bulan, tahun])

  useEffect(() => {
    if (laporanBulanan) {
      const grouped = groupProductsByName(laporanBulanan)
      setGroupedData(grouped)
    }
  }, [laporanBulanan])

  if (!laporanBulanan) {
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
            
            {/* Filters - Mobile Friendly */}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={bulan} onValueChange={setBulan}>
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
              
              <Select value={tahun} onValueChange={setTahun}>
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

        {/* Mobile Card View */}
        <div className="block lg:hidden space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Detail Penjualan Produk</h3>
          {groupedData.length === 0 ? (
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="py-8 text-center text-gray-500">
                Tidak ada data penjualan untuk periode ini
              </CardContent>
            </Card>
          ) : (
            groupedData.map((item, idx) => (
              <Card key={idx} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900">
                    {item.nama_barang}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Jumlah Terjual:</span>
                    <span className="font-semibold text-blue-600">{item.total_jumlah_terjual}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Penjualan:</span>
                    <span className="font-semibold text-green-600">
                      Rp {item.total_pembelian.toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Riwayat Transaksi:</p>
                    <div className="space-y-1">
                      {item.transactions.slice(0, 3).map((trans, transIdx) => (
                        <div key={transIdx} className="flex justify-between text-xs">
                          <span className="text-gray-600">{trans.tanggal}</span>
                          <span>{trans.jumlah} item</span>
                          <span>Rp {trans.total.toLocaleString()}</span>
                        </div>
                      ))}
                      {item.transactions.length > 3 && (
                        <p className="text-xs text-gray-400 text-center">
                          +{item.transactions.length - 3} transaksi lainnya
                        </p>
                      )}
                    </div>
                  </div>
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
              Detail Penjualan Produk (Dikelompokkan)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {groupedData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Tidak ada data penjualan untuk periode ini
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Nama Produk</TableHead>
                      <TableHead className="text-center">Total Terjual</TableHead>
                      <TableHead className="text-center">Jumlah Transaksi</TableHead>
                      <TableHead className="text-right">Total Penjualan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedData.map((item, idx) => (
                      <TableRow key={idx} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-semibold">{item.nama_barang}</p>
                            <p className="text-xs text-gray-500">
                              Transaksi terakhir: {item.transactions[item.transactions.length - 1]?.tanggal}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.total_jumlah_terjual}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {item.transactions.length}x
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          Rp {item.total_pembelian.toLocaleString()}
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