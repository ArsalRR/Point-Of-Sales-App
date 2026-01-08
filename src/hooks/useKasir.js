import { useState, useEffect, useRef, useMemo,useCallback } from 'react'
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

export const useKasir = () => {
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
  const scanTimeoutRef = useRef(null)
  const isProcessingBarcodeRef = useRef(false)
  const lastBarcodeProcessedRef = useRef({ code: '', timestamp: 0 })
  const addToCartLockRef = useRef(false)

  // Utility functions
  const showToast = useCallback((title, text, icon, timer = 3000) => {
    Swal.fire({ ...TOAST_CONFIG, title, text, icon, timer })
  }, [])

  const focusSearchInput = useCallback((delay = BARCODE_CONFIG.FOCUS_DELAY) => {
    setTimeout(() => searchInputRef.current?.focus(), delay)
  }, [])

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
      didClose: () => focusSearchInput()
    })
  }, [focusSearchInput])

  // Computed values
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

  // API functions
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

  // Cart operations
  const addProductToCart = useCallback((product, quantity = 1) => {
    if (!product) return

    if (addToCartLockRef.current) {
      return
    }

    addToCartLockRef.current = true

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

    setTimeout(() => {
      addToCartLockRef.current = false
    }, 500)
  }, [showToast])

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

  // Promo handling
  const checkAndApplyPromo = useCallback(() => {
    if (!promoLoaded) return
    
    if (cart.length === 0 || hargaPromo.length === 0) {
      setFormData(prev => ({ ...prev, diskon: "" }))
      return
    }

    const totalDiskonPromo = calculatePromoDiscount(cart, hargaPromo)
    setFormData(prev => ({
      ...prev,
      diskon: totalDiskonPromo > 0 ? formatRupiah(totalDiskonPromo) : ""
    }))
  }, [cart, hargaPromo, promoLoaded, formatRupiah])

  // Form handlers
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
      setFormData(prev => ({ ...prev, total_uang: "", kembalian: 0 }))
    }
  }, [cartSubtotal, formData.diskon])

  // Search handlers
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

  // Barcode scanner
  const handleBarcodeFound = useCallback((barcode) => {
    const now = Date.now()
    
    const timeSinceLastProcess = now - lastBarcodeProcessedRef.current.timestamp
    if (lastBarcodeProcessedRef.current.code === barcode && timeSinceLastProcess < 2000) {
      return
    }
    
    if (addToCartLockRef.current) {
      return
    }
    
    lastBarcodeProcessedRef.current = { code: barcode, timestamp: now }

    const product = transaksiRef.current.find(p =>
      p.kode_barang.trim().toLowerCase() === barcode.toLowerCase()
    )

    if (product) {
      addProductToCart(product, 1)
      
      if (searchInputRef.current) {
        searchInputRef.current.value = ''
      }
      setSearchQuery('')
      setShowSearchResults(false)
      focusSearchInput(50)
    } else {
      showBarcodeNotFoundAlert(barcode)
      setSearchQuery('')
      if (searchInputRef.current) {
        searchInputRef.current.value = ''
      }
      focusSearchInput(100)
    }
  }, [addProductToCart, focusSearchInput, showBarcodeNotFoundAlert])

  const processBarcode = useCallback((barcode) => {
    if (isProcessingBarcodeRef.current) {
      return
    }
    
    if (!barcode || barcode.length < BARCODE_CONFIG.MIN_LENGTH) {
      return
    }
    
    isProcessingBarcodeRef.current = true
    
    barcodeBufferRef.current = ''
    
    if (searchInputRef.current) {
      searchInputRef.current.value = ''
    }
    
    handleBarcodeFound(barcode)
    
    setTimeout(() => {
      isProcessingBarcodeRef.current = false
    }, 1000)
    
  }, [handleBarcodeFound])

  // Transaction processing
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

  // Effects
  useEffect(() => {
    fetchHargaPromo()
  }, [fetchHargaPromo])

  useEffect(() => {
    transaksiRef.current = transaksi
  }, [transaksi])

  useEffect(() => {
    checkAndApplyPromo()
  }, [checkAndApplyPromo])

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

  useEffect(() => {
    fetchTransaksi()
    fetchUser()
    
    setTimeout(() => {
      focusSearchInput(0)
    }, 300)

    const handleGlobalKeyDown = (e) => {
      const active = document.activeElement
      const isTextArea = active?.tagName === 'TEXTAREA'
      const isContentEditable = active?.contentEditable === 'true'
      const isSearchInput = active === searchInputRef.current
      const activeElementId = active?.id || ''
      const isNumberInput = active?.tagName === 'INPUT' && active?.type === 'number'
      
      const isExcludedInput = EXCLUDED_INPUT_IDS.includes(activeElementId)
      
      if (isTextArea || isContentEditable || isExcludedInput || (isNumberInput && !isSearchInput)) {
        return
      }
      
      const currentTime = Date.now()
      const timeSinceLastKey = currentTime - lastKeyTimeRef.current
      
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        
        if (isSearchInput && timeSinceLastKey > 150) {
          barcodeBufferRef.current = ''
          return
        }
        
        e.preventDefault()
        e.stopPropagation()
        
        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current)
        }
        
        barcodeBufferRef.current += e.key
        lastKeyTimeRef.current = currentTime
        
        if (searchInputRef.current) {
          if (!isSearchInput) {
            searchInputRef.current.focus()
          }
          searchInputRef.current.value = barcodeBufferRef.current
          setSearchQuery(barcodeBufferRef.current)
          setShowSearchResults(barcodeBufferRef.current.length > 2)
        }
        
        scanTimeoutRef.current = setTimeout(() => {
          if (barcodeBufferRef.current.length >= BARCODE_CONFIG.MIN_LENGTH) {
            const scannedBarcode = barcodeBufferRef.current.trim()
            
            const allSame = scannedBarcode.split('').every(char => char === scannedBarcode[0])
            const isValid = !allSame || scannedBarcode.length <= 3
            
            if (isValid) {
              processBarcode(scannedBarcode)
            } else {
              barcodeBufferRef.current = ''
              if (searchInputRef.current) {
                searchInputRef.current.value = ''
                setSearchQuery('')
                setShowSearchResults(false)
              }
            }
          } else {
            barcodeBufferRef.current = ''
            if (searchInputRef.current) {
              searchInputRef.current.value = ''
              setSearchQuery('')
              setShowSearchResults(false)
            }
          }
        }, BARCODE_CONFIG.SCAN_TIMEOUT)
      }
      
      else if (e.key === 'Enter') {
        if (barcodeBufferRef.current.length >= BARCODE_CONFIG.MIN_LENGTH) {
          e.preventDefault()
          e.stopPropagation()
          
          if (scanTimeoutRef.current) {
            clearTimeout(scanTimeoutRef.current)
            scanTimeoutRef.current = null
          }
          
          const scannedBarcode = barcodeBufferRef.current.trim()
          barcodeBufferRef.current = ''
          
          const allSame = scannedBarcode.split('').every(char => char === scannedBarcode[0])
          const isValid = !allSame || scannedBarcode.length <= 3
          
          if (isValid) {
            processBarcode(scannedBarcode)
          }
        }
        else if (isSearchInput && searchResults.length > 0) {
          return
        }
      }
      
      else if (e.key === 'Escape') {
        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current)
          scanTimeoutRef.current = null
        }
        barcodeBufferRef.current = ''
        if (searchInputRef.current) {
          searchInputRef.current.value = ''
          setSearchQuery('')
          setShowSearchResults(false)
        }
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown, true)

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown, true)
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current)
      }
    }
  }, [fetchTransaksi, fetchUser, focusSearchInput, processBarcode, searchResults.length])

  // Return values
  return {
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
    searchInputRef,
    searchResults,
    cartSubtotal,
    total,
    paymentStatus,
    fetchTransaksi,
    fetchUser,
    addProductToCart,
    updateQty,
    removeItem,
    subtotal,
    handleChangeSatuan,
    handleDiskonChange,
    handleTotalUangChange,
    handleSearchSelect,
    handleSubmit,
    handleBarcodeFound,
    getCurrentPrice,
    getSatuanInfo,
    formatRupiah,
    focusSearchInput: () => focusSearchInput(0),
    showBarcodeNotFoundAlert,
    showToast
  }
}