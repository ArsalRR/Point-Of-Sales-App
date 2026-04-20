import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useKasir } from '@/hooks/useKasir'
import { parseRupiah, getCurrentPrice, formatRupiah as formatRupiahUtil, SATUAN_TYPES } from '@/utils/kasirUtils'
import { calculatePromoDiscount } from '@/utils/promoUtils'
import { postKasir } from '@/api/Kasirapi'
import Swal from 'sweetalert2'

const MAX_HOLDS = 3

function hitungTotalHarga(cart) {
  return cart.reduce((sum, item) => sum + (getCurrentPrice(item) * item.jumlah), 0)
}

function useWindowWidth() {
  const [width, setWidth] = useState(() => window.innerWidth)
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return width
}

function hitungPaymentStatus(total, totalUangRaw, formatRupiah) {
  const totalUang = parseRupiah(totalUangRaw) || 0
  if (!totalUang || total === 0) return { status: 'empty' }
  const selisih = totalUang - total
  if (selisih < 0) {
    return { status: 'insufficient', message: formatRupiah(Math.abs(selisih)) }
  }
  if (selisih === 0) {
    return { status: 'exact', message: 'Uang pas' }
  }
  return { status: 'overpaid', message: formatRupiah(selisih) }
}

export function useListKasir() {
  const kasir = useKasir()

  const width     = useWindowWidth()
  const isTablet  = width >= 768 && width < 1024
  const isDesktop = width >= 1024

  const [ringkasanPosition, setRingkasanPosition] = useState('right')
  const [showPaymentModal,  setShowPaymentModal]  = useState(false)
  const [showHoldModal,     setShowHoldModal]     = useState(false)
  const [holds,             setHolds]             = useState([])
  const [cartOverride,      setCartOverride]      = useState(null)
  const [diskonOverride,    setDiskonOverride]    = useState(null)
  const [dropdownRect,      setDropdownRect]      = useState(null)

  const searchWrapperRef = useRef(null)

  const {
    showPrint, printData,
    searchQuery, setSearchQuery,
    showSearchResults, setShowSearchResults,
    cart: hookCart, isProcessing, formData: hookFormData, transaksi,
    searchInputRef,
    searchResults, cartSubtotal: hookCartSubtotal, total: hookTotal, paymentStatus: hookPaymentStatus,
    setShowPrint, setPrintData,
    addProductToCart: hookAddProduct,
    updateQty: hookUpdateQty,
    removeItem: hookRemoveItem,
    removeItemByKode: hookRemoveItemByKode,
    subtotal, handleChangeSatuan: hookHandleChangeSatuan,
    handleDiskonChange: hookHandleDiskonChange,
    handleTotalUangChange,
    handleSubmit: hookHandleSubmit,
    user,
    getCurrentPrice: hookGetCurrentPrice,
    getSatuanInfo, formatRupiah, focusSearchInput,
    handleQuickAmount,
    hargaPromo, promoLoaded,
  } = kasir

  // ─── Derived state ──────────────────────────────────────────────────────────

  const cart = cartOverride !== null ? cartOverride : hookCart

  const formData = diskonOverride !== null
    ? { ...hookFormData, diskon: diskonOverride }
    : hookFormData

  const cartSubtotal = cartOverride !== null
    ? hitungTotalHarga(cartOverride)
    : hookCartSubtotal

  const total = cartOverride !== null
    ? Math.max(0, hitungTotalHarga(cartOverride) - (parseRupiah(formData.diskon) || 0))
    : hookTotal

  const paymentStatus = useMemo(() => {
    if (cartOverride !== null) {
      return hitungPaymentStatus(total, hookFormData.total_uang, formatRupiah)
    }
    return hookPaymentStatus
  }, [cartOverride, total, hookFormData.total_uang, hookPaymentStatus, formatRupiah])

  // ─── Dropdown rect ──────────────────────────────────────────────────────────

  const updateDropdownRect = useCallback(() => {
    if (!searchInputRef.current) return
    const rect = searchInputRef.current.getBoundingClientRect()
    setDropdownRect({ top: rect.bottom + 6, left: rect.left, width: rect.width })
  }, [searchInputRef])

  // ─── Cart handlers ──────────────────────────────────────────────────────────

  const handleDiskonChange = useCallback((e) => {
    if (cartOverride !== null) setDiskonOverride(e.target.value)
    hookHandleDiskonChange(e)
  }, [cartOverride, hookHandleDiskonChange])

  // updateQty: spesifik per kode_barang + satuan
  const updateQty = useCallback((kodeBarang, satuan, qty, e) => {
    if (cartOverride !== null) {
      if (qty < 1) {
        setCartOverride(prev => {
          const next = prev.filter(i =>
            !(i.kode_barang === kodeBarang &&
              (i.satuan_terpilih || SATUAN_TYPES.SATUAN) === satuan)
          )
          return next.length > 0 ? next : null
        })
      } else {
        setCartOverride(prev =>
          prev.map(i =>
            i.kode_barang === kodeBarang &&
            (i.satuan_terpilih || SATUAN_TYPES.SATUAN) === satuan
              ? { ...i, jumlah: qty }
              : i
          )
        )
      }
    } else {
      hookUpdateQty(kodeBarang, satuan, qty, e)
    }
  }, [cartOverride, hookUpdateQty])
  const removeItem = useCallback((kodeBarang, satuan) => {
    if (cartOverride !== null) {
      setCartOverride(prev => {
        const next = prev.filter(i =>
          !(i.kode_barang === kodeBarang &&
            (i.satuan_terpilih || SATUAN_TYPES.SATUAN) === satuan)
        )
        return next.length > 0 ? next : null
      })
    } else {
      hookRemoveItem(kodeBarang, satuan)
    }
  }, [cartOverride, hookRemoveItem])

  // addProductToCart: key unik = kode_barang + satuan 'satuan'
  const addProductToCart = useCallback((product) => {
    if (cartOverride !== null) {
      setCartOverride(prev => {
        const existIndex = prev.findIndex(i =>
          i.kode_barang === product.kode_barang &&
          (i.satuan_terpilih || SATUAN_TYPES.SATUAN) === SATUAN_TYPES.SATUAN
        )
        if (existIndex !== -1) {
          return prev.map((i, idx) =>
            idx === existIndex ? { ...i, jumlah: i.jumlah + 1 } : i
          )
        }
        return [
          { ...product, jumlah: 1, satuan_terpilih: SATUAN_TYPES.SATUAN },
          ...prev,
        ]
      })
    } else {
      hookAddProduct(product)
    }
  }, [cartOverride, hookAddProduct])

  // handleChangeSatuan: spesifik per kode_barang + oldSatuan
  const handleChangeSatuan = useCallback((kodeBarang, oldSatuan, newSatuan) => {
    if (cartOverride !== null) {
      setCartOverride(prev =>
        prev.map(i =>
          i.kode_barang === kodeBarang &&
          (i.satuan_terpilih || SATUAN_TYPES.SATUAN) === oldSatuan
            ? { ...i, satuan_terpilih: newSatuan, jumlah: 1 }
            : i
        )
      )
    } else {
      hookHandleChangeSatuan(kodeBarang, oldSatuan, newSatuan)
    }
  }, [cartOverride, hookHandleChangeSatuan])

  // ─── Hold ────────────────────────────────────────────────────────────────────

  const toastConfig = (icon, title, text, color = '#6b7280', progressColor = 'bg-gray-500') => ({
    toast: true, position: 'top-end', icon,
    title, text,
    showConfirmButton: false, timer: 2000, timerProgressBar: true,
    background: '#ffffff', iconColor: color,
    customClass: {
      popup: 'rounded-xl shadow-lg',
      title: 'text-sm font-semibold text-gray-800',
      timerProgressBar: progressColor
    },
  })

  const handleHold = useCallback(() => {
    if (cart.length === 0) {
      Swal.fire(toastConfig('warning', 'Keranjang Kosong!', 'Tidak ada transaksi yang dapat ditahan'))
      return
    }
    if (holds.length >= MAX_HOLDS) {
      Swal.fire(toastConfig('error', 'Slot Penuh!', `Maksimal ${MAX_HOLDS} transaksi dapat ditahan`))
      return
    }

    const snapshot      = JSON.parse(JSON.stringify(cart))
    const currentDiskon = formData.diskon
    const diskonValue   = parseRupiah(currentDiskon) || 0
    const subtotalValue = hitungTotalHarga(snapshot)
    const totalSetelahDiskon = Math.max(0, subtotalValue - diskonValue)

    setHolds(prev => [...prev, {
      id: Date.now(),
      cart: snapshot,
      diskon: currentDiskon,
      diskonValue,
      subtotal: subtotalValue,
      totalHarga: totalSetelahDiskon,
      heldAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      totalItems: snapshot.reduce((sum, i) => sum + i.jumlah, 0),
    }])

    if (cartOverride !== null) {
      // Cart override: cukup reset override
      setCartOverride(null)
      setDiskonOverride(null)
    } else {
      // Hook cart: hapus semua baris per unique kode_barang
      // hookRemoveItemByKode menghapus SEMUA baris dengan kode_barang tsb (satuan & renteng sekaligus)
      const uniqueKodes = [...new Set(snapshot.map(i => i.kode_barang))]
      uniqueKodes.forEach(kode => hookRemoveItemByKode(kode))
    }

    hookHandleDiskonChange({ target: { value: '' } })

    setTimeout(() => {
      Swal.fire(toastConfig('success', 'Transaksi Ditahan!', `Pesanan berhasil disimpan${currentDiskon ? ' dengan diskon' : ''}`, '#10b981', 'bg-black'))
    }, 100)
  }, [cart, cartOverride, holds, formData.diskon, hookRemoveItemByKode, hookHandleDiskonChange])

  const handleRestore = useCallback((holdId) => {
    const target = holds.find(h => h.id === holdId)
    if (!target) return
    setHolds(prev => prev.filter(h => h.id !== holdId))
    setCartOverride(JSON.parse(JSON.stringify(target.cart)))
    const diskon = target.diskon || ''
    setDiskonOverride(diskon || null)
    hookHandleDiskonChange({ target: { value: diskon } })
  }, [holds, hookHandleDiskonChange])

  const handleDeleteHold = useCallback((holdId) => {
    setHolds(prev => prev.filter(h => h.id !== holdId))
  }, [])

  // ─── Promo auto-apply ────────────────────────────────────────────────────────

  useEffect(() => {
    if (cartOverride === null || !promoLoaded) return
    if (cartOverride.length === 0) {
      setDiskonOverride(null)
      hookHandleDiskonChange({ target: { value: '' } })
      return
    }
    const totalDiskonPromo = calculatePromoDiscount(cartOverride, hargaPromo)
    const newDiskon = totalDiskonPromo > 0 ? formatRupiahUtil(totalDiskonPromo) : ''
    setDiskonOverride(newDiskon || null)
    hookHandleDiskonChange({ target: { value: newDiskon } })
  }, [cartOverride, hargaPromo, promoLoaded, hookHandleDiskonChange])

  // ─── Fokus otomatis ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!showPaymentModal) {
      const id = setTimeout(() => searchInputRef.current?.focus(), 150)
      return () => clearTimeout(id)
    }
  }, [showPaymentModal, searchInputRef])

  useEffect(() => {
    if (!showPrint) {
      const id = setTimeout(() => searchInputRef.current?.focus(), 150)
      return () => clearTimeout(id)
    }
  }, [showPrint, searchInputRef])

  useEffect(() => {
    if (showSearchResults) updateDropdownRect()
  }, [showSearchResults, updateDropdownRect])

  // ─── Payment modal ────────────────────────────────────────────────────────────

  const handleOpenPaymentModal = useCallback(() => {
    if (cart.length === 0 || isProcessing) return
    setShowPaymentModal(true)
  }, [cart.length, isProcessing])

  const handleModalClose = useCallback(() => setShowPaymentModal(false), [])

  const handleSubmit = useCallback(async (e, isCetak = false) => {
    e.preventDefault()

    if (cartOverride !== null && cartOverride.length > 0) {
      const overrideSubtotal = hitungTotalHarga(cartOverride)
      const diskonValue  = parseRupiah(diskonOverride || '') || 0
      const overrideTotal = Math.max(0, overrideSubtotal - diskonValue)
      const totalUang    = parseRupiah(hookFormData.total_uang) || 0
      const kembalian    = totalUang > 0 ? Math.max(0, totalUang - overrideTotal) : 0

      const payload = {
        produk_id: cartOverride.map(i => i.kode_barang),
        jumlah_terjual_per_hari: cartOverride.map(i => i.jumlah),
        satuan: cartOverride.map(i => i.satuan_terpilih || i.satuan),
        users_id: user?.id,
        diskon: diskonValue,
      }

      try {
        const res = await postKasir(payload)
        setPrintData({
          no_transaksi: res.no_transaksi,
          items: cartOverride.map(item => ({
            jumlah: item.jumlah,
            nama_barang: item.nama_barang,
            harga: hookGetCurrentPrice(item),
            satuan: item.satuan_terpilih || item.satuan,
          })),
          subtotal: overrideSubtotal,
          diskon: diskonValue,
          total: overrideTotal,
          total_uang: totalUang,
          kembalian,
        })
        setCartOverride(null)
        setDiskonOverride(null)
        hookHandleDiskonChange({ target: { value: '' } })
        if (isCetak) setShowPrint(true)
        focusSearchInput()
      } catch (error) {
        console.error('Error posting transaksi override:', error)
        Swal.fire({
          toast: true, position: 'top-end', icon: 'error',
          title: 'Gagal', text: 'Terjadi kesalahan saat memproses transaksi',
          showConfirmButton: false, timer: 3000
        })
      }
      return
    }

    await hookHandleSubmit(e, isCetak)
  }, [cartOverride, diskonOverride, hookFormData.total_uang, user, setPrintData, setShowPrint, hookHandleDiskonChange, hookHandleSubmit, focusSearchInput, hookGetCurrentPrice])

  const handleModalOk = useCallback(async () => {
    setShowPaymentModal(false)
    await handleSubmit({ preventDefault: () => {} }, false)
    Swal.fire(toastConfig('success', 'Transaksi Berhasil!', 'Pesanan sudah tersimpan', '#059669', 'bg-emerald-500'))
  }, [handleSubmit])

  const handleModalCetak = useCallback(async () => {
    setShowPaymentModal(false)
    await handleSubmit({ preventDefault: () => {} }, true)
  }, [handleSubmit])

  // ─── Search handlers ──────────────────────────────────────────────────────────

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value
    setSearchQuery(value)
    if (!value) { setShowSearchResults(false); return }
    setShowSearchResults(true)
    if (value.length >= 3) {
      setTimeout(() => {
        const exact = transaksi.find(p => p.kode_barang.trim() === value.trim())
        if (exact) {
          addProductToCart(exact)
          setSearchQuery('')
          setShowSearchResults(false)
        }
      }, 0)
    }
  }, [transaksi, addProductToCart, setSearchQuery, setShowSearchResults])

  const handleSearchKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const product = transaksi.find(p => p.kode_barang.trim() === searchQuery.trim())
      if (product) {
        addProductToCart(product); setSearchQuery(''); setShowSearchResults(false); return
      }
      if (searchResults.length > 0) {
        addProductToCart(searchResults[0]); setSearchQuery(''); setShowSearchResults(false)
      }
    }
    if (e.key === 'Escape') setShowSearchResults(false)
  }, [transaksi, searchQuery, searchResults, addProductToCart, setSearchQuery, setShowSearchResults])

  const handleSearchResultSelect = useCallback((product) => {
    addProductToCart(product)
    setSearchQuery('')
    setShowSearchResults(false)
  }, [addProductToCart, setSearchQuery, setShowSearchResults])

  const handleSearchClear = useCallback(() => {
    setSearchQuery('')
    setShowSearchResults(false)
    searchInputRef.current?.focus()
  }, [setSearchQuery, setShowSearchResults, searchInputRef])

  const handleSearchFocus = useCallback(() => {
    if (searchQuery.length > 0) setShowSearchResults(true)
    updateDropdownRect()
  }, [searchQuery, setShowSearchResults, updateDropdownRect])

  const handleSearchBlur = useCallback(() => {
    setTimeout(() => setShowSearchResults(false), 200)
  }, [setShowSearchResults])

  // ─── Print ────────────────────────────────────────────────────────────────────

  const handleClosePrint = useCallback(() => {
    setShowPrint(false)
    setPrintData(null)
    focusSearchInput()
  }, [setShowPrint, setPrintData, focusSearchInput])

  // ─── Hold modal ───────────────────────────────────────────────────────────────

  const handleOpenHoldModal  = useCallback(() => setShowHoldModal(true),  [])
  const handleCloseHoldModal = useCallback(() => setShowHoldModal(false), [])

  // ─── Quick amounts ─────────────────────────────────────────────────────────────

  const getQuickAmounts = useCallback((totalValue) => {
    if (!totalValue) return []
    const rounds = [
      totalValue,
      Math.ceil(totalValue / 1000)   * 1000,
      Math.ceil(totalValue / 5000)   * 5000,
      Math.ceil(totalValue / 10000)  * 10000,
      Math.ceil(totalValue / 50000)  * 50000,
      Math.ceil(totalValue / 100000) * 100000,
    ]
    return [...new Set(rounds)].slice(0, 5)
  }, [])

  // ─── Return ────────────────────────────────────────────────────────────────────

  return {
    // Layout
    isTablet, isDesktop,
    ringkasanPosition, setRingkasanPosition,

    // Payment modal
    showPaymentModal,
    handleOpenPaymentModal, handleModalClose, handleModalOk, handleModalCetak,

    // Hold modal
    showHoldModal,
    handleOpenHoldModal, handleCloseHoldModal,

    // Hold
    holds, MAX_HOLDS,
    handleHold, handleRestore, handleDeleteHold,

    // Print
    showPrint, printData, handleClosePrint,

    // Search
    searchQuery, showSearchResults, setShowSearchResults,
    searchInputRef, searchResults, searchWrapperRef,
    dropdownRect,
    handleSearchChange, handleSearchKeyDown, handleSearchResultSelect,
    handleSearchClear, handleSearchFocus, handleSearchBlur,

    // Cart
    cart, isProcessing, formData, transaksi,
    cartSubtotal, total, paymentStatus,
    addProductToCart, updateQty, removeItem,
    subtotal, handleChangeSatuan,

    // Pembayaran
    handleDiskonChange, handleTotalUangChange, handleQuickAmount,
    getQuickAmounts,

    // Utils
    getCurrentPrice: hookGetCurrentPrice,
    getSatuanInfo, formatRupiah, parseRupiah,
  }
}