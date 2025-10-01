import { useState, useEffect, useRef } from 'react'
import { ShoppingCart, Scan, Trash2, Plus, Minus, CreditCard, Search, X, } from 'lucide-react'
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
 const searchInputRef = useRef(null)
const barcodeBufferRef = useRef('')
const lastKeyTimeRef = useRef(0)
const transaksiRef = useRef([])

useEffect(() => {
  transaksiRef.current = transaksi
}, [transaksi])

useEffect(() => {
  fetchTransaksi()
  fetchUser()
  if (searchInputRef.current) {
    searchInputRef.current.focus()
  }

const handleGlobalKeyPress = (e) => {
    const activeElement = document.activeElement
    const isTypingInInput = activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    )
    
    // Jangan proses barcode jika user sedang mengetik di input quantity cart atau input lainnya
    if (isTypingInInput && activeElement !== searchInputRef.current) {
      return
    }

    const currentTime = Date.now()
    if (currentTime - lastKeyTimeRef.current > 50) {
      barcodeBufferRef.current = ''
    }

    lastKeyTimeRef.current = currentTime
    if (e.key.length === 1 && !isTypingInInput) { 
      barcodeBufferRef.current += e.key
    }
    if (e.key === 'Enter' && barcodeBufferRef.current.length >= 3 && !isTypingInInput) {
      const scannedBarcode = barcodeBufferRef.current.trim()
      barcodeBufferRef.current = ''
      const product = transaksiRef.current.find(p => 
        p.kode_barang.trim().toLowerCase() === scannedBarcode.toLowerCase()
      )
      
      if (product) {
        addProductToCart(product)
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      } else {
        Swal.fire({
          title: "Kode Tidak Ditemukan",
          text: `Barcode "${scannedBarcode}" tidak terdaftar dalam sistem`,
          icon: "error",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        })
        
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }
      
      e.preventDefault()
    }
  }
  document.addEventListener('keydown', handleGlobalKeyPress)

  return () => {
    document.removeEventListener('keydown', handleGlobalKeyPress)
  }
}, [])
  const fetchUser = async () => {
    try {
      const res = await getProfile()
      setUser(res.data)
    } catch (error) {
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
  const parseRupiah = (value) => {
    if (!value && value !== 0) return 0
    const numberString = value.toString().replace(/[^\d]/g, "")
    return numberString === "" ? 0 : parseInt(numberString, 10)
  }

  const formatRupiah = (value) => {
    if (!value && value !== 0) return ""
    
    const number = typeof value === 'string' ? parseRupiah(value) : value
    if (number < 0) return ""
    
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number)
  }
  const formatNumber = (value) => {
    if (!value && value !== 0) return "0"
    
    const number = typeof value === 'string' ? parseRupiah(value) : value
    
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number)
  }

  const getTotalToBePaid = () => {
    const subtotal = cart.reduce((sum, item) => {
      const price = getCurrentPrice(item) || 0
      const quantity = item.jumlah || 0
      return sum + (price * quantity)
    }, 0)
    
    const diskon = parseRupiah(formData.diskon)
    return Math.max(0, subtotal - diskon)
  }

  const getPaymentStatus = () => {
    const totalUang = parseRupiah(formData.total_uang)
    const totalToBePaid = getTotalToBePaid()
    
    if (totalUang === 0 && formData.total_uang === '') {
      return {
        status: 'empty',
        message: 'Masukkan total uang (opsional)',
        difference: 0
      }
    }
    
    if (totalUang < totalToBePaid) {
      const kurang = totalToBePaid - totalUang
      return {
        status: 'insufficient',
        message: `Uang kurang ${formatRupiah(kurang)}`,
        difference: kurang
      }
    }
    
    if (totalUang > totalToBePaid) {
      const kembalian = totalUang - totalToBePaid
      return {
        status: 'overpaid',
        message: `Kembalian ${formatRupiah(kembalian)}`,
        difference: kembalian
      }
    }
    
    return {
      status: 'exact',
      message: 'Uang pas',
      difference: 0
    }
  }

  const handleDiskonChange = (e) => {
    const rawValue = e.target.value
    if (rawValue === "") {
      setFormData((prev) => ({
        ...prev,
        diskon: "",
      }))
      return
    }

    const numericValue = parseRupiah(rawValue)
    const subtotal = cart.reduce((sum, item) => sum + (getCurrentPrice(item) * item.jumlah), 0)
    const maxDiskon = subtotal 
    
    const finalDiskon = Math.min(numericValue, maxDiskon)
    
    setFormData((prev) => ({
      ...prev,
      diskon: formatRupiah(finalDiskon),
    }))
  }
  const handleTotalUangChange = (e) => {
    const rawValue = e.target.value
    if (rawValue === "") {
      setFormData((prev) => ({
        ...prev,
        total_uang: "",
        kembalian: 0,
      }))
      return
    }
    
    try {
      const totalUangNumber = parseRupiah(rawValue)
      const subtotal = cart.reduce((sum, item) => {
        const price = getCurrentPrice(item) || 0
        const quantity = item.jumlah || 0
        return sum + (price * quantity)
      }, 0)
      const diskonNumber = parseRupiah(formData.diskon)
      const totalSetelahDiskon = Math.max(0, subtotal - diskonNumber)
      const kembalian = Math.max(0, totalUangNumber - totalSetelahDiskon)
      
      setFormData((prev) => ({
        ...prev,
        total_uang: formatRupiah(totalUangNumber),
        kembalian: kembalian,
      }))
      
    } catch (error) {
      console.error("Error calculating total uang:", error)
      setFormData((prev) => ({
        ...prev,
        total_uang: "",
        kembalian: 0,
      }))
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
      const diskon = parseRupiah(formData.diskon)
      const total_uang = parseRupiah(formData.total_uang)
      
      const total = subtotal - diskon
      const kembalian = total_uang > 0 ? Math.max(0, total_uang - total) : 0

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
      setCart([])
      setFormData({
        produk_id: '',
        jumlah_terjual_per_hari: '',
        diskon: '',
        total_uang: '',
        kembalian: 0
      })
      setShowPrint(true)
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }, 100)
      
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

    // HAPUS VALIDASI TOTAL UANG - Sekarang tidak wajib
    const payload = {
      produk_id: cart.map((i) => i.kode_barang),
      jumlah_terjual_per_hari: cart.map((i) => i.jumlah),
      satuan: cart.map((i) => i.satuan_terpilih || i.satuan),
      users_id: user.id,
      diskon: parseRupiah(formData.diskon),
    }
    postTransaksi(payload)
  }

  const searchProducts = (query) => {
  if (!query.trim() || !Array.isArray(transaksi)) return []
  
  const lowercaseQuery = query.toLowerCase().trim()
  const queryWords = lowercaseQuery.split(/\s+/).filter(word => word.length > 0)
  const calculateScore = (item) => {
    const namaBarang = item.nama_barang.toLowerCase()
    const kodeBarang = item.kode_barang.toLowerCase()
    let score = 0
    if (kodeBarang === lowercaseQuery) {
      return 1000
    }
    if (kodeBarang.startsWith(lowercaseQuery)) {
      score += 800
    }
    if (kodeBarang.includes(lowercaseQuery)) {
      score += 600
    }

    if (namaBarang === lowercaseQuery) {
      score += 900
    }
    if (namaBarang.startsWith(lowercaseQuery)) {
      score += 700
    }
    const allWordsFound = queryWords.every(word => namaBarang.includes(word))
    if (allWordsFound) {
      score += 500
    }
    const foundWords = queryWords.filter(word => namaBarang.includes(word))
    score += (foundWords.length / queryWords.length) * 300
    if (namaBarang.includes(lowercaseQuery)) {
      score += 400
    }
    if (queryWords.length > 1) {
      const queryPhrase = queryWords.join(' ')
      if (namaBarang.includes(queryPhrase)) {
        score += 200
      }
    }
    if (score === 0 && lowercaseQuery.length >= 3) {
      const similarity = calculateSimilarity(lowercaseQuery, namaBarang)
      if (similarity > 0.6) {
        score += similarity * 100
      }
    }
    
    return score
  }
  const calculateSimilarity = (str1, str2) => {
    const set1 = new Set(str1.split(''))
    const set2 = new Set(str2.split(''))
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])
    return intersection.size / union.size
  }
  const scoredResults = transaksi
    .map(item => ({
      ...item,
      searchScore: calculateScore(item)
    }))
    .filter(item => item.searchScore > 0)
    .sort((a, b) => {
      if (b.searchScore !== a.searchScore) {
        return b.searchScore - a.searchScore
      }
      const aLength = a.nama_barang.length
      const bLength = b.nama_barang.length
      if (aLength !== bLength) {
        return aLength - bLength
      }
      return a.nama_barang.localeCompare(b.nama_barang, 'id', { numeric: true })
    })
  
  return scoredResults.slice(0, 8) 
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
        satuan_terpilih: "satuan" 
      }])
    }
    
    Swal.fire({
      title: "Berhasil",
      text: `${product.nama_barang} ditambahkan ke keranjang`,
      icon: "success",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 2000
    })
  }

  const handleSearchSelect = (product) => {
    const exactProduct = transaksi.find(
      (p) => p.kode_barang.trim() === searchQuery.trim()
    )

    if (exactProduct && searchQuery.length >= 3) {
      setTimeout(() => {
        if (searchQuery === searchQuery) {
          addProductToCart(exactProduct)
          setSearchQuery("")
          setShowSearchResults(false)
        }
      }, 50)
      return
    }
    addProductToCart(product)
    setSearchQuery('')
    setShowSearchResults(false)
  }

  const updateQty = (kode, qty) => {
  const validQty = Math.max(1, Math.floor(qty))  
  setCart((prevCart) => 
    prevCart.map((c) => 
      c.kode_barang === kode ? { ...c, jumlah: validQty } : c
    )
  )
  
}

  const removeItem = (kode) => {
    setCart(cart.filter((c) => c.kode_barang !== kode))
  }

  const subtotal = (item) => {
    return getCurrentPrice(item) * item.jumlah
  }

  const cartSubtotal = cart.reduce((s, i) => s + subtotal(i), 0)
  const total = getTotalToBePaid() 
  const paymentStatus = getPaymentStatus() 
  const searchResults = searchProducts(searchQuery)

  if (showPrint && printData) {
    return (
      <NotaPembelian 
        transactionData={printData} 
        onClose={() => {
          setShowPrint(false)
          setPrintData(null)
          setTimeout(() => {
            if (searchInputRef.current) {
              searchInputRef.current.focus()
            }
          }, 100)
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
                <p className="text-gray-600 mt-1">Sistem Point Of Sales </p>
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
                  <Label htmlFor="unified-search" className="text-lg font-medium text-gray-700 mb-3 block">
                    Scan Barcode / Cari Produk
                  </Label>
                  <div className="relative flex gap-3">
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
                            if (searchQuery === value) {
                              handleSearchSelect(exactProduct)
                              return
                            }
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
                      className="pl-12 pr-12 h-16 text-xl font-medium w-full"
                      autoComplete="off"
                    />

                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
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
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    )}
                  </div>

                  {/* Hapus indikator barcode detection yang mengganggu */}
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
                                  {item.harga_renteng && (
                                    <SelectItem value="Dus">Dus</SelectItem>
                                  )}
                                  {item.harga_renteng && (
                                    <SelectItem value="pack">Pack</SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
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
                        -{formatRupiah(parseRupiah(formData.diskon))}
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
    <Label htmlFor="diskon" className="text-base font-medium">Potongan Harga (Opsional)</Label>
    <Input 
      id="diskon"
      type="text" 
      name="diskon" 
      value={formData.diskon} 
      onChange={handleDiskonChange}
      onBlur={() => {
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus()
          }
        }, 100)
      }}
      placeholder="Masukkan potongan harga"
      className="mt-2 h-12 text-lg" 
      autoComplete="off"
    />
  </div>

  <div>
    <Label htmlFor="total_uang" className="text-base font-medium">Total Uang (Opsional)</Label>
    <Input 
      id="total_uang"
      type="text" 
      name="total_uang" 
      value={formData.total_uang} 
      onChange={handleTotalUangChange}
      onBlur={() => {
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus()
          }
        }, 100)
      }}
      placeholder="Masukkan total uang yang dibayar"
      className="mt-2 h-12 text-lg"
       autoComplete="off"
    />
  </div>

  <div>
    <Label htmlFor="kembalian" className="text-base font-medium">Kembalian</Label>
    <Input 
      id="kembalian"
      type="text"
      name="kembalian" 
      value={formatRupiah(formData.kembalian) || formatRupiah(0)}
      placeholder="Kembalian akan dihitung otomatis"
      disabled
      className="mt-2 bg-gray-50 h-12 text-lg"
     
    />
  </div>

  {/* Status pembayaran */}
  {formData.total_uang && (
    <div className={`text-sm p-3 rounded-md ${
      paymentStatus.status === 'insufficient' ? 'bg-red-50 text-red-600' :
      paymentStatus.status === 'overpaid' ? 'bg-green-50 text-green-600' :
      'bg-blue-50 text-blue-600'
    }`}>
      {paymentStatus.message}
    </div>
  )}
