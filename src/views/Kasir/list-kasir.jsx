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
import { parseRupiah } from '@/utils/kasirUtils' // IMPORT parseRupiah

/**
 * Komponen utama untuk halaman Kasir
 */
export default function ListKasir() {
  const kasir = useKasir()
  
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
        {/* Header Section */}
        <Card className="border border-gray-200 bg-white shadow-sm rounded-xl">
          <CardHeader className="pb-4 pt-5 md:pt-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-gray-900 to-black rounded-2xl flex items-center justify-center shadow-md">
                <ShoppingCart className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                  Kasir Toko IFA
                </CardTitle>
                <p className="text-gray-600 mt-1 md:mt-1.5 font-medium">Sistem Point Of Sales</p>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">
          {/* Left Column: Search and Cart */}
          <div className="md:col-span-3 space-y-4 md:space-y-6">
            {/* Search Section */}
            <Card className="border border-gray-200 bg-white rounded-xl shadow-sm">
              <CardHeader className="pb-4 pt-5">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                  <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                    <Scan className="w-5 h-5 text-white" />
                  </div>
                  Tambah Produk
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Label htmlFor="unified-search" className="text-base font-semibold text-gray-800 mb-3 block">
                    Scan Barcode / Cari Produk
                  </Label>
                  <div className="relative">
                    <div className="relative flex items-center">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-500" />
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
                        className="pl-12 pr-12 h-14 text-base font-medium w-full border-2 border-gray-300 focus:border-black focus:ring-2 focus:ring-black/20 rounded-xl"
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
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 hover:bg-gray-100"
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {showSearchResults && searchResults.length > 0 && (
                    <Card className="absolute top-full left-0 right-0 z-50 mt-2 max-h-80 overflow-auto shadow-2xl border border-gray-300 rounded-xl">
                      <CardContent className="p-0">
                        {searchResults.map((product, index) => (
                          <button
                            key={product.kode_barang}
                            onClick={() => {
                              handleSearchSelect(product)
                              setSearchQuery("")
                              setShowSearchResults(false)
                            }}
                            className={`w-full text-left p-4 hover:bg-gray-50 border-b border-gray-200 last:border-b-0 transition-colors ${
                              index === 0 ? 'bg-black/5' : ''
                            }`}
                          >
                            <div className="flex justify-between items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 text-base truncate">{product.nama_barang}</p>
                                <div className="flex items-center gap-3 mt-2">
                                  <Badge variant="secondary" className="bg-gray-900 text-white text-xs font-semibold">
                                    {product.kode_barang}
                                  </Badge>
                                  <span className="text-sm text-gray-600">
                                    Rp {product.harga.toLocaleString()} / {product.satuan}
                                  </span>
                                </div>
                              </div>
                              <Badge
                                variant={product.stok > 10 ? "default" : "destructive"}
                                className="ml-2 text-xs font-bold bg-gray-900 text-white"
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
            <Card className="border border-gray-200 bg-white rounded-xl shadow-sm">
              <CardHeader className="pb-4 pt-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                    <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-white" />
                    </div>
                    Keranjang Belanja
                  </CardTitle>
                  {cart.length > 0 && (
                    <Badge variant="secondary" className="bg-gray-900 text-white px-3 py-1.5 text-sm font-bold">
                      {cart.length} item
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <ShoppingCart className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Keranjang masih kosong</h3>
                    <p className="text-gray-600">Scan barcode atau cari produk untuk menambah item</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <Card key={item.kode_barang} className="border-2 border-gray-200 rounded-xl bg-white">
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            {/* Product Info */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-base text-gray-900 truncate">{item.nama_barang}</h3>
                                <div className="flex items-center gap-3 mt-2">
                                  <Badge variant="outline" className="border-gray-300 text-gray-700 text-xs font-semibold">
                                    {item.kode_barang}
                                  </Badge>
                                  <span className="text-sm text-gray-600">
                                    Rp {getCurrentPrice(item).toLocaleString()} / {item.satuan_terpilih || item.satuan}
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.kode_barang)}
                                className="text-gray-700 hover:text-black hover:bg-gray-100 h-10 w-10 p-0 rounded-lg flex-shrink-0"
                              >
                                <Trash2 className="w-5 h-5" />
                              </Button>
                            </div>

                            {/* Controls */}
                            <div className="grid grid-cols-3 gap-4 items-center">
                              <div className="flex flex-col gap-1.5">
                                <Label className="text-xs font-semibold text-gray-700">Satuan</Label>
                                <Select
                                  value={item.satuan_terpilih || "satuan"}
                                  onValueChange={(value) => handleChangeSatuan(item.kode_barang, value)}
                                >
                                  <SelectTrigger className="h-10 w-full border-2 border-gray-300 rounded-lg text-sm font-medium">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="border-2 border-gray-300 rounded-lg">
                                    <SelectItem value="satuan">Satuan</SelectItem>
                                    {item.harga_renteng && (
                                      <SelectItem value="renteng">Renteng</SelectItem>
                                    )}
                                    {item.harga_renteng && (
                                      <SelectItem value="Dus">Dus</SelectItem>
                                    )}
                                    {item.harga_renteng && (
                                      <SelectItem value="pack">Pack</SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQty(item.kode_barang, item.jumlah - 1)}
                                  className="h-10 w-10 p-0 border-2 border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <Input
                                  type="number"
                                  value={item.jumlah}
                                  onChange={(e) => updateQty(item.kode_barang, Math.max(1, Number(e.target.value)))}
                                  className="w-16 h-10 text-center border-2 border-gray-300 rounded-lg text-base font-bold"
                                  min="1"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQty(item.kode_barang, item.jumlah + 1)}
                                  className="h-10 w-10 p-0 border-2 border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>

                              <div className="text-right">
                                <div className="font-black text-base text-gray-900">
                                  Rp {subtotal(item).toLocaleString()}
                                </div>
                                {item.satuan_terpilih && item.satuan_terpilih !== "satuan" && (
                                  <div className="text-xs text-gray-600 truncate mt-1">
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
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column: Order Summary */}
          <div className="md:col-span-2 space-y-4 md:space-y-6">
            <Card className="border border-gray-200 bg-white rounded-xl shadow-sm">
              <CardHeader className="pb-4 pt-5">
                <CardTitle className="text-xl font-bold text-gray-900">Ringkasan Pesanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 font-medium">Subtotal ({cart.length} item)</span>
                    <span className="font-bold text-gray-900">
                      Rp {cartSubtotal.toLocaleString()}
                    </span>
                  </div>
                  {formData.diskon && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-700 font-medium">Diskon</span>
                      <span className="font-bold text-red-600">
                        -{formatRupiah(parseRupiah(formData.diskon))} {/* GUNAKAN parseRupiah */}
                      </span>
                    </div>
                  )}
                  <Separator className="bg-gray-300" />
                  <div className="flex justify-between items-center py-3">
                    <span className="text-lg font-black text-gray-900">Total</span>
                    <span className="text-2xl md:text-3xl font-black text-gray-900">
                      Rp {total.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">        
                  <div>
                    <Label htmlFor="diskon" className="text-base font-semibold text-gray-800 mb-2 block">
                      Potongan Harga (Otomatis)
                    </Label>
                    <Input 
                      id="diskon"
                      type="text" 
                      name="diskon" 
                      value={formData.diskon} 
                      onChange={handleDiskonChange}
                      placeholder="Diskon otomatis dari promo"
                      className="h-12 text-base border-2 border-gray-300 focus:border-black focus:ring-2 focus:ring-black/20 rounded-lg" 
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <Label htmlFor="total_uang" className="text-base font-semibold text-gray-800 mb-2 block">
                      Total Uang (Opsional)
                    </Label>
                    <Input 
                      id="total_uang"
                      type="text" 
                      name="total_uang" 
                      value={formData.total_uang} 
                      onChange={handleTotalUangChange}
                      placeholder="Masukkan total uang yang dibayar"
                      className="h-12 text-base border-2 border-gray-300 focus:border-black focus:ring-2 focus:ring-black/20 rounded-lg"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <Label htmlFor="kembalian" className="text-base font-semibold text-gray-800 mb-2 block">
                      Kembalian
                    </Label>
                    <div className={`h-16 rounded-xl border-2 flex items-center justify-between px-5 transition-all ${
                      formData.kembalian > 0 
                        ? 'bg-gray-900 text-white border-gray-900' 
                        : 'bg-gray-100 border-gray-300 text-gray-600'
                    }`}>
                      <span className="text-base font-semibold">Rp</span>
                      <span className={`text-2xl font-black ${
                        formData.kembalian > 0 ? 'text-white' : 'text-gray-500'
                      }`}>
                        {formData.kembalian.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {formData.total_uang && (
                    <div className={`text-base p-4 rounded-xl font-semibold border-2 ${
                      paymentStatus.status === 'insufficient' ? 'bg-red-50 text-red-800 border-red-300' :
                      paymentStatus.status === 'overpaid' ? 'bg-green-50 text-green-800 border-green-300' :
                      'bg-gray-900 text-white border-gray-900'
                    }`}>
                      {paymentStatus.message}
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleSubmit}
                  disabled={cart.length === 0 || isProcessing}
                  className="w-full h-14 text-base font-black bg-gray-900 hover:bg-black text-white rounded-xl border-2 border-gray-900 hover:border-black shadow-md"
                  size="lg"
                >
                  <CreditCard className="w-6 h-6 mr-3" />
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