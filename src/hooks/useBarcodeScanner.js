import { useEffect, useRef, useCallback } from 'react'
import { BARCODE_CONFIG, EXCLUDED_INPUT_IDS } from '@/utils/kasirUtils'

/**
 * Custom hook untuk menangani barcode scanner
 * @param {Object} params - Parameter untuk hook
 * @param {Function} params.onBarcodeFound - Callback ketika barcode ditemukan
 * @param {Function} params.onSearchInput - Callback untuk input pencarian manual
 * @param {Object} params.searchInputRef - Ref untuk input search
 * @param {string} params.searchQuery - Query pencarian saat ini
 * @param {Function} params.setSearchQuery - Setter untuk search query
 * @param {Function} params.setShowSearchResults - Setter untuk menampilkan hasil pencarian
 * @param {Function} params.fetchTransaksi - Function untuk fetch data transaksi
 * @param {Function} params.fetchUser - Function untuk fetch data user
 * @param {Function} params.focusSearchInput - Function untuk fokus ke input search
 */
export const useBarcodeScanner = ({
  onBarcodeFound,
  searchInputRef,
  searchQuery,
  setSearchQuery,
  setShowSearchResults,
  fetchTransaksi,
  fetchUser,
  focusSearchInput
}) => {
  const barcodeBufferRef = useRef('')
  const lastKeyTimeRef = useRef(0)

  /**
   * Handler untuk input pencarian manual dari keyboard
   * @param {string} key - Key yang ditekan
   */
  const handleManualSearchInput = useCallback((key) => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
      const newValue = searchQuery + key
      setSearchQuery(newValue)
      setShowSearchResults(newValue.length > 0)
    }
  }, [searchQuery, setSearchQuery, setShowSearchResults, searchInputRef])

  /**
   * Handler untuk memproses barcode yang discan
   * @param {string} barcode - Barcode yang terdeteksi
   */
  const processBarcode = useCallback((barcode) => {
    if (barcode.length >= BARCODE_CONFIG.MIN_LENGTH) {
      onBarcodeFound(barcode.trim())
      barcodeBufferRef.current = ''
    }
  }, [onBarcodeFound])

  useEffect(() => {
    // Initialize data fetching
    if (fetchTransaksi) fetchTransaksi()
    if (fetchUser) fetchUser()
    if (focusSearchInput && searchInputRef) focusSearchInput(searchInputRef, 0)

    let scanTimeout = null

    /**
     * Handler untuk global key press (barcode scanner)
     * @param {KeyboardEvent} e - Keyboard event
     */
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
      const isSearchInput = activeElement === searchInputRef?.current ||
        (activeElement && activeElement.id === 'unified-search')

      // Skip jika sedang berada di komponen yang tidak boleh diinterupsi
      if (isInSelectComponent) return
      if (isTypingInInput && isExcludedInput) return
      if (isTypingInInput && isSearchInput) return
      if (isTypingInInput && !isSearchInput && !isExcludedInput) return

      // Handling untuk input pencarian manual
      if (e.key.length === 1 && /[a-zA-Z0-9 ]/.test(e.key) && !isTypingInInput) {
        e.preventDefault()
        handleManualSearchInput(e.key)
        return
      }

      const currentTime = Date.now()
      lastKeyTimeRef.current = currentTime

      // Barcode scanner detection
      if (e.key.length === 1) {
        barcodeBufferRef.current += e.key
        if (scanTimeout) clearTimeout(scanTimeout)

        scanTimeout = setTimeout(() => {
          processBarcode(barcodeBufferRef.current)
        }, BARCODE_CONFIG.SCAN_TIMEOUT)
      }

      // Enter key untuk barcode scanner
      if (e.key === 'Enter' && barcodeBufferRef.current.length >= BARCODE_CONFIG.MIN_LENGTH) {
        if (scanTimeout) clearTimeout(scanTimeout)
        processBarcode(barcodeBufferRef.current)
        e.preventDefault()
      }
    }

    document.addEventListener('keydown', handleGlobalKeyPress)

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyPress)
      if (scanTimeout) clearTimeout(scanTimeout)
    }
  }, [
    searchQuery,
    onBarcodeFound,
    handleManualSearchInput,
    processBarcode,
    fetchTransaksi,
    fetchUser,
    focusSearchInput,
    searchInputRef
  ])
}