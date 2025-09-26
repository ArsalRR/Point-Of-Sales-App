import React, { useState, useEffect, useMemo } from 'react'
import { getProduk, deleteProduk } from '../../api/Produkapi'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  DollarSign,
  Archive,
  ShoppingCart,
  Tag,
  Plus, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Package,
  AlertCircle,
  Loader2,
  Trash,
  Edit

} from 'lucide-react'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'


export default function ListProduk() {
  const [produk, setProduk] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('nama_barang')
  const [sortOrder, setSortOrder] = useState('asc')
  const [filterStok, setFilterStok] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const hapusData = async (id) => {
    try {
      setLoading(true)
      
      await deleteProduk(id)
      setProduk(prevProduk => prevProduk.filter(item => item.id !== id))
      
      Swal.fire({
        title: "Produk berhasil dihapus",
      icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500
      })
    } catch (err) {
      setError('Gagal menghapus produk')
      console.error('Error deleting product:', err)
      
      Swal.fire({
        title: "Gagal menghapus produk",
        type: "error",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const data = await getProduk()
        setProduk(data)
        setError(null)
      } catch (err) {
        setError('Gagal memuat data produk')
        console.error('Error fetching products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])
  const filteredAndSortedProduk = useMemo(() => {
    let filtered = produk.filter(item => {
      const matchesSearch = 
        item.nama_barang?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.kode_barang?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.satuan_barang?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStockFilter = 
        filterStok === 'all' ||
        (filterStok === 'in-stock' && item.stok > 0) ||
        (filterStok === 'low-stock' && item.stok > 0 && item.stok <= 10) ||
        (filterStok === 'out-of-stock' && item.stok === 0)

      return matchesSearch && matchesStockFilter
    })

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]
      if (sortBy === 'harga' || sortBy === 'harga_renteng' || sortBy === 'stok') {
        aVal = Number(aVal) || 0
        bVal = Number(bVal) || 0
      }

      // Handle string sorting
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return filtered
  }, [produk, searchQuery, sortBy, sortOrder, filterStok])
  const totalPages = Math.ceil(filteredAndSortedProduk.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredAndSortedProduk.slice(startIndex, endIndex)
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterStok, sortBy, sortOrder])
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1)
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  const getStockBadge = (stok) => {
    if (stok === 0) {
      return <Badge variant="destructive">Habis</Badge>
    } else if (stok <= 10) {
      return <Badge variant="secondary">Sedikit</Badge>
    } else {
      return <Badge variant="default">Tersedia</Badge>
    }
  }
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };
  if (loading) {
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

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <h2 className="text-xl font-semibold">List Produk</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {filteredAndSortedProduk.length} produk
              </span>
            </div>
           <Link to="/produk/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Tambah Produk
              </Button>
            </Link>
          </div>
        </div>

        <div className="p-6">
          {/* Controls */}
          <div className="flex flex-col gap-4 mb-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama, kode, atau satuan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filters and Sort */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="nama_barang">Nama Barang</option>
                <option value="kode_barang">Kode Barang</option>
                <option value="harga">Harga</option>
                <option value="stok">Stok</option>
              </select>

              <select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="asc">A-Z / Rendah</option>
                <option value="desc">Z-A / Tinggi</option>
              </select>

              <select 
                value={filterStok} 
                onChange={(e) => setFilterStok(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Semua Stok</option>
                <option value="in-stock">Tersedia</option>
                <option value="low-stock">Stok Sedikit</option>
                <option value="out-of-stock">Habis</option>
              </select>

              <select 
                value={itemsPerPage.toString()} 
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="5">5 item</option>
                <option value="10">10 item</option>
                <option value="25">25 item</option>
                <option value="50">50 item</option>
              </select>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="rounded-md border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode Barang</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Barang</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Harga Renteng</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stok</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Satuan</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.length > 0 ? (
                    currentItems.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {startIndex + index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {item.kode_barang}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.nama_barang}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          {formatCurrency(item.harga)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(item.harga_renteng)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                          {item.stok}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.satuan_barang}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStockBadge(item.stok)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
                                  hapusData(item.id);
                                }
                              }}
                              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <Package className="h-8 w-8 mx-auto mb-4 opacity-50" />
                          <p>Tidak ada produk yang ditemukan</p>
                          <p className="text-sm">Coba ubah kriteria pencarian</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {currentItems.length > 0 ? (
              currentItems.map((item, index) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                            #{startIndex + index + 1}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-mono font-medium bg-blue-100 text-blue-800">
                            {item.kode_barang}
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg leading-tight text-gray-900">
                          {item.nama_barang}
                        </h3>
                      </div>
                      <div className="flex gap-1">
                        <button className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
                              hapusData(item.id);
                            }
                          }}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Harga Satuan</p>
                            <p className="font-semibold text-gray-900">{formatCurrency(item.harga)}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Archive className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Stok</p>
                            <p className="font-semibold text-gray-900">{item.stok} {item.satuan_barang}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <ShoppingCart className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Harga Renteng</p>
                            <p className="font-semibold text-gray-900">{formatCurrency(item.harga_renteng)}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Tag className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <div className="mt-1">
                              {getStockBadge(item.stok)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="text-center py-12">
                  <div className="text-gray-500">
                    <Package className="h-8 w-8 mx-auto mb-4 opacity-50" />
                    <p>Tidak ada produk yang ditemukan</p>
                    <p className="text-sm">Coba ubah kriteria pencarian</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <div className="text-sm text-gray-500">
                Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredAndSortedProduk.length)} dari {filteredAndSortedProduk.length} produk
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Sebelumnya</span>
                </button>
                
                <div className="flex gap-1">
                  {getPageNumbers().map(page => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`w-10 h-10 rounded-md text-sm font-medium ${
                        page === currentPage 
                          ? 'bg-blue-500 text-white' 
                          : 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
}