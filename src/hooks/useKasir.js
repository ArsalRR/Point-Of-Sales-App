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
  const transaksiRef = useRef([])
  
  // Ref baru untuk handle barcode scanning
  const scanTimeoutRef = useRef(null)
  const isProcessingScanRef = useRef(false)

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
  const focusSearchInput = useCallback((ref, delay = BARCODE_CONFIG.FOCUS_DELAY) => {
    setTimeout(() => ref.current?.focus(), delay)
  }, [])

  /**
   * Alert ketika barcode tidak ditemukan
   */
  const showBarcodeNotFoundAlert = useCallback((searchTerm) => {
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
        focusSearchInput(searchInputRef)
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
   * @param {Object} product - Produk yang akan ditambahkan
   * @param {number} quantity - Jumlah yang akan ditambahkan (default: 1)
   */
  const addProductToCart = useCallback((product, quantity = 1) => {
    if (!product) return

    setCart(prevCart => {
      const exist = prevCart.find(c => c.kode_barang === product.kode_barang)
      if (exist) {
        // Update jumlah jika sudah ada
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

    showToast(
      "Berhasil", 
      `${product.nama_barang} ditambahkan ke keranjang`, 
      "success", 
      2000
    )
  }, [showToast])

  /**
   * Mengupdate quantity item di cart
   * @param {string} kode_barang - Kode barang yang akan diupdate
   * @param {number} newQty - Jumlah baru
   */
  const updateQty = useCallback((kode_barang, newQty, event) => {
    if (newQty < 1) return
    
    // Simpan posisi scroll sebelum update dengan berbagai metode
    const scrollY = window.scrollY
    const scrollX = window.scrollX
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop
    
    // Mencegah event bubbling yang bisa menyebabkan scroll
    if (event) {
      event.stopPropagation()
      event.preventDefault()
      // Tambahkan ini untuk mencegah fokus otomatis
      event.target.blur()
    }
    
    // Update cart dengan cara yang tidak memicu reflow besar
    setCart(prev => {
      const newCart = prev.map(item =>
        item.kode_barang === kode_barang ? { ...item, jumlah: newQty } : item
      )
      return newCart
    })
    
    // Gunakan requestAnimationFrame untuk restore scroll
    requestAnimationFrame(() => {
      // Cek apakah posisi scroll berubah signifikan
      if (Math.abs(window.scrollY - scrollY) > 5) {
        window.scrollTo({
          top: scrollY,
          left: scrollX,
          behavior: 'instant'
        })
      }
    })
    
    // Backup dengan setTimeout
    setTimeout(() => {
      if (Math.abs(window.scrollY - scrollY) > 10) {
        window.scrollTo({
          top: scrollY,
          left: scrollX,
          behavior: 'instant'
        })
      }
    }, 50)
  }, [])

  /**
   * Menghapus item dari cart
   * @param {string} kode - Kode barang yang akan dihapus
   */
  const removeItem = useCallback((kode) => {
    setCart(prev => prev.filter(c => c.kode_barang !== kode))
  }, [])

  /**
   * Menghitung subtotal untuk satu item
   * @param {Object} item - Item produk
   * @returns {number} Subtotal item
   */
  const subtotal = useCallback((item) => {
    return getCurrentPrice(item) * item.jumlah
  }, [])

  /**
   * Mengubah satuan untuk item tertentu
   * @param {string} kode_barang - Kode barang
   * @param {string} satuan - Satuan baru
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
    // Early returns tanpa logging
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
   * @param {Object} e - Event object
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

  /**handleSearchSelect
   * Handler untuk perubahan input total uang
   * @param {Object} e - Event object
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
      console.error("Error calculating total uang:", error)
      setFormData(prev => ({ ...prev, total_uang: "", kembalian: 0 }))
    }
  }, [cartSubtotal, formData.diskon])

  // ===== SEARCH HANDLERS =====

  /**
   * Handler untuk memilih hasil pencarian
   * @param {Object} product - Produk yang dipilih
   */
 const handleSearchSelect = useCallback((product) => {
  const exactProduct = transaksi.find(p => 
    p.kode_barang.trim() === searchQuery.trim()
  )

  const productToAdd = exactProduct || product
  
  if (productToAdd) {
    // Cek apakah sudah ada di cart
    const existingInCart = cart.find(c => c.kode_barang === productToAdd.kode_barang)
    
    if (!existingInCart) {
      // Jika belum ada, tambahkan baru dengan jumlah 1
      addProductToCart(productToAdd, 1)
    } else {
      // Jika sudah ada, cukup panggil addProductToCart dengan jumlah 1
      // Fungsi addProductToCart sudah handle increment otomatis
      addProductToCart(productToAdd, 1)
    }
    
    setSearchQuery("")
    setShowSearchResults(false)
  }
}, [transaksi, searchQuery, cart, addProductToCart])

  // ===== BARCODE SCANNER =====

  /**
   * Fungsi untuk memproses barcode yang sudah discan
   */
  const processBarcodeScan = useCallback(() => {
    if (isProcessingScanRef.current || barcodeBufferRef.current.length < BARCODE_CONFIG.MIN_LENGTH) {
      return
    }

    isProcessingScanRef.current = true
    const scannedBarcode = barcodeBufferRef.current.trim()
    
    // Reset buffer segera
    barcodeBufferRef.current = ''
    
    // Gunakan setTimeout untuk memastikan proses tidak blocking
    setTimeout(() => {
      handleBarcodeFound(scannedBarcode)
      isProcessingScanRef.current = false
    }, 0)
  }, [])

  /**
   * Handler ketika barcode ditemukan
   * @param {string} barcode - Barcode yang discan
   */
  const handleBarcodeFound = useCallback((barcode) => {
    const product = transaksiRef.current.find(p =>
      p.kode_barang.trim().toLowerCase() === barcode.toLowerCase()
    )

    if (product) {
      // Cek apakah produk sudah ada di cart
      const existingInCart = cart.find(c => c.kode_barang === product.kode_barang)
      
      if (!existingInCart) {
        // Jika belum ada di cart, tambahkan dengan jumlah 1
        addProductToCart(product)
      } else {
        // Jika sudah ada, update jumlah (tambah 1)
        updateQty(product.kode_barang, existingInCart.jumlah + 1)
      }
      
      setSearchQuery('')
      setShowSearchResults(false)
      focusSearchInput(searchInputRef)
    } else {
      showBarcodeNotFoundAlert(barcode)
      setSearchQuery('')
      focusSearchInput(searchInputRef)
    }
  }, [cart, addProductToCart, updateQty, focusSearchInput, showBarcodeNotFoundAlert])

  // ===== TRANSACTION PROCESSING =====

  /**
   * Mengirim transaksi ke API
   * @param {Object} data - Data transaksi
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
      focusSearchInput(searchInputRef)
    } catch (error) {
      console.error('Error posting transaksi:', error)
      showToast("Gagal", "Terjadi kesalahan saat memproses transaksi", "error")
    } finally {
      setIsProcessing(false)
    }
  }, [cart, cartSubtotal, formData.diskon, formData.total_uang, showToast, focusSearchInput])

  /**
   * Handler untuk submit transaksi
   * @param {Object} e - Event object
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
      !barcodeBufferRef.current 
    
    if (shouldClearInput) {
      clearTimer = setTimeout(() => {
        if (isCleanedUp) return
        
        const searchTerm = searchQuery.trim()
        
        if (searchResults.length === 0 && !barcodeBufferRef.current) {
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

  // BARCODE SCANNER EFFECT - Perbaikan versi stabil
  useEffect(() => {
    // Fetch initial data
    fetchTransaksi()
    fetchUser()
    
    // Focus on search input
    focusSearchInput(searchInputRef, 0)

    /**
     * Handler untuk global key press (barcode scanner) - IMPROVED
     */
    const handleGlobalKeyPress = (e) => {
      // Skip jika sedang memproses scan sebelumnya
      if (isProcessingScanRef.current) {
        e.preventDefault()
        return
      }

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

      // Tangani karakter barcode
      if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        const currentTime = Date.now()
        
        // Reset buffer jika jeda terlalu lama (bukan bagian dari scan yang sama)
        if (currentTime - lastKeyTimeRef.current > 100) { // 100ms threshold
          barcodeBufferRef.current = ''
        }
        
        // Tambahkan karakter ke buffer
        barcodeBufferRef.current += e.key
        lastKeyTimeRef.current = currentTime
        
        // Clear timeout sebelumnya
        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current)
        }
        
        // Set timeout baru untuk mendeteksi akhir scan
        scanTimeoutRef.current = setTimeout(() => {
          processBarcodeScan()
        }, BARCODE_CONFIG.SCAN_TIMEOUT)
        
        e.preventDefault()
      }
      
      // Tangani Enter key untuk scan cepat
      if (e.key === 'Enter' && barcodeBufferRef.current.length >= BARCODE_CONFIG.MIN_LENGTH) {
        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current)
        }
        processBarcodeScan()
        e.preventDefault()
      }
    }

    document.addEventListener('keydown', handleGlobalKeyPress)

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyPress)
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current)
      }
    }
  }, [fetchTransaksi, fetchUser, focusSearchInput, processBarcodeScan])

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
    focusSearchInput,
    showBarcodeNotFoundAlert,
    showToast
  }
}