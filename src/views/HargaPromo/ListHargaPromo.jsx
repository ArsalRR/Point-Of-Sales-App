import { useEffect, useState } from "react"
import { getHargaPromo, deleteHargaPromo } from "@/api/HargaPromoapi"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, Edit, Trash, Search, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Swal from "sweetalert2"
import { Link } from "react-router-dom"
import AddHargaPromoButtom from "@/components/ui/spesialcomponent/AddHargaPromoButtom"

export default function ListHargaPromo() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getHargaPromo()
        setData(Array.isArray(response) ? response : [])
      } catch (error) {
        console.error("Gagal memuat harga promo:", error)
        Swal.fire({
          icon: "error",
          title: "Gagal Memuat Data",
          text: "Terjadi kesalahan saat memuat data promo.",
          confirmButtonColor: "#3085d6",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const hapusData = async (id) => {
    const result = await Swal.fire({
      title: "Apakah Anda yakin?",
      text: "Promo yang dihapus tidak bisa dikembalikan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    })

    if (result.isConfirmed) {
      try {
        await deleteHargaPromo(id)
        setData(data.filter(item => item.id !== id))
        Swal.fire({
          icon: "success",
          title: "Terhapus!",
          position: "top-end",
          toast: true,
          text: "Promo berhasil dihapus.",
          timer: 2000,
          showConfirmButton: false,
        })
      } catch (error) {
        console.error("Gagal menghapus data:", error)
        Swal.fire({
          icon: "error",
          title: "Gagal!",
          text: "Terjadi kesalahan saat menghapus promo.",
          confirmButtonColor: "#3085d6",
        })
      }
    }
  }

  const filteredData = data.filter(item => {
    const namaProduk = item.produk?.nama_barang?.toLowerCase() || ""
    const search = searchTerm.toLowerCase()
    return namaProduk.includes(search) || 
           item.min_qty.toString().includes(search) ||
           item.potongan_harga.toString().includes(search)
  })

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = filteredData.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <Card className="shadow-lg border border-gray-100 rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-gray-50 to-white">
          <CardTitle className="text-xl md:text-2xl font-semibold text-gray-800">
            Daftar Harga Promo
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Cari produk, qty, atau harga..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            {/* Desktop Button */}
            <div className="hidden md:block">
              <AddHargaPromoButtom />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
              <span className="text-gray-600 font-medium">Memuat data...</span>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-base font-medium mb-2">
                {searchTerm ? "Tidak ada hasil" : "Belum ada data promo"}
              </p>
              <p className="text-gray-400 text-sm">
                {searchTerm 
                  ? "Coba kata kunci lain" 
                  : "Klik tombol tambah untuk menambah promo baru"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block rounded-lg border border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-50 hover:to-gray-100">
                      <TableHead className="font-semibold text-gray-700">No</TableHead>
                      <TableHead className="font-semibold text-gray-700">Nama Produk</TableHead>
                      <TableHead className="font-semibold text-gray-700">Harga Jual</TableHead>
                      <TableHead className="font-semibold text-gray-700">Minimal Pembelian</TableHead>
                      <TableHead className="font-semibold text-gray-700">Potongan Harga</TableHead>
                      <TableHead className="text-center font-semibold text-gray-700">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((item, index) => (
                      <TableRow
                        key={item.id}
                        className={`hover:bg-blue-50/50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                        }`}
                      >
                        <TableCell className="font-medium text-gray-900">
                          {startIndex + index + 1 || "-"}
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">
                          {item.produk?.nama_barang || "-"}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          Rp {item.produk.harga.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.min_qty}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-900 font-medium">
                          Rp {item.potongan_harga.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              to={`/hargapromo/edit/${item.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Edit
                            </Link>
                            <button
                              onClick={() => hapusData(item.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              <Trash className="w-3.5 h-3.5" />
                              Hapus
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden space-y-3">
                {currentData.map((item) => (
                  <Card 
                    key={item.id} 
                    className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="pb-3 border-b border-gray-100">
                          <p className="text-xs font-medium text-gray-500 mb-1.5">Nama Produk</p>
                          <p className="font-semibold text-gray-900 text-base">
                            {item.produk?.nama_barang || "-"}
                          </p>
                        </div>
                         <div className="pb-3 border-b border-gray-100">
                          <p className="text-xs font-medium text-gray-500 mb-1.5">Harga Jual</p>
                          <p className="font-semibold text-gray-900 text-base">
                            Rp {item.produk.harga.toLocaleString("id-ID")}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1.5">Minimal Pembelian</p>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                              {item.min_qty}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1.5">Potongan</p>
                            <p className="font-semibold text-gray-900 text-sm">
                              Rp {item.potongan_harga.toLocaleString("id-ID")}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                          <Link
                            to={`/hargapromo/edit/${item.id}`}
                            className="flex-1"
                          >
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="w-full h-9 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800 font-medium"
                            >
                              <Edit className="w-3.5 h-3.5 mr-1.5" />
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => hapusData(item.id)}
                            className="flex-1 h-9 bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 font-medium"
                          >
                            <Trash className="w-3.5 h-3.5 mr-1.5" />
                            Hapus
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 font-medium">
                    Menampilkan <span className="text-gray-900 font-semibold">{startIndex + 1}</span> - <span className="text-gray-900 font-semibold">{Math.min(endIndex, filteredData.length)}</span> dari <span className="text-gray-900 font-semibold">{filteredData.length}</span> data
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-9 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">Prev</span>
                    </Button>
                    
                    <div className="flex gap-1">
                      {[...Array(totalPages)].map((_, index) => {
                        const page = index + 1
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => goToPage(page)}
                              className={`w-9 h-9 p-0 font-semibold ${
                                currentPage === page 
                                  ? 'bg-blue-600 hover:bg-blue-700' 
                                  : 'hover:bg-gray-100'
                              }`}
                            >
                              {page}
                            </Button>
                          )
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} className="px-1 flex items-center text-gray-400">...</span>
                        }
                        return null
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="h-9 disabled:opacity-50"
                    >
                      <span className="hidden sm:inline mr-1">Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

<div className="md:hidden fixed bottom-37 right-6 z-50">
  <Link to="/hargapromo/create">
    <Button 
      size="lg"
      className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95"
    >
      <Plus className="w-6 h-6" />
    </Button>
  </Link>
</div>

    </div>
  )
}