</div>
                <Button 
                  onClick={handleSubmit}
                  disabled={cart.length === 0 || isProcessing}
                  className="w-full h-14 text-lg font-semibold"
                  size="lg"
                >
                  <CreditCard className="w-6 h-6 mr-2" />
                  {isProcessing ? 'Memproses...' : 'Proses Transaksi'}
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
                      setFormData({
                        produk_id: '',
                        jumlah_terjual_per_hari: '',
                        diskon: '',
                        total_uang: '',
                        kembalian: 0
                      })
                      Swal.fire({
                        title: "Berhasil",
                        text: "Keranjang berhasil dikosongkan",
                        icon: "success",
                        toast: true,
                        position: "top-end",
                        showConfirmButton: false,
                        timer: 3000
                      })
                      // Focus kembali ke input search
                      setTimeout(() => {
                        if (searchInputRef.current) {
                          searchInputRef.current.focus()
                        }
                      }, 100)
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
                    setBarcodeBuffer('')
                    if (searchInputRef.current) {
                      searchInputRef.current.focus()
                    }
                  }}
                  className="w-full"
                >
                  Reset Scanner & Pencarian
                </Button>

                <Button 
                  variant="outline"
                  onClick={() => {
                    if (searchInputRef.current) {
                      searchInputRef.current.focus()
                    }
                  }}
                  className="w-full"
                >
                  Focus ke Scanner
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}