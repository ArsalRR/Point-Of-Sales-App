import React, { useEffect, useState, useCallback } from "react"
import dayjs from "dayjs"
import "dayjs/locale/id"
import { getlaporanharian } from "@/api/Laporanapi"
import {
  Loader2, RefreshCw, FileText, Eye, Printer,
  Receipt, User, Calendar, ShoppingBag
} from "lucide-react"
import {
  Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
const formatCurrency = (val) => `Rp ${Number(val).toLocaleString("id-ID")}`
const NotaPembelian = ({ transaksi, onClose }) => {
  useEffect(() => {
    if (!transaksi) return
    const timer = setTimeout(() => {
      window.print()
      setTimeout(onClose, 800)
    }, 500)
    return () => clearTimeout(timer)
  }, [transaksi, onClose])

  if (!transaksi) return null

  const total = transaksi.items.reduce(
    (acc, item) =>
      acc + item.jumlah_terjual_per_hari * item.harga_saat_transaksi - (item.diskon || 0),
    0
  )

  const currentDate = new Date().toLocaleString("id-ID", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  })

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="w-full max-w-sm mx-auto p-4">
        <style jsx>{`
          @media print {
            body * { visibility: hidden; }
            .print-area, .print-area * { visibility: visible; }
            .print-area { position: absolute; left: 0; top: 0; width: 100%; }
            .no-print { display: none !important; }
          }
          @page { size: 58mm auto; margin: 0; padding: 0; }
          .receipt-content { 
            font-family: 'Courier New', monospace; 
            font-size: 12px; 
            line-height: 1.2; 
            width: 160px; 
            margin: 0 auto; 
            font-weight: bold; /* semua teks jadi tebal */
          }
          .receipt-table { width: 100%; border-collapse: collapse; }
          .receipt-table th, .receipt-table td { 
            border-top: 1px solid #000; 
            padding: 2px; 
            font-size: 10px; 
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
        `}</style>

        <div className="print-area">
          <div className="receipt-content">
            <div className="text-center mb-4">
              <strong>TOKO IFA</strong>
              <br />Jl. Perumahan Limas No. 08
              <br />Telp: 085868287956
              <br />{currentDate}
              <br />No Trans: {transaksi.no_transaksi}
            </div>

            <table className="receipt-table">
              <thead>
                <tr>
                  <th>Jml</th>
                  <th>Produk</th>
                  <th className="text-right">Rp</th>
                </tr>
              </thead>
              <tbody>
                {transaksi.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.jumlah_terjual_per_hari}</td>
                    <td>{item.produk?.nama_barang}</td>
                    <td className="text-right">
                      {formatCurrency(item.jumlah_terjual_per_hari * item.harga_saat_transaksi)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2}><strong>Total</strong></td>
                  <td className="text-right"><strong>{formatCurrency(total)}</strong></td>
                </tr>
              </tbody>
            </table>

            <div className="text-center mt-4">
              Terima Kasih<br />Atas Kunjungan Anda
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



const MobileTransactionCard = ({ trx, idx, onViewDetail }) => {
  const total = trx.items.reduce(
    (sum, i) =>
      sum + i.jumlah_terjual_per_hari * i.harga_saat_transaksi - (i.diskon || 0),
    0
  )
  const totalItems = trx.items.reduce((sum, i) => sum + i.jumlah_terjual_per_hari, 0)

  return (
    <Card className="w-full hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs font-mono">
              #{idx + 1}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {trx.no_transaksi}
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(total)}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-2 mb-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>{trx.user?.name}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>{dayjs(trx.waktu_pembelian).locale("id").format("DD MMM YYYY HH:mm")}</span>
          </div>
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-4 w-4" />
            <span>{totalItems} item</span>
          </div>
        </div>

        <Separator className="my-3" />

        {/* Item list */}
        <div className="space-y-2 mb-4">
          {trx.items.slice(0, 2).map((item, i) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <div className="flex-1">
                <span className="font-medium">{item.produk?.nama_barang}</span>
                <div className="text-xs text-muted-foreground">
                  {item.jumlah_terjual_per_hari}x @ {formatCurrency(item.harga_saat_transaksi)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  {formatCurrency(item.jumlah_terjual_per_hari * item.harga_saat_transaksi - (item.diskon || 0))}
                </div>
                {item.diskon > 0 && (
                  <div className="text-xs text-red-500">
                    -{formatCurrency(item.diskon)}
                  </div>
                )}
              </div>
            </div>
          ))}
          {trx.items.length > 2 && (
            <div className="text-xs text-muted-foreground text-center pt-1">
              +{trx.items.length - 2} item lainnya
            </div>
          )}
        </div>

        <Button onClick={() => onViewDetail(trx)} variant="outline" size="sm" className="w-full">
          <Eye className="h-4 w-4 mr-2" /> Lihat Detail
        </Button>
      </CardContent>
    </Card>
  )
}

