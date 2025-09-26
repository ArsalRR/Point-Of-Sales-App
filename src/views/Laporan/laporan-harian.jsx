import React, { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog"
import { Loader2, AlertCircle, RefreshCw, FileText, X } from "lucide-react"
import { getlaporanharian } from "@/api/Laporanapi"
import NotaPembelian from "../Kasir/NotaPembelian"
export default function LaporanHarian() {
  
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
 const [laporan, setLaporan] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
   const [showPrint, setShowPrint] = useState(false)
  const [printData, setPrintData] = useState(null)

const fetchLaporan = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await getlaporanharian()
      if (res.status !== 200) {
        throw new Error("Gagal mengambil laporan harian")
      }
      setLaporan(res.data.laporan || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLaporan()
  }, [fetchLaporan])

  const handleDetailClick = useCallback((item) => {
    const transactionItems = laporan.filter(laporanItem => 
      laporanItem.no_transaksi === item.no_transaksi
    )
    setSelectedTransaction({
      no_transaksi: item.no_transaksi,
      items: transactionItems
    })
    setModalOpen(true)
  }, [laporan])
  
  const closeModal = useCallback(() => {
    setModalOpen(false)
    setSelectedTransaction(null)
  }, [])

  const formatCurrency = useCallback((value) => {
    if (!value) return "Rp 0"
    const numValue = typeof value === 'string' ? parseInt(value) : value
    if (isNaN(numValue)) return "Rp 0"
    return `Rp ${numValue.toLocaleString("id-ID")}`
  }, [])

  const calculateTotalPendapatan = useCallback(() => {
    return laporan.reduce((total, item) => {
      const pendapatan = parseInt(item.total_pendapatan) || 0
      const potongan_harga = parseInt(item.diskon) || 0
      return total + pendapatan - potongan_harga
    }, 0)
  }, [laporan])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">Memuat data laporan...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <Card className="border-red-200">
          <CardContent className="flex flex-col items-center justify-center min-h-80 space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-red-700">Terjadi Kesalahan</h3>
              <p className="text-red-600">{error}</p>
            </div>
            <Button onClick={fetchLaporan} variant="outline" className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (laporan.length === 0) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Laporan Harian</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center min-h-80 space-y-4">
            <FileText className="h-12 w-12 text-gray-400" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-700">Tidak Ada Data</h3>
              <p className="text-gray-500">Belum ada laporan harian yang tersedia</p>
            </div>
            <Button onClick={fetchLaporan} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Muat Ulang
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Laporan Harian</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold">No Transaksi</th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Kode Barang</th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Nama Barang</th>
                  <th className="border border-gray-200 px-4 py-3 text-center font-semibold">Jumlah</th>
                  <th className="border border-gray-200 px-4 py-3 text-right font-semibold">Harga</th>
                  <th className="border border-gray-200 px-4 py-3 text-center font-semibold">Satuan</th>
                  <th className="border border-gray-200 px-4 py-3 text-right font-semibold">Total</th>
                  <th className="border border-gray-200 px-4 py-3 text-center font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {laporan.map((item, index) => (
                  <tr key={`${item.no_transaksi}-${index}`} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium">
                      {item.no_transaksi || "-"}
                    </td>
                    <td className="border border-gray-200 px-4 py-3">
                      {item.produk?.kode_barang || "-"}
                    </td>
                    <td className="border border-gray-200 px-4 py-3">
                      {item.produk?.nama_barang || "-"}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-center">
                      {item.jumlah_terjual_per_hari || 0}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-right">
                      {formatCurrency(item.harga_saat_transaksi)}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-center">
                      {item.satuan_barang || "-"}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-right font-semibold">
                      {formatCurrency(item.total_pendapatan)}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-center">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDetailClick(item)}
                        className="hover:bg-blue-50 hover:text-blue-600"
                      >
                        Detail
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
            <div className="text-right space-y-2">
              <div className="text-sm text-gray-600">
                Total Transaksi: <span className="font-semibold">{laporan.length}</span>
              </div>
              <div className="text-lg font-bold text-gray-800">
                Total Pendapatan: <span className="text-green-600">{formatCurrency(calculateTotalPendapatan())}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold">
                Detail Transaksi: {selectedTransaction?.no_transaksi}
              </DialogTitle>
              <DialogClose onClick={closeModal}>
                <X className="h-4 w-4" />
              </DialogClose>
            </div>
          </DialogHeader>
          
          {selectedTransaction && (
           <div className="space-y-4">
  {/* Informasi Transaksi */}
  <div className="bg-gray-50 p-4 rounded-lg">
    <h3 className="font-semibold text-lg mb-3">Informasi Transaksi</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
      <div>
        <span className="font-medium text-gray-600">No. Transaksi:</span>
        <p className="font-semibold">{selectedTransaction.no_transaksi}</p>
      </div>
      <div>
        <span className="font-medium text-gray-600">Total Item:</span>
        <p className="font-semibold">{selectedTransaction.items.length} produk</p>
      </div>
    </div>
  </div>

  {/* Daftar Barang */}
  <div>
    <h3 className="font-semibold text-lg mb-3">Daftar Barang</h3>
    <div className="space-y-3">
      {selectedTransaction.items.map((item, index) => (
        <div
          key={`card-${index}`}
          className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-gray-800">
                {item.produk?.nama_barang || "-"}
              </p>
              <p className="text-xs text-gray-500">
                Kode: {item.produk?.kode_barang || "-"}
              </p>
            </div>
            <Button
              onClick={() => {
                setPrintData(item)
                setShowPrint(true)
              }}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <FileText className="h-4 w-4" />
              Cetak
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <div>
              <span className="block text-gray-500">Jumlah</span>
              <span className="font-medium">{item.jumlah_terjual_per_hari || 0}</span>
            </div>
            <div>
              <span className="block text-gray-500">Satuan</span>
              <span className="font-medium">{item.satuan_barang || "-"}</span>
            </div>
            <div>
              <span className="block text-gray-500">Harga</span>
              <span className="font-medium">
                {formatCurrency(item.harga_saat_transaksi)}
              </span>
            </div>
            <div>
              <span className="block text-gray-500">Subtotal</span>
              <span className="font-semibold text-blue-600">
                {formatCurrency(item.total_pendapatan)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Total Transaksi */}
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
      <p className="text-right font-bold">
        TOTAL TRANSAKSI:{" "}
        <span className="text-blue-600">
          {formatCurrency(
            selectedTransaction.items.reduce(
              (total, item) => total + (parseInt(item.total_pendapatan) || 0),
              0
            )
          )}
        </span>
      </p>
    </div>
  </div>

  {showPrint && printData && (
  <NotaPembelian
    transactionData={printData}
    onClose={() => {
      setShowPrint(false)
      setPrintData(null)
    }}
  />
)}
</div>

          )}
        </DialogContent>
      </Dialog>
      
      <div className="flex justify-end">
        <Button onClick={fetchLaporan} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>
    </div>
  )
}

