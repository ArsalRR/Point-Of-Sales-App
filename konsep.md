import { ShoppingCart, Scan, Trash2, Plus, Minus, CreditCard, Search, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import NotaPembelian from '../Kasir/NotaPembelian'
import { useKasir } from '@/hooks/useKasir'
import { parseRupiah } from '@/utils/kasirUtils' 
import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Komponen utama untuk halaman Kasir
 */
export default function ListKasir() {
  const kasir = useKasir()
  const [activeCategory, setActiveCategory] = useState('All Items')
  const [displayedProducts, setDisplayedProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const searchTimeoutRef = useRef(null)
  const [visibleProductsCount, setVisibleProductsCount] = useState(10)
  
  // Destructure semua values yang diperlukan
  const {
    // State
    showPrint,
    printData,
    searchQuery,
    setSearchQuery,
    cart,
    isProcessing,
    formData,
    transaksi,
    
    // Refs
    searchInputRef,
    
    // Computed values
    cartSubtotal,
    total,
    paymentStatus,
    
    // Setters untuk state
    setShowPrint,
    setPrintData,
    
    // Cart operations
    updateQty,
    removeItem,
    subtotal,
    handleChangeSatuan,
    
    // Form handlers
    handleDiskonChange,
    handleTotalUangChange,
    
    // Search handlers
    handleSearchSelect,
    
    // Transaction handlers
    handleSubmit,
    
    // Utility functions
    getCurrentPrice,
    getSatuanInfo,
    formatRupiah,
    focusSearchInput
  } = kasir

  // Inisialisasi produk yang ditampilkan - hanya 10 pertama
  useEffect(() => {
    if (transaksi.length > 0) {
      setDisplayedProducts(transaksi.slice(0, 10))
      setIsLoading(false)
    }
  }, [transaksi])

  // Handle product selection
  const handleProductSelect = useCallback((product) => {
    handleSearchSelect(product)
    setSearchTerm('')
    setSearchQuery('')
  }, [handleSearchSelect, setSearchQuery])

  // Perform search dengan optimasi
  const performSearch = useCallback((term) => {
    if (!term.trim()) {
      // Jika search kosong, tampilkan hanya 10 produk pertama
      setDisplayedProducts(transaksi.slice(0, 10))
      setVisibleProductsCount(10)
      return
    }
    
    // Filter produk berdasarkan search query
    const filtered = transaksi.filter(product => 
      product.kode_barang.toLowerCase().includes(term.toLowerCase()) ||
      product.nama_barang.toLowerCase().includes(term.toLowerCase())
    )
    
    // Tampilkan semua hasil search (maks 50 untuk performa)
    const maxDisplay = Math.min(filtered.length, 50)
    setDisplayedProducts(filtered.slice(0, maxDisplay))
  }, [transaksi])

  // Handle search input dengan debounce
  const handleSearchInput = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    setSearchQuery(value)
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Set new timeout dengan debounce 300ms
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value)
    }, 300)
  }

  // Handle Enter key di search
  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      performSearch(searchTerm)
    }
  }

  // Filter products by category
  const handleCategoryChange = useCallback((category) => {
    setActiveCategory(category)
    if (category === 'All Items') {
      // Tampilkan hanya 10 produk untuk kategori All Items
      setDisplayedProducts(transaksi.slice(0, 10))
      setVisibleProductsCount(10)
    } else {
      const filtered = transaksi.filter(product => 
        product.kategori === category
      )
      // Tampilkan maksimal 15 produk per kategori
      const maxDisplay = Math.min(filtered.length, 15)
      setDisplayedProducts(filtered.slice(0, maxDisplay))
    }
  }, [transaksi])

  // Clear search dan reset display
  const handleClearSearch = useCallback(() => {
    setSearchTerm('')
    setSearchQuery('')
    setDisplayedProducts(transaksi.slice(0, 10))
    setVisibleProductsCount(10)
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
  }, [transaksi, setSearchQuery])

  // Load more products (jika tidak dalam mode search)
  const loadMoreProducts = useCallback(() => {
    if (searchTerm.trim()) return // Jangan load more saat search aktif
    
    const currentCount = displayedProducts.length
    const nextCount = Math.min(currentCount + 10, transaksi.length)
    
    if (activeCategory === 'All Items') {
      setDisplayedProducts(transaksi.slice(0, nextCount))
    } else {
      const filtered = transaksi.filter(product => product.kategori === activeCategory)
      setDisplayedProducts(filtered.slice(0, nextCount))
    }
    setVisibleProductsCount(nextCount)
  }, [displayedProducts.length, transaksi, activeCategory, searchTerm])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  // Tampilkan nota pembelian jika showPrint true
  if (showPrint && printData) {
    return (
      <NotaPembelian
        transactionData={printData}
        onClose={() => {
          setShowPrint(false)
          setPrintData(null)
          focusSearchInput(searchInputRef)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-4 md:mb-6 lg:mb-8">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Point of Sale</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">Manage your sales and transactions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
          {/* Left Column: Product List */}
          <div className="lg:col-span-2">
            {/* Search Bar */}
            <div className="mb-4 md:mb-5 lg:mb-6">
              <div className="relative">
                <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                <Input 
                  ref={searchInputRef}
                  value={searchTerm}
                  onChange={handleSearchInput}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search by product code or name..."
                  className="pl-10 md:pl-12 pr-10 md:pr-12 h-12 md:h-14 text-sm md:text-base w-full border-2 border-gray-300 rounded-lg md:rounded-xl"
                  autoComplete="off"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSearch}
                    className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 md:h-10 md:w-10 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Category Tabs - Tablet friendly */}
            <div className="mb-4 md:mb-5 lg:mb-6">
              <div className="flex space-x-1 md:space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                {['All Items', 'Food', 'Drinks', 'Snacks', 'Desserts'].map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium text-sm md:text-base whitespace-nowrap transition-colors flex-shrink-0 ${
                      activeCategory === category 
                        ? 'bg-black text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid - Tablet friendly */}
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4">
                {/* Placeholder untuk loading */}
                {[...Array(6)].map((_, index) => (
                  <Card key={index} className="border-gray-200 animate-pulse">
                    <CardContent className="p-3 md:p-4">
                      <div className="space-y-2 md:space-y-3">
                        <div className="h-3 md:h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-2.5 md:h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="flex justify-between items-center">
                          <div className="h-4 md:h-5 bg-gray-300 rounded w-1/3"></div>
                          <div className="h-7 md:h-8 bg-gray-300 rounded w-16 md:w-20"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : displayedProducts.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Search className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
                </div>
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 text-sm md:text-base">Try a different search term or category</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4">
                  {displayedProducts.map((product) => (
                    <Card 
                      key={product.kode_barang}
                      className="cursor-pointer hover:shadow-md transition-all duration-200 border-gray-200 hover:border-gray-300"
                      onClick={() => handleProductSelect(product)}
                    >
                      <CardContent className="p-3 md:p-4">
                        <div className="space-y-2 md:space-y-3">
                          {/* Product Info */}
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0 mr-2">
                              <h3 className="font-bold text-gray-900 text-sm md:text-base truncate leading-tight">
                                {product.nama_barang}
                              </h3>
                              <p className="text-gray-600 text-xs md:text-sm mt-1 truncate">
                                {product.kode_barang}
                              </p>
                            </div>
                            <Badge className={`${product.stok > 10 ? 'bg-gray-900' : 'bg-red-600'} text-white text-xs px-1.5 py-0.5`}>
                              {product.stok}
                            </Badge>
                          </div>
                          
                          {/* Price and Add Button */}
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-gray-900 text-sm md:text-base">
                                Rp {product.harga.toLocaleString()}
                              </div>
                              <div className="text-gray-500 text-xs">
                                per {product.satuan}
                              </div>
                            </div>
                            <Button 
                              size="sm"
                              className="bg-gray-900 hover:bg-black text-white h-7 md:h-8 px-2 md:px-3 text-xs md:text-sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleProductSelect(product)
                              }}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {/* Load More Button (hanya jika tidak search dan masih ada data) */}
                {!searchTerm.trim() && displayedProducts.length < 
                  (activeCategory === 'All Items' ? transaksi.length : 
                   transaksi.filter(p => p.kategori === activeCategory).length) && (
                  <div className="text-center mt-4 md:mt-5">
                    <Button
                      variant="outline"
                      onClick={loadMoreProducts}
                      className="w-full md:w-auto px-4 py-2"
                    >
                      Load More Products
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column: Cart & Summary - Tablet friendly */}
          <div className="space-y-4 md:space-y-5 lg:space-y-6">
            {/* Cart Section */}
            <Card className="border border-gray-200 bg-white rounded-lg md:rounded-xl shadow-sm">
              <CardHeader className="pb-3 pt-4 md:pb-4 md:pt-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl font-bold text-gray-900">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <span className="text-sm md:text-base lg:text-lg">Current Order</span>
                  </CardTitle>
                  {cart.length > 0 && (
                    <Badge variant="secondary" className="bg-gray-900 text-white px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm font-bold">
                      {cart.length} items
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {cart.length === 0 ? (
                  <div className="text-center py-8 md:py-12">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                      <ShoppingCart className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2">No items in cart</h3>
                    <p className="text-gray-600 text-sm md:text-base">Add products to start order</p>
                  </div>
                ) : (
                  <div className="space-y-2 md:space-y-3 max-h-[300px] md:max-h-[400px] overflow-y-auto pr-2">
                    {cart.map((item) => (
                      <div key={item.kode_barang} className="border border-gray-200 rounded-lg p-2 md:p-3 bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0 mr-2">
                            <h4 className="font-semibold text-gray-900 text-xs md:text-sm truncate">
                              {item.nama_barang}
                            </h4>
                            <div className="flex items-center gap-1 md:gap-2 mt-1">
                              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                {item.kode_barang}
                              </Badge>
                              <span className="text-xs text-gray-600 truncate">
                                Rp {getCurrentPrice(item).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.kode_barang)}
                            className="h-6 w-6 md:h-7 md:w-7 p-0 text-gray-500 hover:text-red-600 flex-shrink-0"
                          >
                            <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 md:gap-2">
                            {/* Satuan Select */}
                            <div className="w-16 md:w-20">
                              <Select
                                value={item.satuan_terpilih || "satuan"}
                                onValueChange={(value) => handleChangeSatuan(item.kode_barang, value)}
                              >
                                <SelectTrigger className="h-6 md:h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="satuan">Satuan</SelectItem>
                                  {item.harga_renteng && <SelectItem value="renteng">Renteng</SelectItem>}
                                  {item.harga_renteng && <SelectItem value="Dus">Dus</SelectItem>}
                                  {item.harga_renteng && <SelectItem value="pack">Pack</SelectItem>}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-0.5 md:gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQty(item.kode_barang, item.jumlah - 1)}
                                className="h-6 w-6 md:h-7 md:w-7 p-0"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="font-medium text-center text-xs md:text-sm w-5 md:w-6">
                                {item.jumlah}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQty(item.kode_barang, item.jumlah + 1)}
                                className="h-6 w-6 md:h-7 md:w-7 p-0"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Subtotal */}
                          <div className="text-right">
                            <div className="font-bold text-gray-900 text-xs md:text-sm">
                              Rp {subtotal(item).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Summary - Tablet friendly */}
            <Card className="border border-gray-200 bg-white rounded-lg md:rounded-xl shadow-sm">
              <CardHeader className="pb-3 pt-4 md:pb-4 md:pt-5">
                <CardTitle className="text-lg md:text-xl font-bold text-gray-900">
                  Ringkasan Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-5">
                <div className="space-y-2 md:space-y-3">
                  <div className="flex justify-between items-center py-1 md:py-2">
                    <span className="text-gray-700 font-medium text-sm md:text-base">
                      Subtotal ({cart.length} item)
                    </span>
                    <span className="font-bold text-gray-900 text-sm md:text-base">
                      Rp {cartSubtotal.toLocaleString()}
                    </span>
                  </div>
                  {formData.diskon && (
                    <div className="flex justify-between items-center py-1 md:py-2">
                      <span className="text-gray-700 font-medium text-sm md:text-base">Diskon</span>
                      <span className="font-bold text-red-600 text-sm md:text-base">
                        -{formatRupiah(parseRupiah(formData.diskon))}
                      </span>
                    </div>
                  )}
                  <Separator className="bg-gray-300" />
                  <div className="flex justify-between items-center py-2 md:py-3">
                    <span className="font-bold text-gray-900 text-base md:text-lg">Total</span>
                    <span className="font-bold text-gray-900 text-lg md:text-2xl">
                      Rp {total.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 md:space-y-4">        
                  <div>
                    <Label htmlFor="diskon" className="font-semibold text-gray-800 mb-1 md:mb-2 block text-sm md:text-base">
                      Potongan Harga
                    </Label>
                    <Input 
                      id="diskon"
                      type="text" 
                      name="diskon" 
                      value={formData.diskon} 
                      onChange={handleDiskonChange}
                      placeholder="Diskon otomatis"
                      className="h-10 md:h-12 text-sm md:text-base border border-gray-300 rounded-lg" 
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <Label htmlFor="total_uang" className="font-semibold text-gray-800 mb-1 md:mb-2 block text-sm md:text-base">
                      Total Uang
                    </Label>
                    <Input 
                      id="total_uang"
                      type="text" 
                      name="total_uang" 
                      value={formData.total_uang} 
                      onChange={handleTotalUangChange}
                      placeholder="Masukkan uang dibayar"
                      className="h-10 md:h-12 text-sm md:text-base border border-gray-300 rounded-lg"
                      autoComplete="off"
                    />
                  </div>
                  
                  {formData.total_uang && (
                    <div className={`rounded-lg p-3 md:p-4 shadow-sm transition-all duration-300 ${
                      paymentStatus.status === 'insufficient' 
                        ? 'bg-red-50 border border-red-200' 
                        : paymentStatus.status === 'overpaid' 
                        ? 'bg-green-50 border border-green-200'
                        : paymentStatus.status === 'exact'
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50 border border-gray-200'
                    }`}>
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className={`p-1.5 md:p-2 rounded-lg ${
                          paymentStatus.status === 'insufficient' ? 'bg-red-100' :
                          paymentStatus.status === 'overpaid' ? 'bg-green-100' :
                          paymentStatus.status === 'exact' ? 'bg-blue-100' :
                          'bg-gray-100'
                        }`}>
                          {paymentStatus.status === 'insufficient' && (
                            <svg className="w-4 h-4 md:w-5 md:h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          {paymentStatus.status === 'overpaid' && (
                            <svg className="w-4 h-4 md:w-5 md:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          {paymentStatus.status === 'exact' && (
                            <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className={`font-semibold mb-0.5 md:mb-1 text-xs md:text-sm ${
                            paymentStatus.status === 'insufficient' ? 'text-red-700' :
                            paymentStatus.status === 'overpaid' ? 'text-green-700' :
                            paymentStatus.status === 'exact' ? 'text-blue-700' :
                            'text-gray-700'
                          }`}>
                            {paymentStatus.status === 'insufficient' ? 'Uang Kurang' :
                            paymentStatus.status === 'overpaid' ? 'Uang Kembalian' :
                            paymentStatus.status === 'exact' ? 'Uang Pas' :
                            'Status Pembayaran'}
                          </p>
                          <p className="font-bold text-gray-900 text-sm md:text-base">
                            {paymentStatus.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleSubmit}
                  disabled={cart.length === 0 || isProcessing}
                  className="w-full h-11 md:h-14 font-bold bg-gray-900 hover:bg-black text-white rounded-lg md:rounded-xl border-2 border-gray-900 hover:border-black shadow-sm md:shadow-md text-sm md:text-base"
                  size="lg"
                >
                  <CreditCard className="w-4 h-4 md:w-6 md:h-6 mr-2 md:mr-3" />
                  {isProcessing ? 'Memproses...' : 'PROSES TRANSAKSI'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}