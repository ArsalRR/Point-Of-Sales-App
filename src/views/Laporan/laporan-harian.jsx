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

// ---------------- Nota ----------------
const NotaPembelian = ({ transaksi, onClose }) => {
  useEffect(() => {
    if (!transaksi) return
    const timer = setTimeout(() => {
      window.print()
      setTimeout(() => {
        onClose()
      }, 800)
    }, 500)
    return () => clearTimeout(timer)
  }, [transaksi, onClose])

  const formatCurrency = (val) => `Rp ${Number(val).toLocaleString("id-ID")}`

  const currentDate = new Date().toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  if (!transaksi) return null

  const total = transaksi.items.reduce(
    (acc, item) =>
      acc + item.jumlah_terjual_per_hari * item.harga_saat_transaksi - (item.diskon || 0),
    0
  )

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="w-full max-w-sm mx-auto p-4">
        {/* Print styles */}
        <style jsx>{`
          @media print {
            body * { visibility: hidden; }
            .print-area, .print-area * { visibility: visible; }
            .print-area { position: absolute; left: 0; top: 0; width: 100%; }
            .no-print { display: none !important; }
          }
          @page { size: 58mm auto; margin: 0; padding: 0; }
          .receipt-content { font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.2; width: 160px; margin: 0 auto; }
          .receipt-table { width: 100%; border-collapse: collapse; }
          .receipt-table th, .receipt-table td { border-top: 1px solid #000; padding: 2px; font-size: 10px; }
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

      // 🔑 group by no_transaksi
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

  const formatCurrency = (val) => `Rp ${Number(val).toLocaleString("id-ID")}`

  const calculateTotalKeseluruhan = () =>
    laporan.reduce((acc, trx) => {
      const total = trx.items.reduce(
        (sum, item) =>
          sum + item.jumlah_terjual_per_hari * item.harga_saat_transaksi - (item.diskon || 0),
        0
      )
      return acc + total
    }, 0)

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
              <Button onClick={fetchLaporan} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" /> Muat Ulang
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
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
                    <TableCell colSpan={4} className="text-right font-semibold">
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
          )}
        </CardContent>
      </Card>

      {/* Modal Detail */}
      <Dialog open={!!selectedTransaksi} onOpenChange={() => setSelectedTransaksi(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              🧾 Detail Transaksi: {selectedTransaksi?.no_transaksi}
            </DialogTitle>
          </DialogHeader>
          {selectedTransaksi && (
            <div className="space-y-4">
              <p><strong>Kasir:</strong> {selectedTransaksi.user?.name}</p>
              <p>
                <strong>Tanggal:</strong>{" "}
                {dayjs(selectedTransaksi.waktu_pembelian).locale("id").format("DD MMM YYYY HH:mm")}
              </p>

              <Table>
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
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setSelectedTransaksi(null)}>Tutup</Button>
            {selectedTransaksi && (
              <Button onClick={() => setPrintTransaksi(selectedTransaksi)}>
                <Printer className="h-4 w-4 mr-1" /> Cetak Nota
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cetak Nota */}
      {printTransaksi && (
        <NotaPembelian transaksi={printTransaksi} onClose={() => setPrintTransaksi(null)} />
      )}
    </div>
  )
}
