import { useState } from 'react'
import { useKasir } from '@/hooks/useKasir'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { parseRupiah } from '@/utils/kasirUtils'
import Swal from 'sweetalert2'

export function useListKasir() {
  const kasir = useKasir()
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [ringkasanPosition, setRingkasanPosition] = useState('right')
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const {
    showPrint, printData,
    searchQuery, setSearchQuery,
    showSearchResults, setShowSearchResults,
    cart, isProcessing, formData, transaksi,
    searchInputRef,
    searchResults, cartSubtotal, total, paymentStatus,
    setShowPrint, setPrintData,
    addProductToCart, updateQty, removeItem, subtotal, handleChangeSatuan,
    handleDiskonChange, handleTotalUangChange,
    handleSearchSelect,
    handleSubmit,
    getCurrentPrice, getSatuanInfo, formatRupiah, focusSearchInput,
    handleQuickAmount,
    
  } = kasir

  const handleOpenPaymentModal = () => {
    if (cart.length === 0 || isProcessing) return
    setShowPaymentModal(true)
  }

  const handleModalClose = () => setShowPaymentModal(false)

  const handleModalOk = async () => {
    setShowPaymentModal(false)
    await handleSubmit({ preventDefault: () => {} })
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Transaksi berhasil disimpan',
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
    })
  }

  const handleModalCetak = async () => {
    setShowPaymentModal(false)
    await handleSubmit({ preventDefault: () => {} }, true)
  }

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    const exactProduct = transaksi.find((p) => p.kode_barang.trim() === value.trim())
    if (exactProduct && value.length >= 3) {
      setTimeout(() => handleSearchSelect(exactProduct), 50)
      return
    }
    setShowSearchResults(value.length > 0)
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const product = transaksi.find((p) => p.kode_barang.trim() === searchQuery.trim())
      if (product) {
        handleSearchSelect(product)
        setSearchQuery('')
        setShowSearchResults(false)
        return
      }
      if (searchResults.length > 0) handleSearchSelect(searchResults[0])
    }
    if (e.key === 'Escape') setShowSearchResults(false)
  }

  const handleSearchResultSelect = (product) => {
    handleSearchSelect(product)
    setSearchQuery('')
    setShowSearchResults(false)
  }

  const handleSearchClear = () => {
    setSearchQuery('')
    setShowSearchResults(false)
    searchInputRef.current?.focus()
  }

  const handleClosePrint = () => {
    setShowPrint(false)
    setPrintData(null)
    focusSearchInput(searchInputRef)
  }

  return {
    // state
    isTablet,
    isDesktop,
    ringkasanPosition,
    setRingkasanPosition,
    showPaymentModal,

    // kasir state
    showPrint,
    printData,
    searchQuery,
    showSearchResults,
    cart,
    isProcessing,
    formData,
    transaksi,
    searchInputRef,
    searchResults,
    cartSubtotal,
    total,
    paymentStatus,
     showSearchResults,
  setShowSearchResults, 

    // handlers
    handleOpenPaymentModal,
    handleModalClose,
    handleModalOk,
    handleModalCetak,
    handleSearchChange,
    handleSearchKeyDown,
    handleSearchResultSelect,
    handleSearchClear,
    handleClosePrint,


    // kasir handlers
    addProductToCart,
    updateQty,
    removeItem,
    subtotal,
    handleChangeSatuan,
    handleDiskonChange,
    handleTotalUangChange,
    handleQuickAmount,

    // utils
    getCurrentPrice,
    getSatuanInfo,
    formatRupiah,
    parseRupiah,
  }
}