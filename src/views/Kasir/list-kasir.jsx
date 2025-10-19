import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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
import { getHargaPromo } from '@/api/HargaPromoapi'
// ===== CONSTANTS =====
const SATUAN_TYPES = {
  SATUAN: 'satuan',
  RENTENG: 'renteng',
  DUS: 'dus',
  PACK: 'pack',
  GROSIR: 'grosir'
}

const PAYMENT_STATUS = {
  EMPTY: 'empty',
  INSUFFICIENT: 'insufficient',
  OVERPAID: 'overpaid',
  EXACT: 'exact'
}

const BARCODE_CONFIG = {
  MIN_LENGTH: 3,
  SCAN_TIMEOUT: 50,
  FOCUS_DELAY: 100
}

const TOAST_CONFIG = {
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timerProgressBar: true
}

const EXCLUDED_INPUT_IDS = ['total_uang', 'kembalian']
const SEARCH_MAX_RESULTS = 8
const SEARCH_CLEAR_DELAY = 150

// ===== UTILITY FUNCTIONS =====
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

const getCurrentPrice = (item) => {
  const satuan = item.satuan_terpilih || SATUAN_TYPES.SATUAN
  const priceMap = {
    [SATUAN_TYPES.RENTENG]: item.harga_renteng,
    [SATUAN_TYPES.DUS]: item.harga_dus,
    [SATUAN_TYPES.PACK]: item.harga_pack,
    [SATUAN_TYPES.GROSIR]: item.harga_grosir,
  }
  return priceMap[satuan] || item.harga
}

const getSatuanInfo = (item) => {
  const satuan = item.satuan_terpilih || SATUAN_TYPES.SATUAN
  const basePrice = item.harga

  if (satuan === SATUAN_TYPES.SATUAN || !basePrice || basePrice === 0) return ""

  const infoMap = {
    [SATUAN_TYPES.RENTENG]: item.jumlah_lainnya ? `1 renteng = ${item.jumlah_lainnya} pcs` : "Harga renteng",
    [SATUAN_TYPES.DUS]: item.jumlah_lainnya ? `1 dus = ${item.jumlah_lainnya} pcs` : "Harga dus",
    [SATUAN_TYPES.PACK]: item.jumlah_lainnya ? `1 pack = ${item.jumlah_lainnya} pcs` : "Harga pack",
    [SATUAN_TYPES.GROSIR]: "Harga grosir",
  }
  return infoMap[satuan] || ""
}

const showToast = (title, text, icon, timer = 3000) => {
  Swal.fire({ ...TOAST_CONFIG, title, text, icon, timer })
}

const focusSearchInput = (ref, delay = BARCODE_CONFIG.FOCUS_DELAY) => {
  setTimeout(() => ref.current?.focus(), delay)
}

// ===== SEARCH UTILITIES =====
const calculateSimilarity = (str1, str2) => {
  const set1 = new Set(str1.split(''))
  const set2 = new Set(str2.split(''))
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])
  return intersection.size / union.size
}

const calculateSearchScore = (item, query, queryWords) => {
  const namaBarang = item.nama_barang.toLowerCase()
  const kodeBarang = item.kode_barang.toLowerCase()
  let score = 0

  // Exact kode match
  if (kodeBarang === query) return 1000
  if (kodeBarang.startsWith(query)) score += 800
  if (kodeBarang.includes(query)) score += 600

  // Exact nama match
  if (namaBarang === query) score += 900
  if (namaBarang.startsWith(query)) score += 700

  // Multi-word matching
  const allWordsFound = queryWords.every(word => namaBarang.includes(word))
  if (allWordsFound) score += 500

  const foundWords = queryWords.filter(word => namaBarang.includes(word))
  score += (foundWords.length / queryWords.length) * 300

  if (namaBarang.includes(query)) score += 400

  // Phrase matching
  if (queryWords.length > 1) {
    const queryPhrase = queryWords.join(' ')
    if (namaBarang.includes(queryPhrase)) score += 200
  }

  // Fuzzy matching
  if (score === 0 && query.length >= 3) {
    const similarity = calculateSimilarity(query, namaBarang)
    if (similarity > 0.6) score += similarity * 100
  }

  return score
}

