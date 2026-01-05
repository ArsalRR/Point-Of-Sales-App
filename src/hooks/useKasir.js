import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { postKasir, getTransaksi } from '@/api/Kasirapi'
import { getProfile } from '@/api/Userapi'
import { getHargaPromo } from '@/api/HargaPromoapi'
import Swal from 'sweetalert2'
import {
  parseRupiah,
  formatRupiah,
  getCurrentPrice,
  getSatuanInfo,
  SATUAN_TYPES,
  PAYMENT_STATUS,
  BARCODE_CONFIG,
  EXCLUDED_INPUT_IDS,
  SEARCH_CLEAR_DELAY,
  TOAST_CONFIG
} from '@/utils/kasirUtils'
import { searchProducts } from '@/utils/searchUtils'
import { calculatePromoDiscount } from '@/utils/promoUtils'

/**
 * Custom hook untuk logika bisnis kasir
 */
export const useKasir = () => {
  // State management
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

  // Refs untuk manage DOM dan barcode
  const searchInputRef = useRef(null)
  const barcodeBufferRef = useRef('')
  const lastKeyTimeRef = useRef(0)
  const lastScannedBarcodeRef = useRef('')
  const transaksiRef = useRef([])
  const scanTimeoutRef = useRef(null)

  // ===== UTILITY FUNCTIONS =====

  /**
   * Menampilkan toast notification
   */
  const showToast = useCallback((title, text, icon, timer = 3000) => {
    Swal.fire({ ...TOAST_CONFIG, title, text, icon, timer })
  }, [])

  /**
   * Fokus ke search input dengan delay
   */
  const focusSearchInput = useCallback((delay = BARCODE_CONFIG.FOCUS_DELAY) => {
    setTimeout(() => searchInputRef.current?.focus(), delay)
  }, [])

  /**
   * Alert ketika barcode tidak ditemukan
   */
  const showBarcodeNotFoundAlert = useCallback((searchTerm) => {
    Swal.fire({
      icon: "error",
      title: "Kode Barcode Tidak Ditemukan",
      text: `Kode Barcode "${searchTerm}" belum ditambahkan ke daftar produk.`,
      ...TOAST_CONFIG,
      timer: 4000,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      },
      didClose: () => {
        focusSearchInput()
      }
    })
  }, [focusSearchInput])

  // ===== COMPUTED VALUES =====

  /**
   * Hasil pencarian produk berdasarkan query
   */
  const searchResults = useMemo(() => 
    searchProducts(transaksi, searchQuery), 
    [transaksi, searchQuery]
  )

  /**
   * Total subtotal cart tanpa diskon
   */
  const cartSubtotal = useMemo(() => 
    cart.reduce((sum, item) => sum + (getCurrentPrice(item) * item.jumlah), 0),
    [cart]
  )

  /**
   * Total yang harus dibayar setelah diskon
   */
  const getTotalToBePaid = useCallback(() => {
    const diskon = parseRupiah(formData.diskon)
    return Math.max(0, cartSubtotal - diskon)
  }, [cartSubtotal, formData.diskon])

  /**
   * Status pembayaran (kurang, lebih, pas)
   */
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

  // ===== API FUNCTIONS =====

  /**
   * Fetch data user yang login
   */
  const fetchUser = useCallback(async () => {
    try {
      const res = await getProfile()
      setUser(res.data)
    } catch (error) {
      console.error("Gagal ambil user:", error)
    }
  }, [])

  /**
   * Fetch data harga promo dari API
   */
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

  /**
   * Fetch data transaksi/daftar produk dari API
   */
  const fetchTransaksi = useCallback(async () => {
    try {
      const res = await getTransaksi()
      setTransaksi(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      console.error("Gagal ambil transaksi:", error)
    }
  }, [])

  // ===== CART OPERATIONS =====

  /**
   * Menambahkan produk ke cart
   */
  const addProductToCart = useCallback((product, quantity = 1) => {
    if (!product) return

    setCart(prevCart => {
      const exist = prevCart.find(c => c.kode_barang === product.kode_barang)
      if (exist) {
        return prevCart.map(c =>
          c.kode_barang === product.kode_barang
            ? { ...c, jumlah: c.jumlah + quantity }
            : c
        )
      }
      return [...prevCart, { 
        ...product, 
        jumlah: quantity, 
        satuan_terpilih: SATUAN_TYPES.SATUAN 
      }]
    })

    showToast("Berhasil", `${product.nama_barang} ditambahkan (+${quantity})`, "success", 1500)
  }, [showToast])

  /**
   * Mengupdate quantity item di cart
   */
  const updateQty = useCallback((kode_barang, newQty, event) => {
    if (newQty < 1) return
    
    if (event) {
      event.stopPropagation()
      event.preventDefault()
    }
    
    setCart(prev =>
      prev.map(item =>
        item.kode_barang === kode_barang ? { ...item, jumlah: newQty } : item
      )
    )
  }, [])

  /**
   * Menghapus item dari cart
   */
  const removeItem = useCallback((kode) => {
    setCart(prev => prev.filter(c => c.kode_barang !== kode))
  }, [])

  /**
   * Menghitung subtotal untuk satu item
   */
  const subtotal = useCallback((item) => {
    return getCurrentPrice(item) * item.jumlah
  }, [])

  /**
   * Mengubah satuan untuk item tertentu
   */
  const handleChangeSatuan = useCallback((kode_barang, satuan) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.kode_barang === kode_barang
          ? { ...item, satuan_terpilih: satuan, jumlah: 1 }
          : item
      )
    )
  }, [])

  // ===== PROMO HANDLING =====

  /**
   * Mengecek dan menerapkan promo ke diskon
   */
  const checkAndApplyPromo = useCallback(() => {
    if (!promoLoaded) return
    
    if (cart.length === 0 || hargaPromo.length === 0) {
      setFormData(prev => ({
        ...prev,
        diskon: ""
      }))
      return
    }

    const totalDiskonPromo = calculatePromoDiscount(cart, hargaPromo)
    
    setFormData(prev => ({
      ...prev,
      diskon: totalDiskonPromo > 0 ? formatRupiah(totalDiskonPromo) : ""
    }))
  }, [cart, hargaPromo, promoLoaded, formatRupiah])

  // ===== FORM HANDLERS =====

  /**
   * Handler untuk perubahan input diskon
   */
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

  /**
   * Handler untuk perubahan input total uang
   */
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
      setFormData(prev => ({ ...prev, total_uang: "", kembalian: 0 }))
    }
  }, [cartSubtotal, formData.diskon])

  // ===== SEARCH HANDLERS =====

  /**
   * Handler untuk memilih hasil pencarian
   */
  const handleSearchSelect = useCallback((product) => {
    const exactProduct = transaksi.find(p => 
      p.kode_barang.trim() === searchQuery.trim()
    )

    const productToAdd = exactProduct || product
    
    if (productToAdd) {
      addProductToCart(productToAdd, 1)
      setSearchQuery("")
      setShowSearchResults(false)
    }
  }, [transaksi, searchQuery, addProductToCart])

  // ===== BARCODE SCANNER =====

  /**
   * Handler ketika barcode ditemukan
   */
  const handleBarcodeFound = useCallback((barcode) => {
    // Cegah double scan dalam waktu singkat
    const now = Date.now()
    if (barcode === lastScannedBarcodeRef.current && 
        now - lastKeyTimeRef.current < 1000) {
      return
    }
    
    lastScannedBarcodeRef.current = barcode
    lastKeyTimeRef.current = now

    const product = transaksiRef.current.find(p =>
      p.kode_barang.trim().toLowerCase() === barcode.toLowerCase()
    )

    if (product) {
      // SELALU tambah 1 item setiap scan
      addProductToCart(product, 1)
      
      setSearchQuery('')
      setShowSearchResults(false)
      focusSearchInput()
    } else {
      showBarcodeNotFoundAlert(barcode)
      setSearchQuery('')
      focusSearchInput()
    }
  }, [addProductToCart, focusSearchInput, showBarcodeNotFoundAlert])

  /**
   * Helper untuk memproses barcode
   */
  const processBarcode = useCallback((barcode) => {
    handleBarcodeFound(barcode)
    // Clear visual feedback
    setSearchQuery('')
    setShowSearchResults(false)
    if (searchInputRef.current) {
      searchInputRef.current.value = ''
    }
  }, [handleBarcodeFound])

  // ===== TRANSACTION PROCESSING =====

  /**
   * Mengirim transaksi ke API
   */
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
      focusSearchInput()
    } catch (error) {
      console.error('Error posting transaksi:', error)
      showToast("Gagal", "Terjadi kesalahan saat memproses transaksi", "error")
    } finally {
      setIsProcessing(false)
    }
  }, [cart, cartSubtotal, formData.diskon, formData.total_uang, showToast, focusSearchInput])

  /**
   * Handler untuk submit transaksi
   */
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
  }, [user, cart, formData.diskon, postTransaksi, showToast])

  // ===== EFFECTS =====

  // Load promo data
  useEffect(() => {
    fetchHargaPromo()
  }, [fetchHargaPromo])

  // Sync transaksi ke ref
  useEffect(() => {
    transaksiRef.current = transaksi
  }, [transaksi])

  // Apply promo ketika cart berubah
  useEffect(() => {
    checkAndApplyPromo()
  }, [checkAndApplyPromo])

  // Cleanup search query ketika tidak ada hasil
  useEffect(() => {
    let clearTimer = null
    let isCleanedUp = false
    
    const shouldClearInput =
      showSearchResults &&
      searchQuery &&
      searchQuery.trim().length > 0 &&
      searchResults.length === 0 &&
      barcodeBufferRef.current.length === 0
    
    if (shouldClearInput) {
      clearTimer = setTimeout(() => {
        if (isCleanedUp) return
        
        const searchTerm = searchQuery.trim()
        
        if (searchResults.length === 0 && barcodeBufferRef.current.length === 0) {
          setSearchQuery("")
          setShowSearchResults(false)
          showBarcodeNotFoundAlert(searchTerm)
        }
      }, SEARCH_CLEAR_DELAY)
    }
    
    return () => {
      isCleanedUp = true
      if (clearTimer) clearTimeout(clearTimer)
    }
  }, [showSearchResults, searchQuery, searchResults, showBarcodeNotFoundAlert])

  // BARCODE SCANNER EFFECT - Semua logika barcode scanner disini
  useEffect(() => {
    // Fetch initial data
    fetchTransaksi()
    fetchUser()
    
    // Focus on search input
    focusSearchInput(0)

    /**
     * Handler untuk global key press (barcode scanner)
     */
    const handleGlobalKeyDown = (e) => {
      const active = document.activeElement
      const isTextArea = active?.tagName === 'TEXTAREA'
      const isContentEditable = active?.contentEditable === 'true'
      const isSearchInput = active === searchInputRef.current
      
      // 1. Jika di textarea/contenteditable → IGNORE
      if (isTextArea || isContentEditable) return
      
      const currentTime = Date.now()
      const timeSinceLastKey = currentTime - lastKeyTimeRef.current
      
      // 2. Tangkap karakter untuk barcode scanner
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // PREVENT DEFAULT untuk semua karakter (kecuali di search input untuk manual typing)
        if (!isSearchInput) {
          e.preventDefault()
        }
        
        // Update waktu terakhir
        lastKeyTimeRef.current = currentTime
        
        // Tambah ke buffer
        barcodeBufferRef.current += e.key
        
        // Update search input untuk visual feedback (hanya jika bukan manual typing)
        if (searchInputRef.current && (!isSearchInput || timeSinceLastKey < BARCODE_CONFIG.MAX_KEY_INTERVAL)) {
          if (!isSearchInput) {
            searchInputRef.current.focus()
          }
          searchInputRef.current.value = barcodeBufferRef.current
          setSearchQuery(barcodeBufferRef.current)
          setShowSearchResults(barcodeBufferRef.current.length > 0)
        }
        
        // Timer untuk detect barcode selesai
        if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current)
        scanTimeoutRef.current = setTimeout(() => {
          if (barcodeBufferRef.current.length >= BARCODE_CONFIG.MIN_LENGTH) {
            const scannedBarcode = barcodeBufferRef.current.trim()
            barcodeBufferRef.current = ''
            processBarcode(scannedBarcode)
          } else {
            // Jika bukan barcode, clear buffer
            barcodeBufferRef.current = ''
          }
        }, BARCODE_CONFIG.SCAN_TIMEOUT)
      }
      
      // 3. Enter key sebagai alternatif
      else if (e.key === 'Enter' && barcodeBufferRef.current.length >= BARCODE_CONFIG.MIN_LENGTH) {
        e.preventDefault()
        if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current)
        const scannedBarcode = barcodeBufferRef.current.trim()
        barcodeBufferRef.current = ''
        processBarcode(scannedBarcode)
      }
      
      // 4. Escape key untuk clear buffer
      else if (e.key === 'Escape') {
        barcodeBufferRef.current = ''
        if (searchInputRef.current) {
          searchInputRef.current.value = ''
          setSearchQuery('')
          setShowSearchResults(false)
        }
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown)
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current)
    }
  }, [fetchTransaksi, fetchUser, focusSearchInput, processBarcode])

  // ===== RETURN VALUES =====

  return {
    // State
    transaksi,
    formData,
    searchQuery,
    setSearchQuery,
    showSearchResults,
    setShowSearchResults,
    cart,
    isProcessing,
    showPrint,
    setShowPrint,
    printData,
    setPrintData,
    user,
    hargaPromo,
    promoLoaded,
    
    // Refs
    searchInputRef,
    
    // Computed values
    searchResults,
    cartSubtotal,
    total,
    paymentStatus,
    
    // API functions
    fetchTransaksi,
    fetchUser,
    
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
    
    // Barcode scanner handlers
    handleBarcodeFound,
    
    // Utility functions
    getCurrentPrice,
    getSatuanInfo,
    formatRupiah,
    focusSearchInput: () => focusSearchInput(0),
    showBarcodeNotFoundAlert,
    showToast
  }
}