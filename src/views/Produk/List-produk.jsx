import React, { useState, useEffect, useMemo } from 'react'
import { getProduk, deleteProduk } from '../../api/Produkapi'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Search, 
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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Memuat data produk...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <CardTitle>List Produk</CardTitle>
              <Badge variant="secondary">{filteredAndSortedProduk.length} produk</Badge>
            </div>
            <Link to="/produk/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Tambah Produk
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Cari berdasarkan nama, kode, atau satuan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Urutkan berdasarkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nama_barang">Nama Barang</SelectItem>
                <SelectItem value="kode_barang">Kode Barang</SelectItem>
                <SelectItem value="harga">Harga</SelectItem>
                <SelectItem value="stok">Stok</SelectItem>
                <SelectItem value="harga_renteng">Harga Renteng</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full md:w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">A-Z / Rendah</SelectItem>
                <SelectItem value="desc">Z-A / Tinggi</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Stock */}
            <Select value={filterStok} onValueChange={setFilterStok}>
              <SelectTrigger className="w-full md:w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Stok</SelectItem>
                <SelectItem value="in-stock">Tersedia</SelectItem>
                <SelectItem value="low-stock">Stok Sedikit</SelectItem>
                <SelectItem value="out-of-stock">Habis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Items Per Page */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Tampilkan:</span>
            <Select 
              value={itemsPerPage.toString()} 
              onValueChange={(value) => setItemsPerPage(Number(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">item per halaman</span>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">No</TableHead>
                  <TableHead>Kode Barang</TableHead>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                  <TableHead className="text-right">Harga Rentengan</TableHead>
                  <TableHead className="text-center">Stok</TableHead>
                  <TableHead>Satuan Jual</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length > 0 ? (
                  currentItems.map((item, index) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {startIndex + index + 1}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.kode_barang}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.nama_barang}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {new Intl.NumberFormat('id-ID', { 
                          style: 'currency', 
                          currency: 'IDR' 
                        }).format(item.harga)}
                      </TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat('id-ID', { 
                          style: 'currency', 
                          currency: 'IDR' 
                        }).format(item.harga_renteng)}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {item.stok}
                      </TableCell>
                      <TableCell>{item.satuan_barang}</TableCell>
                      <TableCell className="text-center">
                        {getStockBadge(item.stok)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link to={`/produk/edit/${item.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => {
                              Swal.fire({
                                title: 'Apakah anda yakin?',
                                text: "Data produk akan dihapus permanen!",
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#3085d6', 
                                cancelButtonColor: '#d33',
                                confirmButtonText: 'Ya, hapus!',
                                cancelButtonText: 'Batal'
                              }).then((result) => {
                                if (result.isConfirmed) {
                                  hapusData(item.id)
                                }
                              })
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="text-muted-foreground">
                        <Package className="h-8 w-8 mx-auto mb-4 opacity-50" />
                        <p>Tidak ada produk yang ditemukan</p>
                        <p className="text-sm">Coba ubah kriteria pencarian</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredAndSortedProduk.length)} dari {filteredAndSortedProduk.length} produk
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Sebelumnya
                </Button>
                
                <div className="flex gap-1">
                  {getPageNumbers().map(page => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(page)}
                      className="w-10"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Selanjutnya
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}