const searchProducts = (transaksi, query) => {
  if (!query.trim() || !Array.isArray(transaksi)) return []

  const lowercaseQuery = query.toLowerCase().trim()
  const queryWords = lowercaseQuery.split(/\s+/).filter(word => word.length > 0)

  return transaksi
    .map(item => ({
      ...item,
      searchScore: calculateSearchScore(item, lowercaseQuery, queryWords)
    }))
    .filter(item => item.searchScore > 0)
    .sort((a, b) => {
      if (b.searchScore !== a.searchScore) return b.searchScore - a.searchScore
      if (a.nama_barang.length !== b.nama_barang.length) {
        return a.nama_barang.length - b.nama_barang.length
      }
      return a.nama_barang.localeCompare(b.nama_barang, 'id', { numeric: true })
    })
    .slice(0, SEARCH_MAX_RESULTS)
}

// ===== PROMO UTILITIES =====
const findPromo = (hargaPromo, kodeBarang) => {
  if (!Array.isArray(hargaPromo) || !kodeBarang) return null
  
  const normalizedKode = kodeBarang.trim().toLowerCase()
  
  return hargaPromo.find(p => 
    p?.produk?.kode_barang?.trim()?.toLowerCase() === normalizedKode ||
    p?.kode_barang?.trim()?.toLowerCase() === normalizedKode
  )
}

const calculatePromoDiscount = (cart, hargaPromo) => {
  if (!Array.isArray(hargaPromo) || hargaPromo.length === 0) return 0

  return cart.reduce((totalDiskon, item) => {
    const promo = findPromo(hargaPromo, item.kode_barang)
    if (promo && item.jumlah >= promo.min_qty) {
      const multiplier = Math.floor(item.jumlah / promo.min_qty)
      return totalDiskon + (promo.potongan_harga * multiplier)
    }
    return totalDiskon
  }, 0)
}

