import { useState, useCallback, useEffect } from 'react'
import { useKasir } from '@/hooks/useKasir'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { parseRupiah, getCurrentPrice, formatRupiah as formatRupiahUtil } from '@/utils/kasirUtils'
import { calculatePromoDiscount } from '@/utils/promoUtils'
import { postKasir } from '@/api/Kasirapi'
import Swal from 'sweetalert2'

const MAX_HOLDS = 3

function hitungTotalHarga(cart) {
  return cart.reduce((sum, item) => {
    const harga =
      item.satuan_terpilih === 'renteng' ? (item.harga_renteng || item.harga)
      : item.satuan_terpilih === 'dus'   ? (item.harga_dus    || item.harga)
      : item.harga
    return sum + harga * item.jumlah
  }, 0)
}

export function useListKasir() {
  const kasir = useKasir()
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [ringkasanPosition, setRingkasanPosition] = useState('right')
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const [holds, setHolds] = useState([])
  const [cartOverride, setCartOverride] = useState(null)
  const [diskonOverride, setDiskonOverride] = useState(null)

  const {
    showPrint, printData,
    searchQuery, setSearchQuery,
    showSearchResults, setShowSearchResults,
    cart: hookCart, isProcessing, formData: hookFormData, transaksi,
    searchInputRef,
    searchResults, cartSubtotal: hookCartSubtotal, total: hookTotal, paymentStatus,
    setShowPrint, setPrintData,
    addProductToCart: hookAddProduct,
    updateQty: hookUpdateQty,
    removeItem: hookRemoveItem,
    subtotal, handleChangeSatuan,
    handleDiskonChange: hookHandleDiskonChange,
    handleTotalUangChange,
    handleSearchSelect,
    handleSubmit: hookHandleSubmit,
    postTransaksi: hookPostTransaksi,
    user,
    getCurrentPrice: hookGetCurrentPrice,
    getSatuanInfo, formatRupiah, focusSearchInput,
    handleQuickAmount,
    hargaPromo, promoLoaded,
  } = kasir

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

  const handleDiskonChange = useCallback((e) => {
    const value = e.target.value
    if (cartOverride !== null) {
      setDiskonOverride(value)
    }
    hookHandleDiskonChange(e)
  }, [cartOverride, hookHandleDiskonChange])

  const updateQty = useCallback((kodeBarang, qty, e) => {
    if (cartOverride !== null) {
      if (qty < 1) {
        setCartOverride(prev => {
          const next = prev.filter(i => i.kode_barang !== kodeBarang)
          return next.length > 0 ? next : null
        })
      } else {
        setCartOverride(prev =>
          prev.map(i => i.kode_barang === kodeBarang ? { ...i, jumlah: qty } : i)
        )
      }
    } else {
      hookUpdateQty(kodeBarang, qty, e)
    }
  }, [cartOverride, hookUpdateQty])

  const removeItem = useCallback((kodeBarang) => {
    if (cartOverride !== null) {
      setCartOverride(prev => {
        const next = prev.filter(i => i.kode_barang !== kodeBarang)
        return next.length > 0 ? next : null
      })
    } else {
      hookRemoveItem(kodeBarang)
    }
  }, [cartOverride, hookRemoveItem])

  const addProductToCart = useCallback((product) => {
    if (cartOverride !== null) {
      setCartOverride(prev => {
        const exist = prev.find(i => i.kode_barang === product.kode_barang)
        if (exist) {
          return prev.map(i =>
            i.kode_barang === product.kode_barang ? { ...i, jumlah: i.jumlah + 1 } : i
          )
        }
        return [...prev, { ...product, jumlah: 1, satuan_terpilih: product.satuan_terpilih || 'satuan' }]
      })
    } else {
      hookAddProduct(product)
    }
  }, [cartOverride, hookAddProduct])

  const handleHold = useCallback(() => {
    if (cart.length === 0 || holds.length >= MAX_HOLDS) return

    const snapshot = JSON.parse(JSON.stringify(cart))
    const currentDiskon = formData.diskon
    const diskonValue = parseRupiah(currentDiskon) || 0
    const subtotalValue = hitungTotalHarga(snapshot)
    const totalSetelahDiskon = Math.max(0, subtotalValue - diskonValue)

    setHolds(prev => [
      ...prev,
      {
        id: Date.now(),
        cart: snapshot,
        diskon: currentDiskon,
        diskonValue,
        subtotal: subtotalValue,
        totalHarga: totalSetelahDiskon,
        heldAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        totalItems: snapshot.reduce((sum, i) => sum + i.jumlah, 0),
      },
    ])

    if (cartOverride !== null) {
      setCartOverride(null)
      setDiskonOverride(null)
    } else {
      snapshot.forEach(item => hookRemoveItem(item.kode_barang))
    }
    hookHandleDiskonChange({ target: { value: '' } })
  }, [cart, cartOverride, holds, formData.diskon, hookRemoveItem, hookHandleDiskonChange])

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

  // ─── Recalculate promo saat cartOverride berubah ───────────────────────────
  // checkAndApplyPromo di useKasir hanya watch hookCart, bukan cartOverride.
  // Saat user hapus/ubah item di cartOverride, kita hitung ulang diskon promo
  // sendiri dan update diskonOverride agar total selalu sinkron.
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

  const handleOpenPaymentModal = () => {
    if (cart.length === 0 || isProcessing) return
    setShowPaymentModal(true)
  }

  const handleModalClose = () => setShowPaymentModal(false)

  // ─── FIX UTAMA ─────────────────────────────────────────────────────────────
  // Saat cartOverride aktif:
  //
  // 1. hookHandleSubmit → membaca `cart` dari closure useKasir (kosong) ✗
  // 2. hookPostTransaksi → membaca `cart` & `cartSubtotal` dari closure useKasir
  //    untuk membangun printData → hasilnya 0 ✗
  //
  // Solusi: saat cartOverride aktif, kita:
  //   a. Kirim payload ke API sendiri via postKasir (bukan hookPostTransaksi)
  //   b. Bangun printData sendiri dari cartOverride + diskonOverride
  //   c. Set printData & showPrint langsung via setPrintData / setShowPrint
  //      yang sudah diekspose dari useKasir
  // ──────────────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e, isCetak = false) => {
    e.preventDefault()

    if (cartOverride !== null && cartOverride.length > 0) {
      // Hitung semua nilai dari cartOverride — bukan dari hookCart
      const overrideSubtotal = hitungTotalHarga(cartOverride)
      const diskonValue = parseRupiah(diskonOverride || '') || 0
      const overrideTotal = Math.max(0, overrideSubtotal - diskonValue)
      const totalUang = parseRupiah(hookFormData.total_uang) || 0
      const kembalian = totalUang > 0 ? Math.max(0, totalUang - overrideTotal) : 0

      const payload = {
        produk_id: cartOverride.map(i => i.kode_barang),
        jumlah_terjual_per_hari: cartOverride.map(i => i.jumlah),
        satuan: cartOverride.map(i => i.satuan_terpilih || i.satuan),
        users_id: user?.id,
        diskon: diskonValue,
      }

      try {
        const res = await postKasir(payload)

        // Bangun printData dari cartOverride — bukan dari hookCart yang kosong
        const transactionData = {
          no_transaksi: res.no_transaksi,
          items: cartOverride.map(item => ({
            jumlah: item.jumlah,
            nama_barang: item.nama_barang,
            harga: getCurrentPrice(item),  // helper murni, tidak pakai closure
            satuan: item.satuan_terpilih || item.satuan,
          })),
          subtotal: overrideSubtotal,
          diskon: diskonValue,
          total: overrideTotal,
          total_uang: totalUang,
          kembalian,
        }

        // Set print data ke useKasir state agar NotaPembelian bisa render
        setPrintData(transactionData)

        // Reset override
        setCartOverride(null)
        setDiskonOverride(null)
        hookHandleDiskonChange({ target: { value: '' } })

        if (isCetak) {
          setShowPrint(true)
        }

        focusSearchInput()
      } catch (error) {
        console.error('Error posting transaksi override:', error)
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Gagal',
          text: 'Terjadi kesalahan saat memproses transaksi',
          showConfirmButton: false,
          timer: 3000,
        })
      }

      return
    }

    // Tidak ada override — pakai flow normal dari useKasir
    await hookHandleSubmit(e, isCetak)
  }, [
    cartOverride, diskonOverride,
    hookFormData.total_uang,
    user,
    setPrintData, setShowPrint,
    hookHandleDiskonChange, hookHandleSubmit,
    focusSearchInput,
  ])

  const handleModalOk = useCallback(async () => {
    setShowPaymentModal(false)
    await handleSubmit({ preventDefault: () => {} }, false)

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Transaksi Berhasil!',
      text: 'Pesanan sudah tersimpan',
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
      background: '#ffffff',
      iconColor: '#059669',
      customClass: {
        popup: 'rounded-xl shadow-lg',
        title: 'text-sm font-semibold text-gray-800',
        timerProgressBar: 'bg-emerald-500',
      },
    })
  }, [handleSubmit])

  const handleModalCetak = useCallback(async () => {
    setShowPaymentModal(false)
    await handleSubmit({ preventDefault: () => {} }, true)
  }, [handleSubmit])

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value
    setSearchQuery(value)

    if (!value) {
      setShowSearchResults(false)
      return
    }

    setShowSearchResults(true)

    if (value.length >= 3) {
      setTimeout(() => {
        const exactProduct = transaksi.find(p => p.kode_barang.trim() === value.trim())
        if (exactProduct) {
          addProductToCart(exactProduct)
          setSearchQuery('')
          setShowSearchResults(false)
        }
      }, 0)
    }
  }, [transaksi, addProductToCart, setSearchQuery, setShowSearchResults])

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const product = transaksi.find(p => p.kode_barang.trim() === searchQuery.trim())
      if (product) {
        addProductToCart(product)
        setSearchQuery('')
        setShowSearchResults(false)
        return
      }
      if (searchResults.length > 0) {
        addProductToCart(searchResults[0])
        setSearchQuery('')
        setShowSearchResults(false)
      }
    }
    if (e.key === 'Escape') setShowSearchResults(false)
  }

  const handleSearchResultSelect = useCallback((product) => {
    addProductToCart(product)
    setSearchQuery('')
    setShowSearchResults(false)
  }, [addProductToCart, setSearchQuery, setShowSearchResults])

  const handleSearchClear = () => {
    setSearchQuery('')
    setShowSearchResults(false)
    searchInputRef.current?.focus()
  }

  const handleClosePrint = () => {
    setShowPrint(false)
    setPrintData(null)
    focusSearchInput()
  }

  return {
    isTablet, isDesktop,
    ringkasanPosition, setRingkasanPosition,
    showPaymentModal,
    handleOpenPaymentModal, handleModalClose, handleModalOk, handleModalCetak,
    holds, MAX_HOLDS,
    handleHold, handleRestore, handleDeleteHold,
    showPrint, printData,
    searchQuery, showSearchResults, setShowSearchResults,
    cart, isProcessing, formData, transaksi,
    searchInputRef, searchResults,
    cartSubtotal, total, paymentStatus,
    addProductToCart, updateQty, removeItem,
    subtotal, handleChangeSatuan,
    handleDiskonChange, handleTotalUangChange, handleQuickAmount,
    handleSearchChange, handleSearchKeyDown, handleSearchResultSelect,
    handleSearchClear, handleClosePrint,
    getCurrentPrice: hookGetCurrentPrice, getSatuanInfo, formatRupiah, parseRupiah,
  }
}