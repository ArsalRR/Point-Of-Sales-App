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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID").format(amount)
  }

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
          * {
            font-size: 12px;
            font-family: 'Times New Roman';
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          td, th, tr, table {
            border-top: 1px solid black;
            border-collapse: collapse;
          }

          td.description, th.description {
            width: 70px;
            max-width: 70px;
          }

          td.quantity, th.quantity {
            width: 30px;
            max-width: 30px;
            word-break: break-word;
          }

          td.price, th.price {
            width: 50px;
            max-width: 50px;
            word-break: break-word;
            text-align: right;
          }

          .centered {
            text-align: center;
            align-content: center;
          }

          .ticket {
            width: 160px;
            max-width: 160px;
            margin: auto;
            margin-bottom: 20px;
          }

          /* hanya struk yang tercetak */
          @media print {
            body * {
              visibility: hidden;
            }
            .ticket, .ticket * {
              visibility: visible;
            }
            .ticket {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }

          @page {
            size: 58mm auto;
            margin: 0;
            padding: 0;
          }
        `}</style>

        <div className="ticket">
          <p className="centered">
            TOKO IFA<br />
            Jl. Perumahan Limas No. 08<br />
            Telp: 085868287956<br />
            {currentDate}<br />
            No Trans: {transaksi.no_transaksi}
          </p>

          <table>
            <thead>
              <tr>
                <th className="quantity">Jml</th>
                <th className="description">Produk</th>
                <th className="price">Rp</th>
              </tr>
            </thead>
            <tbody>
              {transaksi.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="quantity">{item.jumlah_terjual_per_hari}</td>
                  <td className="description">{item.produk?.nama_barang}</td>
                  <td className="price">
                    {formatCurrency(item.jumlah_terjual_per_hari * item.harga_saat_transaksi)}
                  </td>
                </tr>
              ))}
              <tr>
                <td></td>
                <td className="description"><strong>Total</strong></td>
                <td className="price"><strong>{formatCurrency(total)}</strong></td>
              </tr>
            </tbody>
          </table>

          <p className="centered">
            Terima Kasih<br />Atas Kunjungan Anda
          </p>
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
  <DialogContent className="w-full h-full sm:h-auto sm:max-w-2xl sm:rounded-lg p-0 gap-0">
    {/* Header dengan fixed position di mobile */}
    <DialogHeader className="sticky top-0 bg-white z-10 p-4 border-b">
      <DialogTitle className="text-sm sm:text-lg font-bold pr-8">
        Detail Transaksi
      </DialogTitle>
      <p className="text-xs text-muted-foreground font-normal mt-1">
        {selectedTransaksi?.no_transaksi}
      </p>
    </DialogHeader>

    {selectedTransaksi && (
      <div className="flex-1 overflow-y-auto p-4 pb-24 sm:pb-4">
        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Kasir</p>
            <p className="text-sm font-semibold truncate">
              {selectedTransaksi.user?.name}
            </p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Tanggal</p>
            <p className="text-sm font-semibold">
              {dayjs(selectedTransaksi.waktu_pembelian)
                .locale("id")
                .format("DD MMM YYYY")}
            </p>
            <p className="text-xs text-muted-foreground">
              {dayjs(selectedTransaksi.waktu_pembelian)
                .locale("id")
                .format("HH:mm")}
            </p>
          </div>
        </div>

        {/* Items List - Card Style untuk Mobile */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold mb-2">Daftar Produk</h3>
          
          {/* Mobile View - Cards */}
          <div className="block sm:hidden space-y-2">
            {selectedTransaksi.items.map((i, idx) => (
              <div key={idx} className="bg-slate-50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-sm font-medium flex-1 leading-tight">
                    {i.produk?.nama_barang}
                  </p>
                  <span className="text-xs bg-white px-2 py-1 rounded-md whitespace-nowrap">
                    x{i.jumlah_terjual_per_hari}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Harga:</span>
                    <p className="font-medium">
                      {formatCurrency(i.harga_saat_transaksi)}
                    </p>
                  </div>
                  {i.diskon && (
                    <div>
                      <span className="text-muted-foreground">Diskon:</span>
                      <p className="font-medium text-red-500">
                        - {formatCurrency(i.diskon)}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Subtotal</span>
                  <span className="text-sm font-bold">
                    {formatCurrency(
                      i.jumlah_terjual_per_hari * i.harga_saat_transaksi -
                        (i.diskon || 0)
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden sm:block overflow-x-auto -mx-2">
            <Table className="text-sm">
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
                    <TableCell className="whitespace-pre-wrap break-words">
                      {i.produk?.nama_barang}
                    </TableCell>
                    <TableCell className="text-center">
                      {i.jumlah_terjual_per_hari}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(i.harga_saat_transaksi)}
                    </TableCell>
                    <TableCell className="text-right text-red-500">
                      {i.diskon ? `- ${formatCurrency(i.diskon)}` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(
                        i.jumlah_terjual_per_hari * i.harga_saat_transaksi -
                          (i.diskon || 0)
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Total Section */}
        <div className="mt-4 p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Pembayaran</span>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(
                selectedTransaksi.items.reduce(
                  (sum, i) =>
                    sum +
                    (i.jumlah_terjual_per_hari * i.harga_saat_transaksi -
                      (i.diskon || 0)),
                  0
                )
              )}
            </span>
          </div>
        </div>
      </div>
    )}

    {/* Footer Fixed di Mobile */}
    <DialogFooter className="fixed sm:relative bottom-0 left-0 right-0 bg-white border-t p-4 flex-row gap-2 sm:justify-between">
      <Button
        variant="outline"
        className="flex-1 sm:flex-none"
        onClick={() => setSelectedTransaksi(null)}
      >
        Tutup
      </Button>
      {selectedTransaksi && (
        <Button
          className="flex-1 sm:flex-none"
          onClick={() => setPrintTransaksi(selectedTransaksi)}
        >
          <Printer className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Cetak Nota</span>
          <span className="sm:hidden">Cetak</span>
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