// ===== MAIN COMPONENT =====
export default function ListKasir() {
  // State
  const [transaksi, setTransaksi] = useState([])
  const [formData, setFormData] = useState({
    produk_id: '',
    jumlah_terjual_per_hari: '',
    diskon: '',
    total_uang: '',
    kembalian: 0
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [cart, setCart] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPrint, setShowPrint] = useState(false)
  const [printData, setPrintData] = useState(null)
  const [user, setUser] = useState(null)
  const [hargaPromo, setHargaPromo] = useState([])
  const [promoLoaded, setPromoLoaded] = useState(false)

  // Refs
  const searchInputRef = useRef(null)
  const barcodeBufferRef = useRef('')
  const lastKeyTimeRef = useRef(0)
  const transaksiRef = useRef([])

  // ===== COMPUTED VALUES =====
  const searchResults = useMemo(() => 
    searchProducts(transaksi, searchQuery), 
    [transaksi, searchQuery]
  )

  const cartSubtotal = useMemo(() => 
    cart.reduce((sum, item) => sum + (getCurrentPrice(item) * item.jumlah), 0),
    [cart]
  )

  const getTotalToBePaid = useCallback(() => {
    const diskon = parseRupiah(formData.diskon)
    return Math.max(0, cartSubtotal - diskon)
  }, [cartSubtotal, formData.diskon])

  const getPaymentStatus = useCallback(() => {
    const totalUang = parseRupiah(formData.total_uang)
    const totalToBePaid = getTotalToBePaid()

    if (totalUang === 0 && formData.total_uang === '') {
      return {
        status: PAYMENT_STATUS.EMPTY,
        message: 'Masukkan total uang (opsional)',
        difference: 0
      }
    }

    if (totalUang < totalToBePaid) {
      return {
        status: PAYMENT_STATUS.INSUFFICIENT,
        message: `Uang kurang ${formatRupiah(totalToBePaid - totalUang)}`,
        difference: totalToBePaid - totalUang
      }
    }

    if (totalUang > totalToBePaid) {
      return {
        status: PAYMENT_STATUS.OVERPAID,
        message: `Kembalian ${formatRupiah(totalUang - totalToBePaid)}`,
        difference: totalUang - totalToBePaid
      }
    }

    return {
      status: PAYMENT_STATUS.EXACT,
      message: 'Uang pas',
      difference: 0
    }
  }, [formData.total_uang, getTotalToBePaid])

  const total = useMemo(() => getTotalToBePaid(), [getTotalToBePaid])

  const paymentStatus = useMemo(() => getPaymentStatus(), [getPaymentStatus])

  // ===== API CALLS =====
  const fetchUser = useCallback(async () => {
    try {
      const res = await getProfile()
      setUser(res.data)
    } catch (error) {
      console.error("Gagal ambil user:", error)
    }
  }, [])

  const fetchHargaPromo = useCallback(async () => {
    try {
      const res = await getHargaPromo()
      const promoData = Array.isArray(res) ? res : (Array.isArray(res.data) ? res.data : [])
      setHargaPromo(promoData)
    } catch (error) {
      setHargaPromo([])
    } finally {
      setPromoLoaded(true)
    }
  }, [])

  const fetchTransaksi = useCallback(async () => {
    try {
      const res = await getTransaksi()
      setTransaksi(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      console.error("Gagal ambil transaksi:", error)
    }
  }, [])

  // ===== CART OPERATIONS =====
  const addProductToCart = useCallback((product) => {
    if (!product) return

    setCart(prevCart => {
      const exist = prevCart.find(c => c.kode_barang === product.kode_barang)
      if (exist) {
        return prevCart.map(c =>
          c.kode_barang === product.kode_barang
            ? { ...c, jumlah: c.jumlah + 1 }
            : c
        )
      }
      return [...prevCart, { ...product, jumlah: 1, satuan_terpilih: SATUAN_TYPES.SATUAN }]
    })

    showToast("Berhasil", `${product.nama_barang} ditambahkan ke keranjang`, "success", 2000)
  }, [])

  const updateQty = useCallback((kode_barang, newQty) => {
    if (newQty < 1) return
    setCart(prev =>
      prev.map(item =>
        item.kode_barang === kode_barang ? { ...item, jumlah: newQty } : item
      )
    )
  }, [])

  const removeItem = useCallback((kode) => {
    setCart(prev => prev.filter(c => c.kode_barang !== kode))
  }, [])

  const subtotal = useCallback((item) => {
    return getCurrentPrice(item) * item.jumlah
  }, [])

  const handleChangeSatuan = useCallback((kode_barang, satuan) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.kode_barang === kode_barang
          ? { ...item, satuan_terpilih: satuan, jumlah: 1 }
          : item
      )
    )
  }, [])

  // ===== PROMO CHECK =====
  const checkAndApplyPromo = useCallback(() => {
    const totalDiskonPromo = calculatePromoDiscount(cart, hargaPromo)
    setFormData(prev => ({
      ...prev,
      diskon: totalDiskonPromo > 0 ? formatRupiah(totalDiskonPromo) : ""
    }))
  }, [cart, hargaPromo])

  // ===== FORM HANDLERS =====
  const handleDiskonChange = useCallback((e) => {
    const rawValue = e.target.value
    if (rawValue === "") {
      setFormData(prev => ({ ...prev, diskon: "" }))
      return
    }

    const numericValue = parseRupiah(rawValue)
    const finalDiskon = Math.min(numericValue, cartSubtotal)

    setFormData(prev => ({ ...prev, diskon: formatRupiah(finalDiskon) }))
  }, [cartSubtotal])

  const handleTotalUangChange = useCallback((e) => {
    const rawValue = e.target.value
    if (rawValue === "") {
      setFormData(prev => ({ ...prev, total_uang: "", kembalian: 0 }))
      return
    }

    try {
      const totalUangNumber = parseRupiah(rawValue)
      const diskonNumber = parseRupiah(formData.diskon)
      const totalSetelahDiskon = Math.max(0, cartSubtotal - diskonNumber)
      const kembalian = Math.max(0, totalUangNumber - totalSetelahDiskon)

      setFormData(prev => ({
        ...prev,
        total_uang: formatRupiah(totalUangNumber),
        kembalian
      }))
    } catch (error) {
      console.error("Error calculating total uang:", error)
      setFormData(prev => ({ ...prev, total_uang: "", kembalian: 0 }))
    }
  }, [cartSubtotal, formData.diskon])

  // ===== SEARCH HANDLERS =====
  const handleSearchSelect = useCallback((product) => {
    const exactProduct = transaksi.find(p => 
      p.kode_barang.trim() === searchQuery.trim()
    )

    if (exactProduct && searchQuery.length >= BARCODE_CONFIG.MIN_LENGTH) {
      setTimeout(() => {
        addProductToCart(exactProduct)
        setSearchQuery("")
        setShowSearchResults(false)
      }, 50)
      return
    }

    addProductToCart(product)
    setSearchQuery('')
    setShowSearchResults(false)
  }, [transaksi, searchQuery, addProductToCart])

  // ===== BARCODE SCANNER =====
  const handleBarcodeFound = useCallback((barcode) => {
    const product = transaksiRef.current.find(p =>
      p.kode_barang.trim().toLowerCase() === barcode.toLowerCase()
    )

    if (product) {
      addProductToCart(product)
      setSearchQuery('')
      setShowSearchResults(false)
      focusSearchInput(searchInputRef)
    } else {
      showToast(
        "Kode Tidak Ditemukan",
        `Barcode "${barcode}" tidak terdaftar dalam sistem`,
        "error"
      )
      setSearchQuery('')
      focusSearchInput(searchInputRef)
    }
  }, [addProductToCart])

  // ===== TRANSACTION =====
  const postTransaksi = useCallback(async (data) => {
    try {
      setIsProcessing(true)
      const res = await postKasir(data)
      const diskon = parseRupiah(formData.diskon)
      const total_uang = parseRupiah(formData.total_uang)
      const total = cartSubtotal - diskon
      const kembalian = total_uang > 0 ? Math.max(0, total_uang - total) : 0

      const transactionData = {
        no_transaksi: res.no_transaksi,
        items: cart.map(item => ({
          jumlah: item.jumlah,
          nama_barang: item.nama_barang,
          harga: getCurrentPrice(item),
          satuan: item.satuan_terpilih || item.satuan,
        })),
        subtotal: cartSubtotal,
        diskon,
        total,
        total_uang,
        kembalian
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
      focusSearchInput(searchInputRef)
    } catch (error) {
      console.error('Error posting transaksi:', error)
      showToast("Gagal", "Terjadi kesalahan saat memproses transaksi", "error")
    } finally {
      setIsProcessing(false)
    }
  }, [cart, cartSubtotal, formData.diskon, formData.total_uang])

  const handleSubmit = useCallback((e) => {
    e.preventDefault()

    if (!user) {
      showToast("Gagal", "User belum terdeteksi", "error")
      return
    }

    if (cart.length === 0) {
      showToast("Gagal", "Keranjang masih kosong", "error")
      return
    }

    const payload = {
      produk_id: cart.map(i => i.kode_barang),
      jumlah_terjual_per_hari: cart.map(i => i.jumlah),
      satuan: cart.map(i => i.satuan_terpilih || i.satuan),
      users_id: user.id,
      diskon: parseRupiah(formData.diskon),
    }

    postTransaksi(payload)
  }, [user, cart, formData.diskon, postTransaksi])

  // ===== EFFECTS =====
  useEffect(() => {
    fetchHargaPromo()
  }, [fetchHargaPromo])

  useEffect(() => {
    transaksiRef.current = transaksi
  }, [transaksi])

  useEffect(() => {
    fetchTransaksi()
    fetchUser()
    focusSearchInput(searchInputRef, 0)

    let scanTimeout = null

    const handleGlobalKeyPress = (e) => {
      const activeElement = document.activeElement
      const isTypingInInput = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
      )
      const isInSelectComponent = activeElement && (
        activeElement.getAttribute('role') === 'combobox' ||
        activeElement.closest('[role="combobox"]') !== null ||
        activeElement.closest('[data-radix-select-trigger]') !== null
      )
      const isExcludedInput = activeElement && EXCLUDED_INPUT_IDS.includes(activeElement.id)
      const isSearchInput = activeElement === searchInputRef.current ||
        (activeElement && activeElement.id === 'unified-search')

      if (isInSelectComponent) return
      if (isTypingInInput && isExcludedInput) return
      if (isTypingInInput && isSearchInput) return
      if (isTypingInInput && !isSearchInput && !isExcludedInput) return

      if (e.key.length === 1 && /[a-zA-Z0-9 ]/.test(e.key) && !isTypingInInput) {
        if (searchInputRef.current) {
          searchInputRef.current.focus()
          const newValue = searchQuery + e.key
          setSearchQuery(newValue)
          setShowSearchResults(newValue.length > 0)
          e.preventDefault()
          return
        }
      }

      const currentTime = Date.now()
      lastKeyTimeRef.current = currentTime

      if (e.key.length === 1) {
        barcodeBufferRef.current += e.key
        if (scanTimeout) clearTimeout(scanTimeout)

        scanTimeout = setTimeout(() => {
          if (barcodeBufferRef.current.length >= BARCODE_CONFIG.MIN_LENGTH) {
            const scannedBarcode = barcodeBufferRef.current.trim()
            barcodeBufferRef.current = ''
            handleBarcodeFound(scannedBarcode)
          }
        }, BARCODE_CONFIG.SCAN_TIMEOUT)
      }

      if (e.key === 'Enter' && barcodeBufferRef.current.length >= BARCODE_CONFIG.MIN_LENGTH) {
        if (scanTimeout) clearTimeout(scanTimeout)
        const scannedBarcode = barcodeBufferRef.current.trim()
        barcodeBufferRef.current = ''
        handleBarcodeFound(scannedBarcode)
        e.preventDefault()
      }
    }

    document.addEventListener('keydown', handleGlobalKeyPress)

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyPress)
      if (scanTimeout) clearTimeout(scanTimeout)
    }
  }, [searchQuery, fetchTransaksi, fetchUser, handleBarcodeFound])

  useEffect(() => {
    checkAndApplyPromo()
  }, [checkAndApplyPromo])

