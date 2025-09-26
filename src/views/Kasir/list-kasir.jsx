import { useState, useEffect } from 'react'
import { ShoppingCart, Scan, Trash2, Plus, Minus, CreditCard, Search, X, Printer } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { postKasir, getTransaksi } from '@/api/Kasirapi'
import { getProfile } from '@/api/Userapi'
import Swal from 'sweetalert2'
import NotaPembelian from '../Kasir/NotaPembelian'
const getCurrentPrice = (item) => {
  const satuan = item.satuan_terpilih || "satuan"
  
  switch (satuan) {
    case "renteng":
      return item.harga_renteng || item.harga
    case "dus":
      return item.harga_dus || item.harga
    case "pack":
      return item.harga_pack || item.harga
    case "grosir":
      return item.harga_grosir || item.harga
    case "satuan":
    default:
      return item.harga
  }
}
const getSatuanInfo = (item) => {
  const satuan = item.satuan_terpilih || "satuan"
  const basePrice = item.harga

  if (satuan === "satuan" || !basePrice || basePrice === 0) return ""

  switch (satuan) {
    case "renteng":
      return item.jumlah_lainnya
        ? `1 renteng = ${item.jumlah_lainnya} pcs`
        : "Harga renteng"
    case "dus":
      return item.jumlah_lainnya
        ? `1 dus = ${item.jumlah_lainnya} pcs`
        : "Harga dus"
    case "pack":
      return item.jumlah_lainnya
        ? `1 pack = ${item.jumlah_lainnya} pcs`
        : "Harga pack"
    case "grosir":
      return "Harga grosir"
    default:
      return ""
  }
}
export default function ListKasir() {
  const [transaksi, setTransaksi] = useState([])
  const [formData, setFormData] = useState({
    produk_id: '',
    jumlah_terjual_per_hari: '',
    diskon: '',
    total_uang: '',
    kembalian: 0
  })
  const [scan, setScan] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [cart, setCart] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPrint, setShowPrint] = useState(false)
  const [printData, setPrintData] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetchTransaksi()
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const res = await getProfile()
      setUser(res.data)
    } catch (error) {
      console.error("Gagal ambil user:", error)
    }
  }

  const fetchTransaksi = async () => {
    try {
      const res = await getTransaksi()
      setTransaksi(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      console.error("Gagal ambil transaksi:", error)
    }
  }

  const handleChangeSatuan = (kode_barang, satuan) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.kode_barang === kode_barang
          ? { 
              ...item, 
              satuan_terpilih: satuan,
              jumlah: 1
            }
          : item
      )
    )
  }

  const postTransaksi = async (data) => {
    try {
      setIsProcessing(true)
      const res = await postKasir(data)
      const subtotal = cart.reduce((s, i) => s + (getCurrentPrice(i) * i.jumlah), 0)
      const diskon = parseFloat(formData.diskon) || 0
      const total = subtotal - diskon
      const total_uang = parseFloat(formData.total_uang) || 0
      const kembalian = total_uang - total

      const transactionData = {
        no_transaksi: res.no_transaksi,
        items: cart.map(item => ({
          jumlah: item.jumlah,
          nama_barang: item.nama_barang,
          harga: getCurrentPrice(item), 
          satuan: item.satuan_terpilih || item.satuan,
        })),
        subtotal: subtotal,
        diskon: diskon,
        total: total,
        total_uang: total_uang,
        kembalian: kembalian
      }

      setPrintData(transactionData)
      
      Swal.fire({
        title: "Berhasil",
        text: "Transaksi Berhasil",
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000
      })
      
      setCart([])
      setFormData({
        produk_id: '',
        jumlah_terjual_per_hari: '',
        diskon: '',
        total_uang: '',
        kembalian: 0
      })
      setShowPrint(true)
      
    } catch (error) {
      console.error('Error posting transaksi:', error)
      Swal.fire({
        title: "Gagal",
        text: "Terjadi kesalahan saat memproses transaksi",
        icon: "error",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!user) {
      Swal.fire({
        title: "Gagal",
        text: "User belum terdeteksi",
        icon: "error",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000
      })
      return
    }
    if (cart.length === 0) {
      Swal.fire({
        title: "Gagal",
        text: "Keranjang masih kosong",
        icon: "error",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000
      })
      return
    }

    const payload = {
      produk_id: cart.map((i) => i.kode_barang),
      jumlah_terjual_per_hari: cart.map((i) => i.jumlah),
      satuan: cart.map((i) => i.satuan_terpilih || i.satuan),
      users_id: user.id,
      diskon: formData.diskon,
    }
    postTransaksi(payload)
  }

  const lookupProduct = (kode) => {
    if (!Array.isArray(transaksi)) return null
    const product = transaksi.find(item => item.kode_barang === kode)
    return product || null
  }

  const searchProducts = (query) => {
    if (!query.trim() || !Array.isArray(transaksi)) return []
    const lowercaseQuery = query.toLowerCase()
    return transaksi.filter(item => 
      item.nama_barang.toLowerCase().includes(lowercaseQuery) ||
      item.kode_barang.toLowerCase().includes(lowercaseQuery)
    ).slice(0, 5)
  }

  const addProductToCart = (product) => {
    if (!product) return

    const exist = cart.find((c) => c.kode_barang === product.kode_barang)
    if (exist) {
      setCart(cart.map((c) => 
        c.kode_barang === product.kode_barang 
          ? { ...c, jumlah: c.jumlah + 1 } 
          : c
      ))
    } else {
      setCart([...cart, { 
        ...product, 
        jumlah: 1, 
        satuan_terpilih: "satuan" // Default satuan
      }])
    }
    
    Swal.fire({
      title: "Berhasil",
      text: `${product.nama_barang} ditambahkan ke keranjang`,
      icon: "success",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000
    })
  }

  const handleSearchSelect = (product) => {
    // Langsung cek apakah ini kode barang yang exact match
    const exactProduct = transaksi.find(
      (p) => p.kode_barang.trim() === searchQuery.trim()
    )

    if (exactProduct && searchQuery.length >= 3) {
      // Kemungkinan barcode scan - langsung add
      setTimeout(() => {
        if (searchQuery === searchQuery) {
          addProductToCart(exactProduct)
          setSearchQuery("")
          setShowSearchResults(false)
        }
      }, 50)
      return
    }

    // Manual selection
    addProductToCart(product)
    setSearchQuery('')
    setShowSearchResults(false)
  }

  const updateQty = (kode, qty) => {
    if (qty <= 0) {
      removeItem(kode)
      return
    }
    setCart(cart.map((c) => c.kode_barang === kode ? { ...c, jumlah: qty } : c))
  }

  const removeItem = (kode) => {
    setCart(cart.filter((c) => c.kode_barang !== kode))
  }

  // Hitung subtotal berdasarkan harga satuan yang dipilih
  const subtotal = (item) => {
    return getCurrentPrice(item) * item.jumlah
  }
  

  const cartSubtotal = cart.reduce((s, i) => s + subtotal(i), 0)
  const diskon = parseFloat(formData.diskon) || 0
  const total = cartSubtotal - diskon
  const searchResults = searchProducts(searchQuery)
  if (showPrint && printData) {
    return (
      <NotaPembelian 
        transactionData={printData} 
        onClose={() => {
          setShowPrint(false)
          setPrintData(null)
        }} 
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-sm">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Kasir Toko IFA</CardTitle>
                <p className="text-gray-600 mt-1">Sistem Kasir Terpadu</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Scan className="w-5 h-5" />
                  Tambah Produk
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Label htmlFor="unified-search" className="text-sm font-medium text-gray-700 mb-2 block">
                    Scan Barcode / Cari Produk
                  </Label>
                  <div className="relative flex gap-3">
                    <Input 
                      id="unified-search"
                      value={searchQuery}
                      onChange={(e) => {
                        const value = e.target.value
                        setSearchQuery(value)

                        // Langsung cek apakah ini kode barang yang exact match
                        const exactProduct = transaksi.find(
                          (p) => p.kode_barang.trim() === value.trim()
                        )

                        if (exactProduct && value.length >= 3) {
                          // Kemungkinan barcode scan - langsung add dengan delay kecil
                          setTimeout(() => {
                            if (searchQuery === value) {
                              handleSearchSelect(exactProduct)
                              return
                            }
                          }, 50)
                          return // Jangan tampilkan dropdown
                        }

                        // Untuk pencarian manual, tampilkan dropdown
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
                          
                          // Jika tidak ada exact match, pilih yang pertama dari search results
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
                      className="pl-10 pr-10"
                      autoComplete="off"
                    />

                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("")
                          setShowSearchResults(false)
                        }}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Dropdown untuk pencarian manual */}
                  {showSearchResults && searchResults.length > 0 && (
                    <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto shadow-lg">
                      <CardContent className="p-0">
                        {searchResults.map((product, index) => (
                          <button
                            key={product.kode_barang}
                            onClick={() => {
                              handleSearchSelect(product)
                              setSearchQuery("")
                              setShowSearchResults(false)
                            }}
                            className={`w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                              index === 0 ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{product.nama_barang}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {product.kode_barang}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    Rp {product.harga.toLocaleString()} / {product.satuan}
                                  </span>
                                </div>
                              </div>
                              <Badge
                                variant={product.stok > 10 ? "default" : "destructive"}
                                className="ml-2"
                              >
                                Stok: {product.stok}
                              </Badge>
                            </div>
                          </button>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {showSearchResults && searchQuery && searchResults.length === 0 && (
                    <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg">
                      <CardContent className="p-4 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="w-8 h-8 text-gray-300" />
                          <p>Tidak ada produk yang ditemukan</p>
                          <p className="text-xs text-gray-400">
                            Coba gunakan kata kunci yang berbeda atau scan barcode produk
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingCart className="w-5 h-5" />
                  Keranjang Belanja
                  {cart.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {cart.length} item
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Keranjang masih kosong</h3>
                    <p className="text-gray-500">Scan barcode atau cari produk untuk menambah item</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <Card key={item.kode_barang} className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{item.nama_barang}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {item.kode_barang}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  Rp {getCurrentPrice(item).toLocaleString()} / {item.satuan_terpilih || item.satuan}
                                </span>
                              </div>
                            </div>

                            {/* Unit Selector */}
                            <div className="flex flex-col gap-1">
                              <Label className="text-xs text-gray-500">Satuan</Label>
                              <Select
                                value={item.satuan_terpilih || "satuan"}
                                onValueChange={(value) => handleChangeSatuan(item.kode_barang, value)}
                              >
                                <SelectTrigger className="w-24 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="satuan">Satuan</SelectItem>
                                  {item.harga_renteng && (
                                    <SelectItem value="renteng">Renteng</SelectItem>
                                  )}
                                  {item.harga_dus && (
                                    <SelectItem value="dus">Dus</SelectItem>
                                  )}
                                  {item.harga_pack && (
                                    <SelectItem value="pack">Pack</SelectItem>
                                  )}
                                  {item.harga_grosir && (
                                    <SelectItem value="grosir">Grosir</SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQty(item.kode_barang, item.jumlah - 1)}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <Input
                                type="number"
                                value={item.jumlah}
                                onChange={(e) => updateQty(item.kode_barang, Math.max(1, Number(e.target.value)))}
                                className="w-16 text-center h-8 px-2"
                                min="1"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQty(item.kode_barang, item.jumlah + 1)}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Subtotal */}
                            <div className="text-right min-w-0">
                              <div className="font-bold text-gray-900">
                                Rp {subtotal(item).toLocaleString()}
                              </div>
                              {item.satuan_terpilih && item.satuan_terpilih !== "satuan" && (
                                <div className="text-xs text-blue-600">
                                  {getSatuanInfo(item)}
                                </div>
                              )}
                            </div>

                            {/* Delete Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.kode_barang)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Ringkasan Pesanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({cart.length} item)</span>
                    <span className="font-medium">
                      Rp {cartSubtotal.toLocaleString()}
                    </span>
                  </div>
                  
                  {formData.diskon && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Diskon</span>
                      <span className="font-medium text-green-600">
                        -Rp {parseFloat(formData.diskon).toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-blue-600">
                      Rp {total.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">        
                  <div>
                    <Label htmlFor="diskon">Potongan Harga</Label>
                    <Input 
                      id="diskon"
                      type="number" 
                      name="diskon" 
                      value={formData.diskon} 
                      onChange={handleChange} 
                      placeholder="Masukkan potongan harga"
                      className="mt-1"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <Label htmlFor="total_uang">Total Uang</Label>
                    <Input 
                      id="total_uang"
                      type="number" 
                      name="total_uang" 
                      value={formData.total_uang} 
                      onChange={(e) => {
                        handleChange(e)
                        const totalUang = parseFloat(e.target.value) || 0
                        const kembalian = totalUang - total
                        setFormData(prev => ({
                          ...prev,
                          kembalian: kembalian >= 0 ? kembalian : 0
                        }))
                      }}
                      placeholder="Masukkan total uang"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="kembalian">Kembalian</Label>
                    <Input 
                      id="kembalian"
                      type="number" 
                      name="kembalian" 
                      value={formData.kembalian || 0}
                      placeholder="Kembalian akan dihitung otomatis"
                      disabled
                      className="mt-1 bg-gray-50"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSubmit}
                  disabled={cart.length === 0 || isProcessing}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  {isProcessing ? 'Memproses...' : 'Proses Pembayaran'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Aksi Cepat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (cart.length === 0) return
                    
                    if (confirm('Semua item dalam keranjang akan dihapus. Apakah Anda yakin?')) {
                      setCart([])
                      Swal.fire({
                        title: "Berhasil",
                        text: "Keranjang berhasil dikosongkan",
                        icon: "success",
                        toast: true,
                        position: "top-end",
                        showConfirmButton: false,
                        timer: 3000
                      })
                    }
                  }}
                  disabled={cart.length === 0}
                  className="w-full"
                >
                  Kosongkan Keranjang
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    setScan('')
                    setSearchQuery('')
                    setShowSearchResults(false)
                  }}
                  className="w-full"
                >
                  Reset Scanner & Pencarian
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}