import React, { useEffect, useState, useCallback } from "react"
import dayjs from "dayjs"
import "dayjs/locale/id"
import { getlaporanharian } from "@/api/Laporanapi"
import {
  Loader2, RefreshCw, FileText, Eye, Printer,
  Receipt, ShoppingBag, Search, X, Package, ArrowUp
} from "lucide-react"
import {
  Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import NotaPembelian from "../Kasir/NotaPembelian"

const formatCurrency = (val) => `Rp ${Number(val).toLocaleString("id-ID")}`

const calculateTotalItemsSold = (items) => {
  return items.reduce((total, item) => total + item.jumlah_terjual_per_hari, 0)
}
const calculateUniqueProductsSold = (items) => {
  const uniqueProducts = new Set(items.map(item => item.produk?.id || item.produk?.nama_barang))
  return uniqueProducts.size
}
 const date = new Date().toLocaleString("id-ID")
   const rupiah = (v) =>
    new Intl.NumberFormat("id-ID").format(v)



const MobileTransactionCard = ({ trx, idx, onViewDetail }) => {
  const total = trx.items.reduce(
    (sum, i) =>
      sum + i.jumlah_terjual_per_hari * i.harga_saat_transaksi - (i.diskon || 0),
    0
  )
  const totalItems = calculateTotalItemsSold(trx.items)
  const uniqueProducts = calculateUniqueProductsSold(trx.items)

  return (
    <Card className="w-full border border-gray-300 hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs font-mono bg-gray-100 text-gray-800">
              #{idx + 1}
            </Badge>
            <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-800">
              {trx.no_transaksi}
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency(total)}
            </div>
          </div>
        </div>

        {/* Nama Barang */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Package className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Produk:</span>
          </div>
          <div className="space-y-1">
            {trx.items.slice(0, 3).map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{item.produk?.nama_barang || "Produk tidak ditemukan"}</span>
                <Badge variant="outline" className="text-xs border-gray-300">
                  {item.jumlah_terjual_per_hari}x
                </Badge>
              </div>
            ))}
            {trx.items.length > 3 && (
              <div className="text-xs text-gray-500 pt-1">
                +{trx.items.length - 3} produk lainnya
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-2 mb-4 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="h-4 w-4" />
              <span>Total Barang: {totalItems}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Jenis: {uniqueProducts}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Receipt className="h-4 w-4" />
            <span>{dayjs(trx.waktu_pembelian).locale("id").format("DD MMM YYYY HH:mm")}</span>
          </div>
        </div>

        <Separator className="my-3 border-gray-300" />

        <Button 
          onClick={() => onViewDetail(trx)} 
          variant="outline" 
          size="sm" 
          className="w-full border-gray-300 text-gray-800 hover:bg-gray-100"
        >
          <Eye className="h-4 w-4 mr-2" /> Lihat Detail
        </Button>
      </CardContent>
    </Card>
  )
}

// Komponen untuk menampilkan hasil pencarian produk
const ProductSearchResults = ({ searchTerm, laporan }) => {
  if (!searchTerm || searchTerm.trim() === "") return null
  
  // Kumpulkan semua produk dari semua transaksi
  const allProducts = []
  laporan.forEach(trx => {
    trx.items.forEach(item => {
      if (item.produk?.nama_barang) {
        const existingProduct = allProducts.find(p => 
          p.nama_barang.toLowerCase() === item.produk.nama_barang.toLowerCase()
        )
        
        if (existingProduct) {
          existingProduct.totalTerjual += item.jumlah_terjual_per_hari
          existingProduct.totalTransaksi += 1
          existingProduct.totalHarga += item.jumlah_terjual_per_hari * item.harga_saat_transaksi
        } else {
          allProducts.push({
            nama_barang: item.produk.nama_barang,
            totalTerjual: item.jumlah_terjual_per_hari,
            totalTransaksi: 1,
            totalHarga: item.jumlah_terjual_per_hari * item.harga_saat_transaksi
          })
        }
      }
    })
  })
  
  // Filter produk berdasarkan search term
  const filteredProducts = allProducts.filter(product =>
    product.nama_barang.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => b.totalTerjual - a.totalTerjual)
  
  if (filteredProducts.length === 0) {
    return (
      <Card className="border border-gray-300">
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Tidak ditemukan produk dengan nama "{searchTerm}"</p>
        </CardContent>
      </Card>
    )
  }
  
  // Hitung total keseluruhan untuk produk yang ditemukan
  const totalSemuaBarang = filteredProducts.reduce((sum, product) => sum + product.totalTerjual, 0)
  const totalSemuaHarga = filteredProducts.reduce((sum, product) => sum + product.totalHarga, 0)
  
  return (
    <Card className="border border-gray-300">
      <CardHeader>
        <CardTitle className="text-gray-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Hasil Pencarian: "{searchTerm}"</span>
          </div>
          <Badge variant="outline" className="border-gray-300 text-gray-800">
            {filteredProducts.length} produk ditemukan
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total Barang Terjual</p>
                <p className="text-2xl font-bold text-gray-900">{totalSemuaBarang}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Nilai Penjualan</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSemuaHarga)}</p>
              </div>
            </div>
          </div>
          
          {/* Daftar Produk */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-300">
                  <TableHead className="text-gray-900 font-semibold">Nama Barang</TableHead>
                  <TableHead className="text-gray-900 font-semibold text-center">Jumlah Terjual</TableHead>
                  <TableHead className="text-gray-900 font-semibold text-center">Transaksi</TableHead>
                  <TableHead className="text-gray-900 font-semibold text-right">Total Nilai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product, idx) => (
                  <TableRow key={idx} className="border-gray-300 hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900">{product.nama_barang}</TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                        {product.totalTerjual} barang
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-gray-900">
                      {product.totalTransaksi}x
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-900">
                      {formatCurrency(product.totalHarga)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Mobile View untuk hasil pencarian */}
          <div className="md:hidden space-y-3">
            {filteredProducts.map((product, idx) => (
              <Card key={idx} className="border border-gray-300">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{product.nama_barang}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Terjual</p>
                        <p className="text-xl font-bold text-gray-900">{product.totalTerjual}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Transaksi</p>
                        <p className="text-xl font-bold text-gray-900">{product.totalTransaksi}x</p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-300">
                      <p className="text-sm text-gray-600">Total Nilai</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(product.totalHarga)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
const ScrollToTopButton = ({ visible, onClick }) => {
  if (!visible) return null
  
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-24 right-6 z-50 rounded-full w-10 h-10 p-0 bg-gray-900 hover:bg-gray-800 shadow-lg"
      size="icon"
    >
      <ArrowUp className="h-5 w-5 text-white" />
    </Button>
  )
}

export default function LaporanHarian() {
  const [laporan, setLaporan] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTransaksi, setSelectedTransaksi] = useState(null)
  const [printTransaksi, setPrintTransaksi] = useState(null)
  const [searchProduct, setSearchProduct] = useState("")
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [detailScrollArea, setDetailScrollArea] = useState(null)

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

  const handleSearch = (e) => {
    const value = e.target.value
    setSearchProduct(value)
    setShowSearchResults(value.trim() !== "")
  }

  const clearSearch = () => {
    setSearchProduct("")
    setShowSearchResults(false)
  }

  const calculateTotalKeseluruhan = () =>
    laporan.reduce((acc, trx) => {
      const total = trx.items.reduce(
        (sum, item) =>
          sum + item.jumlah_terjual_per_hari * item.harga_saat_transaksi - (item.diskon || 0),
        0
      )
      return acc + total
    }, 0)

  const calculateTotalBarangTerjual = () =>
    laporan.reduce((total, trx) => total + calculateTotalItemsSold(trx.items), 0)

  const calculateTotalProdukUnikTerjual = () => {
    const allProductIds = laporan.flatMap(trx => 
      trx.items.map(item => item.produk?.id || item.produk?.nama_barang)
    )
    const uniqueProducts = new Set(allProductIds.filter(id => id))
    return uniqueProducts.size
  }

  // Handle scroll untuk tombol scroll to top
  const handleDetailScroll = (e) => {
    if (e.target.scrollTop > 100) {
      setShowScrollTop(true)
    } else {
      setShowScrollTop(false)
    }
  }

  const scrollToTop = () => {
    if (detailScrollArea) {
      detailScrollArea.scrollTop = 0
    }
  }
  const setDetailScrollRef = (ref) => {
    if (ref) {
      setDetailScrollArea(ref)
      ref.addEventListener('scroll', handleDetailScroll)
    }
  }
  useEffect(() => {
    return () => {
      if (detailScrollArea) {
        detailScrollArea.removeEventListener('scroll', handleDetailScroll)
      }
    }
  }, [detailScrollArea])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-80">
        <Loader2 className="h-6 w-6 animate-spin mr-2 text-gray-700" />
        <span className="text-gray-700">Memuat data laporan...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6 border border-gray-300">
        <div className="text-center">
          <p className="text-red-600">❌ {error}</p>
          <Button 
            onClick={fetchLaporan} 
            variant="outline" 
            className="mt-3 border-gray-300 text-gray-800 hover:bg-gray-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Muat Ulang
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border border-gray-300">
        <CardContent className="p-6">
          <div className="relative">
            <div className="flex items-center space-x-2 mb-2">
              <Search className="h-5 w-5 text-gray-700" />
              <span className="text-sm font-medium text-gray-900">Cari Produk</span>
            </div>
            <div className="relative">
              <Input
                type="text"
                placeholder="Ketik nama barang untuk melihat jumlah terjual..."
                value={searchProduct}
                onChange={handleSearch}
                className="pr-10 border-gray-300 focus:border-gray-400"
              />
              {searchProduct && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4 text-gray-500" />
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Cari produk untuk melihat total jumlah terjual dan nilai penjualan
            </p>
          </div>
        </CardContent>
      </Card>
      {showSearchResults && (
        <ProductSearchResults 
          searchTerm={searchProduct} 
          laporan={laporan} 
        />
      )}
      <Card className="border border-gray-300">
        <CardHeader className="border-b border-gray-300">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-2">
              <Receipt className="h-5 w-5 text-gray-900" />
              <span className="text-gray-900">Laporan Penjualan Harian</span>
            </div>
            <div className="flex items-center space-x-3 mt-2 sm:mt-0">
              <Badge variant="outline" className="text-sm border-gray-300 text-gray-800">
                {dayjs().locale("id").format("DD MMM YYYY")}
              </Badge>
              <Badge className="bg-gray-900 text-white">
                {calculateTotalBarangTerjual()} barang terjual
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {laporan.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <FileText className="h-12 w-12 text-gray-400" />
              <h4 className="text-lg font-semibold text-gray-700">Tidak Ada Transaksi</h4>
              <Button 
                onClick={fetchLaporan} 
                variant="outline"
                className="border-gray-300 text-gray-800 hover:bg-gray-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Muat Ulang
              </Button>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-300">
                      <TableHead className="text-gray-900 font-semibold">No</TableHead>
                      <TableHead className="text-gray-900 font-semibold">No. Transaksi</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Nama Barang</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Tanggal</TableHead>
                      <TableHead className="text-gray-900 font-semibold text-right">Jml Barang</TableHead>
                      <TableHead className="text-gray-900 font-semibold text-right">Total</TableHead>
                      <TableHead className="text-gray-900 font-semibold text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {laporan.map((trx, idx) => {
                      const total = trx.items.reduce(
                        (sum, i) =>
                          sum + i.jumlah_terjual_per_hari * i.harga_saat_transaksi - (i.diskon || 0),
                        0
                      )
                      const totalItems = calculateTotalItemsSold(trx.items)
                      const uniqueProducts = calculateUniqueProductsSold(trx.items)
                      
                      return (
                        <TableRow key={trx.no_transaksi} className="border-gray-300 hover:bg-gray-50">
                          <TableCell className="font-medium text-gray-900">{idx + 1}</TableCell>
                          <TableCell className="text-gray-900 font-mono text-sm">{trx.no_transaksi}</TableCell>
                          <TableCell className="text-gray-900 max-w-xs">
                            <div className="space-y-1">
                              {trx.items.slice(0, 2).map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                  <span className="truncate">{item.produk?.nama_barang || "Produk tidak ditemukan"}</span>
                                  <Badge variant="outline" className="ml-2 text-xs border-gray-300">
                                    {item.jumlah_terjual_per_hari}x
                                  </Badge>
                                </div>
                              ))}
                              {trx.items.length > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{trx.items.length - 2} produk lainnya
                                </div>
                              )}
                              {uniqueProducts > 1 && (
                                <div className="text-xs text-gray-500">
                                  {uniqueProducts} jenis produk
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-900">
                            {dayjs(trx.waktu_pembelian).locale("id").format("DD MMM YYYY HH:mm")}
                          </TableCell>
                          <TableCell className="text-right text-gray-900">
                            <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                              {totalItems} barang
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium text-gray-900">
                            {formatCurrency(total)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setSelectedTransaksi(trx)}
                              className="border-gray-300 text-gray-800 hover:bg-gray-100"
                            >
                              <Eye className="h-4 w-4" /> Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    <TableRow className="border-gray-300 bg-gray-50">
                      <TableCell colSpan={3} className="text-right font-semibold text-gray-900">
                        TOTAL KESELURUHAN
                      </TableCell>
                      <TableCell className="text-gray-900">
                        <div className="text-sm text-gray-600">
                          {calculateTotalProdukUnikTerjual()} jenis produk
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-900">
                        <Badge className="bg-gray-900 text-white">
                          {calculateTotalBarangTerjual()} barang
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-gray-900">
                        {formatCurrency(calculateTotalKeseluruhan())}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {laporan.map((trx, idx) => (
                  <MobileTransactionCard
                    key={trx.no_transaksi}
                    trx={trx}
                    idx={idx}
                    onViewDetail={setSelectedTransaksi}
                  />
                ))}
                <Card className="border-2 border-gray-300 bg-gray-50">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Receipt className="h-5 w-5 text-gray-900" />
                          <span className="font-semibold text-gray-900">Total Keseluruhan</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900">
                          {formatCurrency(calculateTotalKeseluruhan())}
                        </div>
                      </div>
                      <Separator className="border-gray-300" />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Barang Terjual</p>
                          <p className="text-2xl font-bold text-gray-900">{calculateTotalBarangTerjual()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Jenis Produk</p>
                          <p className="text-2xl font-bold text-gray-900">{calculateTotalProdukUnikTerjual()}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog untuk detail transaksi */}
      <Dialog open={!!selectedTransaksi} onOpenChange={() => setSelectedTransaksi(null)}>
        <DialogContent className="w-full h-full sm:h-auto sm:max-w-4xl sm:rounded-lg p-0 gap-0 border border-gray-300 flex flex-col">
          <DialogHeader className="sticky top-0 bg-white z-10 p-4 border-b border-gray-300 shrink-0">
            <DialogTitle className="text-sm sm:text-lg font-bold pr-8 text-gray-900">
              Detail Transaksi
            </DialogTitle>
            {/* Tambahkan DialogDescription untuk aksesibilitas */}
            <DialogDescription className="sr-only">
              Detail lengkap transaksi {selectedTransaksi?.no_transaksi} termasuk daftar barang, 
              harga, diskon, dan total pembayaran.
            </DialogDescription>
            <p className="text-xs text-gray-600 font-normal mt-1">
              No. Transaksi: {selectedTransaksi?.no_transaksi}
            </p>
          </DialogHeader>

          {selectedTransaksi && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="shrink-0 p-4 border-b border-gray-300">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-300">
                    <p className="text-xs text-gray-600 mb-1">No. Transaksi</p>
                    <p className="text-sm font-semibold truncate text-gray-900 font-mono">
                      {selectedTransaksi.no_transaksi}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-300">
                    <p className="text-xs text-gray-600 mb-1">Tanggal</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {dayjs(selectedTransaksi.waktu_pembelian)
                        .locale("id")
                        .format("DD MMM YYYY")}
                    </p>
                    <p className="text-xs text-gray-600">
                      {dayjs(selectedTransaksi.waktu_pembelian)
                        .locale("id")
                        .format("HH:mm")}
                    </p>
                  </div>
                </div>
              </div>
              <div 
                ref={setDetailScrollRef}
                className="flex-1 overflow-y-auto p-4"
                style={{ maxHeight: 'calc(80vh - 200px)' }}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-900">Daftar Barang</h3>
                    <div className="text-sm">
                      <span className="text-gray-600">Total: </span>
                      <span className="font-semibold text-gray-900">
                        {calculateTotalItemsSold(selectedTransaksi.items)} barang
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="overflow-x-auto">
                      <Table className="text-sm">
                        <TableHeader>
                          <TableRow className="border-gray-300 sticky top-0 bg-white">
                            <TableHead className="text-gray-900 whitespace-nowrap">Nama Barang</TableHead>
                            <TableHead className="text-gray-900 text-center whitespace-nowrap">Jumlah</TableHead>
                            <TableHead className="text-gray-900 text-right whitespace-nowrap">Harga</TableHead>
                            <TableHead className="text-gray-900 text-right whitespace-nowrap">Diskon</TableHead>
                            <TableHead className="text-gray-900 text-right whitespace-nowrap">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedTransaksi.items.map((i, idx) => (
                            <TableRow key={idx} className="border-gray-300 hover:bg-gray-50">
                              <TableCell className="whitespace-pre-wrap break-words text-gray-900 max-w-xs">
                                {i.produk?.nama_barang || "Produk tidak ditemukan"}
                              </TableCell>
                              <TableCell className="text-center text-gray-900">
                                <Badge variant="outline" className="border-gray-300">
                                  {i.jumlah_terjual_per_hari}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-gray-900">
                                {formatCurrency(i.harga_saat_transaksi)}
                              </TableCell>
                              <TableCell className="text-right text-red-600">
                                {i.diskon ? `- ${formatCurrency(i.diskon)}` : "-"}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-gray-900">
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

                  {/* Mobile View - Cards */}
                  <div className="sm:hidden space-y-2">
                    {selectedTransaksi.items.map((i, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg space-y-2 border border-gray-300">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-sm font-medium flex-1 leading-tight text-gray-900">
                            {i.produk?.nama_barang || "Produk tidak ditemukan"}
                          </p>
                          <span className="text-xs bg-white px-2 py-1 rounded-md whitespace-nowrap border border-gray-300 text-gray-900">
                            x{i.jumlah_terjual_per_hari}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Harga:</span>
                            <p className="font-medium text-gray-900">
                              {formatCurrency(i.harga_saat_transaksi)}
                            </p>
                          </div>
                          {i.diskon && (
                            <div>
                              <span className="text-gray-600">Diskon:</span>
                              <p className="font-medium text-red-600">
                                - {formatCurrency(i.diskon)}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="pt-2 border-t border-gray-300 flex justify-between items-center">
                          <span className="text-xs text-gray-600">Subtotal</span>
                          <span className="text-sm font-bold text-gray-900">
                            {formatCurrency(
                              i.jumlah_terjual_per_hari * i.harga_saat_transaksi -
                                (i.diskon || 0)
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="shrink-0 p-4 border-t border-gray-300 bg-white">
                <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-300">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium text-gray-900">Total Pembayaran</span>
                      <p className="text-xs text-gray-600">
                        {calculateTotalItemsSold(selectedTransaksi.items)} barang • {calculateUniqueProductsSold(selectedTransaksi.items)} jenis produk
                      </p>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
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
            </div>
          )}
          <ScrollToTopButton visible={showScrollTop} onClick={scrollToTop} />
          <DialogFooter className="shrink-0 bg-white border-t border-gray-300 p-4 flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1 sm:flex-none border-gray-300 text-gray-800 hover:bg-gray-100"
              onClick={() => setSelectedTransaksi(null)}
            >
              Tutup
            </Button>
            {selectedTransaksi && (
              <Button
                className="flex-1 sm:flex-none bg-gray-900 text-white hover:bg-gray-800"
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

 {printTransaksi && (() => {
  const items = printTransaksi.items.map(item => ({
    nama_barang: item.produk?.nama_barang || "Produk",
    jumlah: item.jumlah_terjual_per_hari,
    harga: item.harga_saat_transaksi,
    diskon: item.diskon || 0
  }))
  
  const total = items.reduce(
    (sum, item) => sum + (item.jumlah * item.harga) - item.diskon,
    0
  )
  
  const totalDiskon = items.reduce((sum, item) => sum + item.diskon, 0)
  
  return (
    <NotaPembelian 
      transactionData={{
        items,
        total,
        total_uang: total,
        kembalian: 0,
        diskon: totalDiskon
      }} 
      onClose={() => setPrintTransaksi(null)} 
    />
  )
})()}
    </div>
  )
}