// ---------------- Halaman Laporan ----------------
export default function LaporanHarian() {
  const [laporan, setLaporan] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTransaksi, setSelectedTransaksi] = useState(null)
  const [printTransaksi, setPrintTransaksi] = useState(null)

  const fetchLaporan = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await getlaporanharian()
      if (res.status !== 200) throw new Error("Gagal mengambil laporan harian")

      // group by no_transaksi
      const grouped = res.data.laporan.reduce((acc, item) => {
        const key = item.no_transaksi
        if (!acc[key]) {
          acc[key] = {
            no_transaksi: key,
            user: item.user,
            waktu_pembelian: item.waktu_pembelian,
            items: [],
          }
        }
        acc[key].items.push(item)
        return acc
      }, {})

      setLaporan(Object.values(grouped))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLaporan() }, [fetchLaporan])

  const calculateTotalKeseluruhan = () =>
    laporan.reduce((acc, trx) => {
      const total = trx.items.reduce(
        (sum, item) =>
          sum + item.jumlah_terjual_per_hari * item.harga_saat_transaksi - (item.diskon || 0),
        0
      )
      return acc + total
    }, 0)

  // ---------------- UI ----------------
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
            <div className="flex items-center space-x-2">
              <Receipt className="h-5 w-5" />
              <span>Laporan Penjualan Harian</span>
            </div>
            <Badge variant="outline" className="text-sm">
              {dayjs().locale("id").format("dddd, DD MMMM YYYY")}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {laporan.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <h4 className="text-lg font-semibold">Tidak Ada Transaksi</h4>
              <Button onClick={fetchLaporan} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" /> Muat Ulang
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Nama Barang</TableHead>
                      <TableHead>No. Transaksi</TableHead>
                      <TableHead>Kasir</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {laporan.map((trx, idx) => {
                      const total = trx.items.reduce(
                        (sum, i) =>
                          sum + i.jumlah_terjual_per_hari * i.harga_saat_transaksi - (i.diskon || 0),
                        0
                      )
                      return (
                        <TableRow key={trx.no_transaksi}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>
                            {trx.items[0]?.produk?.nama_barang}
                            {trx.items.length > 1 && (
                              <span className="text-xs text-muted-foreground">
                                {" "}+{trx.items.length - 1} lainnya
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{trx.no_transaksi}</TableCell>
                          <TableCell>{trx.user?.name}</TableCell>
                          <TableCell>
                            {dayjs(trx.waktu_pembelian).locale("id").format("DD MMM YYYY HH:mm")}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(total)}</TableCell>
                          <TableCell className="text-center space-x-2">
                            <Button size="sm" variant="outline" onClick={() => setSelectedTransaksi(trx)}>
                              <Eye className="h-4 w-4" /> Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    <TableRow>
                      <TableCell colSpan={5} className="text-right font-semibold">
                        TOTAL KESELURUHAN
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        {formatCurrency(calculateTotalKeseluruhan())}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Mobile */}
              <div className="md:hidden space-y-4">
                {laporan.map((trx, idx) => (
                  <MobileTransactionCard
                    key={trx.no_transaksi}
                    trx={trx}
                    idx={idx}
                    onViewDetail={setSelectedTransaksi}
                  />
                ))}
                <Card className="border-2 border-green-200 bg-green-50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Receipt className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-800">Total Keseluruhan</span>
                    </div>
                    <div className="text-xl font-bold text-green-600">
                      {formatCurrency(calculateTotalKeseluruhan())}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <Dialog open={!!selectedTransaksi} onOpenChange={() => setSelectedTransaksi(null)}>
  <DialogContent className="w-full max-w-2xl sm:rounded-lg sm:m-4 p-4 sm:p-6">
    <DialogHeader>
      <DialogTitle className="text-base sm:text-lg font-bold">
        🧾 Detail Transaksi: {selectedTransaksi?.no_transaksi}
      </DialogTitle>
    </DialogHeader>

    {selectedTransaksi && (
      <div className="space-y-4 text-sm sm:text-base">
        <p><strong>Kasir:</strong> {selectedTransaksi.user?.name}</p>
        <p>
          <strong>Tanggal:</strong>{" "}
          {dayjs(selectedTransaksi.waktu_pembelian).locale("id").format("DD MMM YYYY HH:mm")}
        </p>
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <Table className="min-w-full text-xs sm:text-sm">
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead className="text-center">Jumlah</TableHead>
                <TableHead className="text-right">Harga</TableHead>
                <TableHead className="text-right">Diskon</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedTransaksi.items.map((i, idx) => (
                <TableRow key={idx}>
                  <TableCell>{i.produk?.nama_barang}</TableCell>
                  <TableCell className="text-center">{i.jumlah_terjual_per_hari}</TableCell>
                  <TableCell className="text-right">{formatCurrency(i.harga_saat_transaksi)}</TableCell>
                  <TableCell className="text-right text-red-500">
                    {i.diskon ? `- ${formatCurrency(i.diskon)}` : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(i.jumlah_terjual_per_hari * i.harga_saat_transaksi - (i.diskon || 0))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )}

    <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-4 mt-4">
      <Button
        variant="secondary"
        className="w-full sm:w-auto"
        onClick={() => setSelectedTransaksi(null)}
      >
        Tutup
      </Button>
      {selectedTransaksi && (
        <Button
          className="w-full sm:w-auto"
          onClick={() => setPrintTransaksi(selectedTransaksi)}
        >
          <Printer className="h-4 w-4 mr-1" /> Cetak Nota
        </Button>
      )}
    </DialogFooter>
  </DialogContent>
</Dialog>


      {printTransaksi && (
        <NotaPembelian transaksi={printTransaksi} onClose={() => setPrintTransaksi(null)} />
      )}
    </div>
  )
}
