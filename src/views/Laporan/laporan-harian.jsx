import React, { useEffect, useState, useCallback } from "react"
import dayjs from "dayjs"
import "dayjs/locale/id"
import { getlaporanharian } from "@/api/Laporanapi"
import { Loader2, RefreshCw, FileText, Eye, Printer } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
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
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import NotaPembelian from "../Kasir/NotaPembelian"

export default function LaporanHarian() {
  const [laporan, setLaporan] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showPrint, setShowPrint] = useState(false)
  const [printData, setPrintData] = useState(null)

  const fetchLaporan = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await getlaporanharian()
      if (res.status !== 200) throw new Error("Gagal mengambil laporan harian")
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

  const formatCurrency = (value) => {
    if (!value) return "Rp 0"
    const numValue = typeof value === "string" ? parseInt(value) : value
    return `Rp ${numValue.toLocaleString("id-ID")}`
  }

  const calculateTotalKeseluruhan = () => {
    return laporan.reduce((total, item) => {
      const subtotal =
        (parseInt(item.jumlah_terjual_per_hari) || 0) *
          (parseInt(item.harga_saat_transaksi) || 0) -
        (parseInt(item.diskon) || 0)
      return total + subtotal
    }, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-80">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Memuat data laporan...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-red-500">❌ {error}</p>
          <Button onClick={fetchLaporan} variant="outline" className="mt-3">
            <RefreshCw className="h-4 w-4 mr-2" /> Muat Ulang
          </Button>
        </div>
      </Card>
    )
  }
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <span>Laporan Penjualan Harian</span>
            <span className="text-sm text-muted-foreground">
              {dayjs().locale("id").format("dddd, DD MMMM YYYY")}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {laporan.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <h4 className="text-lg font-semibold">Tidak Ada Transaksi</h4>
              <p className="text-sm text-muted-foreground">
                Belum ada transaksi tercatat pada hari ini
              </p>
              <Button onClick={fetchLaporan} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" /> Muat Ulang
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">No</TableHead>
                    <TableHead>No. Transaksi</TableHead>
                    <TableHead>Kode Barang</TableHead>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead>Kasir</TableHead>
                    <TableHead className="w-[100px] text-center">Jumlah</TableHead>
                    <TableHead>Harga Jual</TableHead>
                    <TableHead className="w-[80px] text-center">Satuan</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="w-[100px] text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {laporan.map((item, index) => (
                    <TableRow key={`${item.no_transaksi}-${index}`}>
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.no_transaksi}</TableCell>
                      <TableCell>{item.produk?.kode_barang}</TableCell>
                      <TableCell>{item.produk?.nama_barang}</TableCell>
                      <TableCell>{item.user?.name || "-"}</TableCell>
                      <TableCell className="text-center">
                        <strong>{item.jumlah_terjual_per_hari}</strong>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.harga_saat_transaksi)}
                      </TableCell>
                      <TableCell className="text-center">{item.satuan}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(item.jumlah_terjual_per_hari * item.harga_saat_transaksi)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTransaction(item)}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" /> Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={5} className="text-right font-semibold">
                      📈 TOTAL KESELURUHAN
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {laporan.reduce((a, b) => a + (b.jumlah_terjual_per_hari || 0), 0)}
                    </TableCell>
                    <TableCell colSpan={2}></TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {formatCurrency(calculateTotalKeseluruhan())}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              🧾 Detail Transaksi: {selectedTransaction?.no_transaksi}
            </DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Nomor Transaksi</p>
                  <p className="font-semibold">{selectedTransaction.no_transaksi}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Kasir</p>
                  <p className="font-semibold">{selectedTransaction.user?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tanggal & Waktu</p>
                  <p className="font-semibold">
                    {dayjs(selectedTransaction.waktu_pembelian)
                      .locale("id")
                      .format("DD MMMM YYYY, HH:mm")} WIB
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Nama Produk</TableHead>
                      <TableHead className="text-center">Jumlah</TableHead>
                      <TableHead className="text-center">Satuan</TableHead>
                      <TableHead className="text-right">Harga</TableHead>
                      <TableHead className="text-right">Diskon</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>1</TableCell>
                      <TableCell>{selectedTransaction.produk?.nama_barang}</TableCell>
                      <TableCell className="text-center">{selectedTransaction.jumlah_terjual_per_hari}</TableCell>
                      <TableCell className="text-center">{selectedTransaction.satuan}</TableCell>
                      <TableCell className="text-right">{formatCurrency(selectedTransaction.harga_saat_transaksi)}</TableCell>
                      <TableCell className="text-right">
                        {selectedTransaction.diskon > 0 ? (
                          <span className="text-red-500">- {formatCurrency(selectedTransaction.diskon)}</span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(
                          selectedTransaction.jumlah_terjual_per_hari *
                            selectedTransaction.harga_saat_transaksi -
                            (selectedTransaction.diskon || 0)
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={6} className="text-right font-semibold">
                        💰 TOTAL TRANSAKSI
                      </TableCell>
                      <TableCell className="text-right font-bold text-blue-600">
                        {formatCurrency(
                          selectedTransaction.jumlah_terjual_per_hari *
                            selectedTransaction.harga_saat_transaksi -
                            (selectedTransaction.diskon || 0)
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setSelectedTransaction(null)}>
              Tutup
            </Button>
            <Button
              onClick={() => {
                setPrintData(selectedTransaction)
                setShowPrint(true)
              }}
            >
              <Printer className="h-4 w-4 mr-1" /> Cetak Nota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
  )
}