const showBarcodeNotFoundAlert = useCallback((searchTerm, inputRef) => {
  Swal.fire({
    icon: "error",
    title: "Kode Barcode Tidak Ditemukan",
    text: `Kode Barcode ${searchTerm} belum ditambahkan ke daftar produk.`,
    ...TOAST_CONFIG,
    timer: 4000,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    },
    didClose: () => {
      focusSearchInput(inputRef)
    }
  })
}, [])
useEffect(() => {
  let clearTimer = null
  let isCleanedUp = false
  
  const shouldClearInput =
    showSearchResults &&
    searchQuery &&
    searchQuery.trim().length > 0 &&
    searchResults.length === 0 &&
    !barcodeBufferRef.current 
  
  if (shouldClearInput) {
    clearTimer = setTimeout(() => {
      if (isCleanedUp) return
      
      const searchTerm = searchQuery.trim()
      
      if (searchResults.length === 0 && !barcodeBufferRef.current) {
        setSearchQuery("")
        setShowSearchResults(false)
        showBarcodeNotFoundAlert(searchTerm, searchInputRef)
      }
    }, SEARCH_CLEAR_DELAY)
  }
  
  return () => {
    isCleanedUp = true
    if (clearTimer) clearTimeout(clearTimer)
  }
}, [showSearchResults, searchQuery, searchResults, showBarcodeNotFoundAlert])


  // ===== RENDER =====
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
                    <Label htmlFor="diskon" className="text-base font-medium">Potongan Harga (Otomatis)</Label>
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
                      placeholder="Diskon otomatis dari promo"
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