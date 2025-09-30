import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProduk, deleteProduk } from '../../api/Produkapi'
import { Badge } from '@/components/ui/badge'
import { 
  Search,
  ChevronLeft, ChevronRight, Package, AlertCircle, 
  Loader2, Trash, Edit, Filter, X
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import AddProdukButton from '@/components/ui/spesialcomponent/AddProdukButtom'

export default function ListProduk() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('nama_barang')
  const [sortOrder, setSortOrder] = useState('asc')
  const [filterStok, setFilterStok] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const queryClient = useQueryClient()
  const { data: produk = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['produk'],
    queryFn: getProduk,
    staleTime: 1000 * 60, 
    retry: 2,
  })
  const hapusMutation = useMutation({
    mutationFn: deleteProduk,
    onSuccess: (_, id) => {
      queryClient.setQueryData(['produk'], (oldData = []) =>
        oldData.filter((item) => item.id !== id)
      )
      Swal.fire({
        title: 'Produk berhasil dihapus',
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
      })
    },
    onError: () => {
      Swal.fire({
        title: 'Gagal menghapus produk',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
      })
    },
  })

 const hapusData = (id) => {
  Swal.fire({
    title: "Apakah Anda yakin?",
    text: "Produk yang dihapus tidak bisa dikembalikan!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Ya, hapus!",
    cancelButtonText: "Batal"
  }).then((result) => {
    if (result.isConfirmed) {
      hapusMutation.mutate(id, {
        onSuccess: () => {
          Swal.fire("Terhapus!", "Produk berhasil dihapus.", "success")
        },
        onError: () => {
          Swal.fire("Gagal!", "Terjadi kesalahan saat menghapus.", "error")
        }
      })
    }
  })
}
  const filteredAndSortedProduk = useMemo(() => {
    let filtered = produk.filter((item) => {
      const normalizeText = (text) => text?.toString().toLowerCase().trim().replace(/\s+/g, ' ') || ''
      const query = normalizeText(searchQuery)
      
      if (!query) return true
      
      const searchFields = [
        normalizeText(item.nama_barang),
        normalizeText(item.kode_barang),
        normalizeText(item.satuan_barang),
        normalizeText(item.harga),
        normalizeText(item.harga_renteng),
        normalizeText(item.stok)
      ]
        
      const matchesSearch = searchFields.some(field => 
        field.includes(query) || 
        query.split(' ').every(word => field.includes(word))
      )

      const matchesStockFilter =
        filterStok === 'all' ||
        (filterStok === 'in-stock' && item.stok > 0) ||
        (filterStok === 'low-stock' && item.stok > 0 && item.stok <= 10) ||
        (filterStok === 'out-of-stock' && item.stok === 0)

      return matchesSearch && matchesStockFilter
    })

   filtered.sort((a, b) => {
  let aVal = a[sortBy]
  let bVal = b[sortBy]

  if (['harga', 'harga_renteng', 'stok'].includes(sortBy)) {
    aVal = Number(aVal) || 0
    bVal = Number(bVal) || 0
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
  } else {
    aVal = (aVal || '').toString().toLowerCase()
    bVal = (bVal || '').toString().toLowerCase()
    if (aVal === bVal) return 0
    return sortOrder === 'asc'
      ? aVal > bVal ? 1 : -1
      : aVal < bVal ? 1 : -1
  }
})
    return filtered
  }, [produk, searchQuery, sortBy, sortOrder, filterStok])
  const totalPages = Math.ceil(filteredAndSortedProduk.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredAndSortedProduk.slice(startIndex, endIndex)

  const goToPage = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1)
    }
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }
const getStockBadge = (stok, limit_stok) => {
  if (stok === 0) return <Badge variant="destructive">Habis</Badge>
  if (stok <= limit_stok) return <Badge variant="secondary">Sedikit</Badge>
  return <Badge variant="default">Tersedia</Badge>
}


  const formatCurrency = (amount) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)

  // Loading
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Memuat data produk...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error
  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <p className="text-red-600 mb-4">Gagal memuat data produk</p>
            <button
              onClick={refetch}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <h2 className="text-xl font-semibold">List Produk</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {filteredAndSortedProduk.length} produk
            </span>
          </div>
         <AddProdukButton/>
        </div>

        {/* Search + Filter */}
        <div className="p-4 sm:p-6">
          {/* Enhanced Search Input */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Cari produk (nama, kode, satuan, harga, stok)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1) // Reset ke halaman pertama saat search
                }}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Desktop Filters - Full width */}
            <div className="hidden lg:grid lg:grid-cols-4 gap-3">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="nama_barang">Nama Barang</option>
                <option value="kode_barang">Kode Barang</option>
                <option value="harga">Harga</option>
                <option value="stok">Stok</option>
              </select>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="asc">A-Z / Rendah</option>
                <option value="desc">Z-A / Tinggi</option>
              </select>
              <select value={filterStok} onChange={(e) => setFilterStok(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="all">Semua Stok</option>
                <option value="in-stock">Tersedia</option>
                <option value="low-stock">Stok Sedikit</option>
                <option value="out-of-stock">Habis</option>
              </select>
              <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="5">5 item</option>
                <option value="10">10 item</option>
                <option value="25">25 item</option>
                <option value="50">50 item</option>
              </select>
            </div>

            {/* Mobile Filter Toggle */}
            <div className="lg:hidden flex items-center justify-between">
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Filter className="h-4 w-4" />
                <span>Filter & Urutkan</span>
              </button>
              <span className="text-sm text-gray-500">
                {filteredAndSortedProduk.length} hasil
              </span>
            </div>

            {/* Mobile Filters Dropdown */}
            {showMobileFilters && (
              <div className="lg:hidden bg-gray-50 rounded-lg p-4 space-y-3 border">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Urutkan</label>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                      <option value="nama_barang">Nama</option>
                      <option value="kode_barang">Kode</option>
                      <option value="harga">Harga</option>
                      <option value="stok">Stok</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Arah</label>
                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                      <option value="asc">↑ Naik</option>
                      <option value="desc">↓ Turun</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Status Stok</label>
                    <select value={filterStok} onChange={(e) => setFilterStok(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                      <option value="all">Semua</option>
                      <option value="in-stock">Tersedia</option>
                      <option value="low-stock">Sedikit</option>
                      <option value="out-of-stock">Habis</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Per Halaman</label>
                    <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="25">25</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Card View - Hidden on Desktop */}
          <div className="block lg:hidden">
            {currentItems.length > 0 ? (
              <div className="space-y-4">
                {currentItems.map((item, index) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-base leading-tight mb-1 truncate">
                              {item.nama_barang}
                            </h3>
                            <p className="text-sm text-gray-500 font-mono">{item.kode_barang}</p>
                          </div>
                           {getStockBadge(item.stok, item.limit_stok)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">Harga</p>
                        <p className="font-semibold text-green-600 text-base">{formatCurrency(item.harga)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">Harga Renteng</p>
                        <p className="font-semibold text-green-600 text-base">{formatCurrency(item.harga_renteng)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">Stok</p>
                        <p className="font-semibold text-gray-900 text-base">{item.stok}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">Satuan</p>
                        <p className="font-semibold text-gray-900 text-base">{item.satuan_barang}</p>
                      </div>
                    </div>

                    {/* Enhanced Action Buttons */}
                    <div className="flex gap-3 pt-3 border-t border-gray-100">
                      <Link 
                        to={`/produk/edit/${item.id}`} 
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </Link>
                      <button 
                        onClick={() => hapusData(item.id)} 
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
                      >
                        <Trash className="h-4 w-4" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-lg mb-2">Tidak ada produk ditemukan</p>
                {searchQuery && (
                  <p className="text-gray-400 text-sm">
                    Coba ubah kata kunci pencarian Anda
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Desktop Table View - Hidden on Mobile */}
          <div className="hidden lg:block">
            <div className="rounded-md border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">No</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Kode Barang</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Nama Barang</th>
                    <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase">Harga</th>
                    <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase">Harga Renteng</th>
                    <th className="px-6 py-3 text-center text-xs text-gray-500 uppercase">Stok</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Satuan</th>
                    <th className="px-6 py-3 text-center text-xs text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-center text-xs text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.length > 0 ? (
                    currentItems.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm">{startIndex + index + 1}</td>
                        <td className="px-6 py-4 text-sm font-mono">{item.kode_barang}</td>
                        <td className="px-6 py-4 text-sm">{item.nama_barang}</td>
                        <td className="px-6 py-4 text-sm text-right">{formatCurrency(item.harga)}</td>
                        <td className="px-6 py-4 text-sm text-right">{formatCurrency(item.harga_renteng)}</td>
                        <td className="px-6 py-4 text-sm text-center">{item.stok}</td>
                        <td className="px-6 py-4 text-sm">{item.satuan_barang}</td>
                        <td className="px-6 py-4 text-center">  {getStockBadge(item.stok, item.limit_stok)}</td>
                        <td className="px-6 py-4 text-center flex gap-2 justify-center">
                          <Link to={`/produk/edit/${item.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button onClick={() => hapusData(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                            <Trash className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                        <Package className="h-8 w-8 mx-auto mb-4 opacity-50" />
                        <p>Tidak ada produk yang ditemukan</p>
                        {searchQuery && (
                          <p className="text-sm text-gray-400 mt-2">
                            Coba ubah kata kunci pencarian Anda
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
              <p className="text-sm text-gray-500 order-2 sm:order-1">
                Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredAndSortedProduk.length)} dari {filteredAndSortedProduk.length} produk
              </p>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <button 
                  onClick={() => goToPage(currentPage - 1)} 
                  disabled={currentPage === 1}
                  className="px-3 py-2 border rounded-md disabled:opacity-50 flex items-center gap-1 text-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Sebelumnya</span>
                </button>
                
                <div className="hidden sm:flex items-center gap-2">
                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`w-10 h-10 rounded-md text-sm ${
                        page === currentPage ? 'bg-blue-500 text-white' : 'border text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                {/* Mobile pagination info */}
                <div className="sm:hidden px-3 py-2 text-sm text-gray-500">
                  {currentPage} / {totalPages}
                </div>
                
                <button 
                  onClick={() => goToPage(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border rounded-md disabled:opacity-50 flex items-center gap-1 text-sm"
                >
                  <span className="hidden sm:inline">Selanjutnya</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}