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
import { useMediaQuery } from '@/hooks/useMediaQuery'

/**
 * Komponen utama untuk halaman Kasir
 */
export default function ListKasir() {
  const kasir = useKasir()
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  
  // Destructure semua values yang diperlukan
  const {
    // State
    showPrint,
    printData,
    searchQuery,
    setSearchQuery,
    showSearchResults,
    setShowSearchResults,
    cart,
    isProcessing,
    formData,
    transaksi,
    
    // Refs
    searchInputRef,
    
    // Computed values
    searchResults,
    cartSubtotal,
    total,
    paymentStatus,
    
    // Setters untuk state
    setShowPrint,
    setPrintData,
    
    // Cart operations
    addProductToCart,
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
    <div className={`min-h-screen bg-gray-50 p-3 md:p-4 ${isTablet ? 'lg:p-4' : 'lg:p-6'}`}>
      <div className={`max-w-6xl mx-auto space-y-3 ${isTablet ? 'md:space-y-4' : 'md:space-y-6'}`}>
        {/* Header Section */}    
        <div className={`grid grid-cols-1 ${
          isTablet ? 'md:grid-cols-3 gap-3' : 'md:grid-cols-5 gap-4 md:gap-6'
        }`}>
          {/* Left Column: Search and Cart */}
          <div className={`space-y-3 ${isTablet ? 'md:col-span-2 md:space-y-4' : 'md:col-span-3 md:space-y-6'}`}>
            {/* Search Section */}
            <Card className={`border border-gray-200 bg-white rounded-xl shadow-sm ${
              isTablet ? 'md:rounded-lg' : ''
            }`}>
              <CardHeader className={`${isTablet ? 'pb-3 pt-4' : 'pb-4 pt-5'}`}>
                <CardTitle className={`flex items-center gap-3 text-gray-900 ${
                  isTablet ? 'text-lg font-bold' : 'text-xl font-bold'
                }`}>
                  <div className={`${isTablet ? 'w-8 h-8' : 'w-10 h-10'} bg-gray-900 rounded-lg flex items-center justify-center`}>
                    <Scan className={`${isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />
                  </div>
                  Tambah Produk
                </CardTitle>
              </CardHeader>
              <CardContent className={`${isTablet ? 'space-y-3' : 'space-y-4'}`}>
                <div className="relative">
                  <Label htmlFor="unified-search" className={`text-gray-800 mb-2 block ${
                    isTablet ? 'text-sm font-semibold' : 'text-base font-semibold'
                  }`}>
                    Scan Barcode / Cari Produk
                  </Label>
                  <div className="relative">
                    <div className="relative flex items-center">
                      <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 ${
                        isTablet ? 'w-5 h-5' : 'w-6 h-6'
                      }`} />
                      <Input 
                        ref={searchInputRef}
                        id="unified-search"
                        value={searchQuery}
                        onChange={(e) => {
                          const value = e.target.value
                          setSearchQuery(value)
                          const exactProduct = transaksi.find(
                            (p) => p.kode_barang.trim() === value.trim()
                          )
                          if (exactProduct && value.length >= 3) {
                            setTimeout(() => {
                              handleSearchSelect(exactProduct)
                            }, 50)
                            return 
                          }
                          setShowSearchResults(value.length > 0)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            const product = transaksi.find(
                              (p) => p.kode_barang.trim() === searchQuery.trim()
                            )
                            if (product) {
                              handleSearchSelect(product)
                              setSearchQuery("")
                              setShowSearchResults(false)
                              return 
                            }
                            if (searchResults.length > 0) {
                              handleSearchSelect(searchResults[0])
                            }
                          }
                          if (e.key === "Escape") {
                            setShowSearchResults(false)
                          }
                        }}
                        onFocus={() => {
                          if (searchQuery.length > 0) setShowSearchResults(true)
                        }}
                        onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                        placeholder="Scan barcode atau ketik nama produk..."
                        className={`pl-10 pr-10 w-full border-2 border-gray-300 focus:border-black focus:ring-2 focus:ring-black/20 ${
                          isTablet ? 'h-12 text-sm rounded-lg' : 'h-14 text-base rounded-xl'
                        }`}
                        autoComplete="off"
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSearchQuery("")
                            setShowSearchResults(false)
                            if (searchInputRef.current) {
                              searchInputRef.current.focus()
                            }
                          }}
                          className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-0 hover:bg-gray-100 ${
                            isTablet ? 'h-8 w-8' : 'h-10 w-10'
                          }`}
                        >
                          <X className={`${isTablet ? 'w-4 h-4' : 'w-5 h-5'}`} />
                        </Button>
                      )}
                    </div>
                  </div>

                  {showSearchResults && searchResults.length > 0 && (
                    <Card className={`absolute top-full left-0 right-0 z-50 mt-2 max-h-64 overflow-auto shadow-2xl border border-gray-300 ${
                      isTablet ? 'rounded-lg' : 'rounded-xl'
                    }`}>
                      <CardContent className="p-0">
                        {searchResults.map((product, index) => (
                          <button
                            key={product.kode_barang}
                            onClick={() => {
                              handleSearchSelect(product)
                              setSearchQuery("")
                              setShowSearchResults(false)
                            }}
                            className={`w-full text-left hover:bg-gray-50 border-b border-gray-200 last:border-b-0 transition-colors ${
                              index === 0 ? 'bg-black/5' : ''
                            } ${isTablet ? 'p-3' : 'p-4'}`}
                          >
                            <div className="flex justify-between items-center gap-2">
                              <div className="flex-1 min-w-0">
                                <p className={`font-bold text-gray-900 truncate ${
                                  isTablet ? 'text-sm' : 'text-base'
                                }`}>
                                  {product.nama_barang}
                                </p>
                                <div className={`flex items-center gap-2 mt-1 ${
                                  isTablet ? 'flex-wrap' : ''
                                }`}>
                                  <Badge variant="secondary" className="bg-gray-900 text-white font-semibold whitespace-nowrap">
                                    <span className={isTablet ? 'text-xs' : ''}>
                                      {product.kode_barang}
                                    </span>
                                  </Badge>
                                  <span className={`text-gray-600 ${
                                    isTablet ? 'text-xs' : 'text-sm'
                                  }`}>
                                    Rp {product.harga.toLocaleString()} / {product.satuan}
                                  </span>
                                </div>
                              </div>
                              <Badge
                                variant={product.stok > 10 ? "default" : "destructive"}
                                className={`ml-1 font-bold bg-gray-900 text-white ${
                                  isTablet ? 'text-xs' : 'text-sm'
                                }`}
                              >
                                {product.stok}
                              </Badge>
                            </div>
                          </button>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Cart Section */}
            <Card className={`border border-gray-200 bg-white rounded-xl shadow-sm ${
              isTablet ? 'md:rounded-lg' : ''
            }`}>
              <CardHeader className={`${isTablet ? 'pb-3 pt-4' : 'pb-4 pt-5'}`}>
                <div className="flex items-center justify-between">
                  <CardTitle className={`flex items-center gap-3 text-gray-900 ${
                    isTablet ? 'text-lg font-bold' : 'text-xl font-bold'
                  }`}>
                    <div className={`${isTablet ? 'w-8 h-8' : 'w-10 h-10'} bg-gray-900 rounded-lg flex items-center justify-center`}>
                      <ShoppingCart className={`${isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />
                    </div>
                    Keranjang Belanja
                  </CardTitle>
                  {cart.length > 0 && (
                    <Badge variant="secondary" className={`bg-gray-900 text-white font-bold ${
                      isTablet ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
                    }`}>
                      {cart.length} item
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {cart.length === 0 ? (
                  <div className={`text-center ${isTablet ? 'py-8' : 'py-12'}`}>
                    <div className={`bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
                      isTablet ? 'w-16 h-16' : 'w-20 h-20'
                    }`}>
                      <ShoppingCart className={`text-gray-400 ${
                        isTablet ? 'w-8 h-8' : 'w-10 h-10'
                      }`} />
                    </div>
                    <h3 className={`font-bold text-gray-900 mb-1 ${
                      isTablet ? 'text-base' : 'text-lg'
                    }`}>
                      Keranjang masih kosong
                    </h3>
                    <p className={`text-gray-600 ${
                      isTablet ? 'text-sm' : ''
                    }`}>
                      Scan barcode atau cari produk untuk menambah item
                    </p>
                  </div>
                ) : (
                  <div className={`space-y-3 overflow-y-auto ${
                    isDesktop ? 'max-h-[calc(100vh-240px)] pr-4' : 
                    isTablet ? 'max-h-[400px] pr-2' : 
                    'max-h-[500px]'
                  }`}>
                    <div className="p-4 pt-0">
                      <div className={`space-y-3 ${isTablet ? 'pt-3' : 'pt-4'}`}>
                        {cart.map((item) => (
                          <Card key={item.kode_barang} className={`border-2 border-gray-200 bg-white ${
                            isTablet ? 'rounded-lg' : 'rounded-xl'
                          }`}>
                            <CardContent className={`${isTablet ? 'p-3' : 'p-4'}`}>
                              <div className={`${isTablet ? 'space-y-3' : 'space-y-4'}`}>
                                {/* Product Info */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <h3 className={`font-bold text-gray-900 truncate ${
                                      isTablet ? 'text-sm' : 'text-base'
                                    }`}>
                                      {item.nama_barang}
                                    </h3>
                                    <div className={`flex items-center gap-2 mt-1 ${
                                      isTablet ? 'flex-wrap' : ''
                                    }`}>
                                      <Badge variant="outline" className="border-gray-300 text-gray-700 font-semibold whitespace-nowrap">
                                        <span className={isTablet ? 'text-xs' : ''}>
                                          {item.kode_barang}
                                        </span>
                                      </Badge>
                                      <span className={`text-gray-600 ${
                                        isTablet ? 'text-xs' : 'text-sm'
                                      }`}>
                                        Rp {getCurrentPrice(item).toLocaleString()} / {item.satuan_terpilih || item.satuan}
                                      </span>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeItem(item.kode_barang)}
                                    className={`text-gray-700 hover:text-black hover:bg-gray-100 p-0 rounded-lg flex-shrink-0 ${
                                      isTablet ? 'h-8 w-8' : 'h-10 w-10'
                                    }`}
                                  >
                                    <Trash2 className={`${isTablet ? 'w-4 h-4' : 'w-5 h-5'}`} />
                                  </Button>
                                </div>

                                {/* Controls */}
                                <div className={`grid grid-cols-3 gap-3 items-center ${
                                  isTablet ? 'grid-cols-1 sm:grid-cols-3' : ''
                                }`}>
                                  <div className="flex flex-col gap-1">
                                    <Label className={`font-semibold text-gray-700 ${
                                      isTablet ? 'text-xs' : ''
                                    }`}>
                                      Satuan
                                    </Label>
                                    <Select
                                      value={item.satuan_terpilih || "satuan"}
                                      onValueChange={(value) => handleChangeSatuan(item.kode_barang, value)}
                                    >
                                      <SelectTrigger className={`w-full border-2 border-gray-300 text-sm font-medium ${
                                        isTablet ? 'h-9 rounded-md text-xs' : 'h-10 rounded-lg'
                                      }`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className={`border-2 border-gray-300 ${
                                        isTablet ? 'rounded-md' : 'rounded-lg'
                                      }`}>
                                        <SelectItem value="satuan">Satuan</SelectItem>
                                        {item.harga_renteng && (
                                          <SelectItem value="renteng">Renteng</SelectItem>
                                        )}
                                        {item.harga_renteng && (
                                          <SelectItem value="dus">Dus</SelectItem>
                                        )}
                                        {item.harga_renteng && (
                                          <SelectItem value="pack">Pack</SelectItem>
                                        )}
                                          {item.harga_renteng && (
                                          <SelectItem value="penjual_gas">Penjual Gas</SelectItem>
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className={`flex items-center justify-center gap-2 ${
                                    isTablet ? 'mt-2 sm:mt-0' : ''
                                  }`}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => updateQty(item.kode_barang, item.jumlah - 1)}
                                      className={`p-0 border-2 border-gray-300 hover:bg-gray-50 ${
                                        isTablet ? 'h-9 w-9 rounded-md' : 'h-10 w-10 rounded-lg'
                                      }`}
                                    >
                                      <Minus className={`${isTablet ? 'w-3 h-3' : 'w-4 h-4'}`} />
                                    </Button>
                                    <Input
                                      type="number"
                                      value={item.jumlah}
                                      onChange={(e) => updateQty(item.kode_barang, Math.max(1, Number(e.target.value)))}
                                      className={`text-center border-2 border-gray-300 font-bold ${
                                        isTablet ? 'w-14 h-9 text-sm rounded-md' : 'w-16 h-10 text-base rounded-lg'
                                      }`}
                                      min="1"
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => updateQty(item.kode_barang, item.jumlah + 1)}
                                      className={`p-0 border-2 border-gray-300 hover:bg-gray-50 ${
                                        isTablet ? 'h-9 w-9 rounded-md' : 'h-10 w-10 rounded-lg'
                                      }`}
                                    >
                                      <Plus className={`${isTablet ? 'w-3 h-3' : 'w-4 h-4'}`} />
                                    </Button>
                                  </div>

                                  <div className={`text-right ${
                                    isTablet ? 'mt-2 sm:mt-0' : ''
                                  }`}>
                                    <div className={`font-black text-gray-900 ${
                                      isTablet ? 'text-sm' : 'text-base'
                                    }`}>
                                      Rp {subtotal(item).toLocaleString()}
                                    </div>
                                    {item.satuan_terpilih && item.satuan_terpilih !== "satuan" && (
                                      <div className={`text-gray-600 truncate mt-1 ${
                                        isTablet ? 'text-xs' : ''
                                      }`}>
                                        {getSatuanInfo(item)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column: Order Summary */}
          <div className={`space-y-3 ${isTablet ? 'md:col-span-1 md:space-y-4' : 'md:col-span-2 md:space-y-6'}`}>
            <Card className={`border border-gray-200 bg-white rounded-xl shadow-sm ${
              isTablet ? 'md:rounded-lg' : ''
            } ${isDesktop ? 'sticky top-6' : ''}`}>
              <CardHeader className={`${isTablet ? 'pb-3 pt-4' : 'pb-4 pt-5'}`}>
                <CardTitle className={`font-bold text-gray-900 ${
                  isTablet ? 'text-xl' : 'text-2xl'
                }`}>
                  Ringkasan Pesanan
                </CardTitle>
              </CardHeader>
              
              <CardContent className={`${isTablet ? 'space-y-4' : 'space-y-6'}`}>
                {/* Total Amount Section */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-gray-700 font-medium ${
                        isTablet ? 'text-sm' : 'text-base'
                      }`}>
                        Subtotal ({cart.length} item{cart.length !== 1 ? 's' : ''})
                      </span>
                      <span className={`font-bold text-gray-900 ${
                        isTablet ? 'text-base' : 'text-lg'
                      }`}>
                        Rp {cartSubtotal.toLocaleString()}
                      </span>
                    </div>
                    
                    {formData.diskon && (
                      <div className="flex justify-between items-center">
                        <span className={`text-gray-700 font-medium ${
                          isTablet ? 'text-sm' : 'text-base'
                        }`}>
                          Diskon
                        </span>
                        <span className={`font-bold text-red-600 ${
                          isTablet ? 'text-base' : 'text-lg'
                        }`}>
                          -{formatRupiah(parseRupiah(formData.diskon))}
                        </span>
                      </div>
                    )}
                    
                    <Separator className="bg-gray-300 my-2" />
                    
                    <div className="flex justify-between items-center pt-1">
                      <span className={`font-black text-gray-900 ${
                        isTablet ? 'text-lg' : 'text-xl'
                      }`}>
                        TOTAL
                      </span>
                      <span className={`font-black text-gray-900 ${
                        isTablet ? 'text-2xl' : 'text-3xl'
                      }`}>
                        Rp {total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Input Section */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="diskon" className={`text-gray-800 mb-2 block ${
                      isTablet ? 'text-sm font-semibold' : 'text-base font-semibold'
                    }`}>
                      Potongan Harga
                    </Label>
                    <Input 
                      id="diskon"
                      type="text" 
                      name="diskon" 
                      value={formData.diskon} 
                      onChange={handleDiskonChange}
                      placeholder="Contoh: 5000 atau 10%"
                      className={`border-2 border-gray-300 focus:border-black focus:ring-2 focus:ring-black/20 ${
                        isTablet ? 'h-10 text-sm rounded-lg' : 'h-12 text-base rounded-lg'
                      }`} 
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <Label htmlFor="total_uang" className={`text-gray-800 mb-2 block ${
                      isTablet ? 'text-sm font-semibold' : 'text-base font-semibold'
                    }`}>
                      Uang yang Dibayar
                    </Label>
                    <Input 
                      id="total_uang"
                      type="text" 
                      name="total_uang" 
                      value={formData.total_uang} 
                      onChange={handleTotalUangChange}
                      placeholder="Masukkan jumlah uang"
                      className={`border-2 border-gray-300 focus:border-black focus:ring-2 focus:ring-black/20 ${
                        isTablet ? 'h-10 text-sm rounded-lg' : 'h-12 text-base rounded-lg'
                      }`}
                      autoComplete="off"
                    />
                  </div>
                </div>
                
                {/* Payment Status */}
                {formData.total_uang && (
                  <div className={`rounded-xl p-4 shadow-sm transition-all duration-300 ${
    paymentStatus.status === 'insufficient' 
      ? 'bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500' 
      : paymentStatus.status === 'overpaid' 
      ? 'bg-gradient-to-r from-emerald-50 to-green-100 border-l-4 border-emerald-500'
      : paymentStatus.status === 'exact'
      ? 'bg-gradient-to-r from-blue-50 to-indigo-100 border-l-4 border-blue-500'
      : 'bg-gradient-to-r from-gray-50 to-gray-100 border-l-4 border-gray-500'
  }`}>
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${
        paymentStatus.status === 'insufficient' ? 'bg-red-100' :
        paymentStatus.status === 'overpaid' ? 'bg-emerald-100' :
        paymentStatus.status === 'exact' ? 'bg-blue-100' :
        'bg-gray-100'
      }`}>
        {paymentStatus.status === 'insufficient' && (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {paymentStatus.status === 'overpaid' && (
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {paymentStatus.status === 'exact' && (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {paymentStatus.status === 'empty' && (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      <div>
        <p className={`font-semibold text-sm mb-1 ${
          paymentStatus.status === 'insufficient' ? 'text-red-700' :
          paymentStatus.status === 'overpaid' ? 'text-emerald-700' :
          paymentStatus.status === 'exact' ? 'text-blue-700' :
          'text-gray-700'
        }`}>
          {paymentStatus.status === 'insufficient' ? 'Uang Kurang' :
           paymentStatus.status === 'overpaid' ? 'Uang Kembalian' :
           paymentStatus.status === 'exact' ? 'Uang Pas' :
           'Status Pembayaran'}
        </p>
        <p className="text-lg font-bold text-gray-900">
          {paymentStatus.message}
        </p>
      </div>
    </div>
  </div>
                )}
                
                {/* Submit Button Section */}
                <div className="pt-2">
                  <Button 
                    onClick={handleSubmit}
                    disabled={cart.length === 0 || isProcessing}
                    className={`w-full text-white rounded-lg border-2 border-gray-900 hover:border-black shadow-md transition-all duration-200 bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 ${
                      isTablet ? 'h-12 text-base font-bold' : 'h-14 text-lg font-bold'
                    }`}
                    size="lg"
                  >
                    <CreditCard className={`mr-2 ${isTablet ? 'w-5 h-5' : 'w-6 h-6'}`} />
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        MEMPROSES...
                      </span>
                    ) : 'SIMPAN TRANSAKSI'}
                  </Button>
                  
                  {cart.length === 0 && (
                    <div className="mt-2 text-center">
                      <p className="text-gray-500 text-xs">
                        Tambahkan produk ke keranjang untuk melanjutkan transaksi
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}