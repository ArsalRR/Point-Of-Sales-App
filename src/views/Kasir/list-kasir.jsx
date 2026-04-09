import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ShoppingCart, Scan, Trash2, Plus, Minus, CreditCard,
  Search, X, ChevronLeft, ChevronRight, Printer, Clock, Hand,
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import NotaPembelian from '../Kasir/NotaPembelian'
import { useListKasir } from '@/hooks/Uselistkasir'
import Swal from 'sweetalert2'

function hasRenteng(val) {
  if (val === null || val === undefined) return false
  if (typeof val === 'string' && val.trim() === '') return false
  if (typeof val === 'number' && (isNaN(val) || val === 0)) return false
  return true
}

function LiveClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return <span className="font-mono text-sm text-gray-600 tabular-nums">{time}</span>
}

function QuickAmounts({ total, onSelect }) {
  if (!total) return null
  const rounds = [
    total,
    Math.ceil(total / 1000) * 1000,
    Math.ceil(total / 5000) * 5000,
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 50000) * 50000,
    Math.ceil(total / 100000) * 100000,
  ]
  const unique = [...new Set(rounds)].slice(0, 5)
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {unique.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onSelect(v)}
          className="h-9 px-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 active:scale-95 text-sm font-medium text-gray-700 transition-all"
        >
          Rp {v.toLocaleString('id-ID')}
        </button>
      ))}
    </div>
  )
}

function PaymentStatus({ paymentStatus, formatRupiah }) {
  if (!paymentStatus || paymentStatus.status === 'empty') return null
  const cfg = {
    insufficient: { bg: 'bg-gray-100 border-gray-300', text: 'text-gray-900', label: 'Uang Kurang' },
    overpaid: { bg: 'bg-gray-100 border-gray-300', text: 'text-gray-900', label: 'Kembalian' },
    exact: { bg: 'bg-gray-100 border-gray-300', text: 'text-gray-900', label: 'Uang Pas' },
  }
  const c = cfg[paymentStatus.status] || {}
  return (
    <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${c.bg}`}>
      <div className="flex-1">
        <p className={`text-xs font-semibold mb-0.5 ${c.text}`}>{c.label}</p>
        <p className={`text-lg font-bold ${c.text}`}>{paymentStatus.message}</p>
      </div>
    </div>
  )
}

function HoldModal({ isOpen, onClose, holds, onHold, onRestore, onDelete, cartLength, MAX_HOLDS }) {
  if (!isOpen) return null
  const canHold = cartLength > 0 && holds.length < MAX_HOLDS

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden w-full max-w-[380px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm leading-tight">Transaksi Disimpan</p>
              <p className="text-xs text-gray-500 mt-0.5">{holds.length} dari {MAX_HOLDS} slot terpakai</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

     <div className="px-4 py-3 flex flex-col gap-2.5 max-h-[400px] overflow-y-auto">
  {Array.from({ length: MAX_HOLDS }).map((_, i) => {
    const h = holds[i]
    if (h) {
      return (
        <div
          key={h.id}
          className="rounded-xl border border-gray-200 bg-white overflow-hidden"
        >
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            {/* Nomor */}
            <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-medium text-white">{i + 1}</span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-900 truncate">
                  Pelanggan {i + 1}
                </span>
                <span className="text-[11px] text-gray-400 flex-shrink-0">{h.heldAt}</span>
              </div>

              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="text-[11px] text-gray-500">{h.totalItems} item</span>
                {h.diskonValue > 0 && (
                  <>
                    <span className="text-[11px] text-gray-300">·</span>
                    <span className="text-[11px] text-gray-400 line-through">
                      Rp {h.subtotal?.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[11px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-medium">
                      -{h.diskonValue.toLocaleString('id-ID')}
                    </span>
                  </>
                )}
              </div>

              <p className="text-xs font-medium text-red-500 mt-1">
                Rp {h.totalHarga.toLocaleString('id-ID')}
              </p>
            </div>

            {/* Aksi */}
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button
                onClick={() => { onRestore(h.id); onClose() }}
                className="px-2.5 py-1 rounded-md bg-black hover:bg-gray-800 text-white text-[11px] font-medium transition-all active:scale-95"
              >
                + Keranjang
              </button>
              <button
                onClick={() => onDelete(h.id)}
                className="w-full py-1 rounded-md border border-gray-200 hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-[11px] transition-all active:scale-95"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div
        key={`empty-${i}`}
        className="rounded-xl border border-dashed border-gray-200"
      >
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <div className="w-7 h-7 rounded-full border border-dashed border-gray-200 flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] text-gray-300">{i + 1}</span>
          </div>
          <span className="text-sm text-gray-300">Slot kosong</span>
        </div>
      </div>
    )
  })}
</div>
      </div>
    </div>,
    document.body
  )
}

function VariantDropdown({ item, transaksi, addProductToCart }) {
  const [showVariant, setShowVariant] = useState(false)
  const [variantLimit, setVariantLimit] = useState(5)

  const getWords = (name) =>
    name
      .toLowerCase()
      .replace(/[\d\/]+\s*(kg|gr|gram|ltr|ml|pcs|pak|bks|bungkus|lusin|kodi)?/gi, ' ')
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3)

  const baseWords = getWords(item.nama_barang)
  const baseWordSet = new Set(baseWords)

  const calculateSimilarity = (namaBarang) => {
    const pWords = getWords(namaBarang)
    if (baseWords.length === 0 || pWords.length === 0) return 0
    const exactMatches = pWords.filter(w => baseWordSet.has(w)).length
    let partialMatches = 0
    for (const baseWord of baseWords) {
      for (const pWord of pWords) {
        if (pWord.includes(baseWord) || baseWord.includes(pWord)) { partialMatches++; break }
      }
    }
    return (exactMatches * 1.5 + partialMatches * 0.5) / Math.max(baseWords.length, pWords.length)
  }

  const allVariants = (transaksi || [])
    .filter((p) => p.kode_barang !== item.kode_barang && calculateSimilarity(p.nama_barang) >= 0.3)
    .map((p) => ({ ...p, _score: calculateSimilarity(p.nama_barang) }))
    .sort((a, b) => b._score - a._score)

  if (allVariants.length === 0) return null

  const handleShowVariant = () => {
    if (!showVariant) { setShowVariant(true); setVariantLimit(5) }
    else setVariantLimit(prev => prev === 5 ? Math.min(10, allVariants.length) : allVariants.length)
  }

  const displayedVariants = showVariant ? allVariants.slice(0, variantLimit) : []
  const isShowMoreVisible = showVariant && variantLimit < allVariants.length
  const isShowLessVisible = showVariant && variantLimit > 5

  return (
    <div className="mx-0 mt-0 border-t border-gray-200 bg-gray-50 rounded-b-xl px-4 py-3">
      {!showVariant ? (
        <button
          onClick={handleShowVariant}
          className="w-full py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition-all"
        >
          + Tampilkan Ukuran Lainnya ({allVariants.length})
        </button>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Ukuran Lainnya ({displayedVariants.length}/{allVariants.length})
            </p>
            <button onClick={() => setShowVariant(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {displayedVariants.map((p) => (
              <button
                key={p.kode_barang}
                onClick={() => addProductToCart(p)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-300 hover:border-gray-500 hover:bg-gray-100 transition-all active:scale-95"
              >
                <span className="text-xs text-gray-700">{p.nama_barang}</span>
                <span className="text-xs font-semibold text-gray-900">Rp {p.harga.toLocaleString()}</span>
                <span className="text-gray-500 text-sm ml-0.5">+</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {isShowMoreVisible && (
              <button onClick={handleShowVariant} className="flex-1 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 text-xs font-medium transition-all">
                Tampilkan {variantLimit === 5 ? 10 : allVariants.length} ukuran
              </button>
            )}
            {isShowLessVisible && (
              <button onClick={() => setVariantLimit(5)} className="flex-1 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 text-xs font-medium transition-all border border-gray-200">
                Tampilkan 5 Ukuran
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function CartItemCard({ item, updateQty, removeItem, handleChangeSatuan, subtotal, getCurrentPrice, getSatuanInfo, transaksi, addProductToCart }) {
  const price = getCurrentPrice(item)
  const sub = subtotal(item)
  const showSelect = hasRenteng(item.harga_renteng)

  return (
    <Card className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
      <CardContent className="p-0">
        <div className="flex items-start gap-3 px-4 pt-4 pb-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 leading-snug text-sm">{item.nama_barang}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge variant="outline" className="border-gray-200 text-gray-500 text-[11px] font-mono px-1.5 py-0 h-5 leading-none">
                {item.kode_barang}
              </Badge>
              <span className="text-[11px] text-gray-500 leading-none">
                Rp {price.toLocaleString()} / {item.satuan_terpilih || item.satuan}
              </span>
            </div>
          </div>
         <button
  onClick={() => removeItem(item.kode_barang)}
  className="mt-0.5 flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg text-red-600  focus:outline-none hover:bg-gray-100 transition-colors"
>
  <Trash2 className="w-4 h-4" />
</button>

        </div>

        <Separator className="bg-gray-200" />

        {showSelect && (
          <div className="px-4 pt-3 pb-1">
            <Select value={item.satuan_terpilih || 'satuan'} onValueChange={(v) => handleChangeSatuan(item.kode_barang, v)}>
              <SelectTrigger className="h-9 text-sm rounded-lg border border-gray-200 bg-white w-full focus:border-gray-400 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg">
                <SelectItem value="satuan">Satuan</SelectItem>
                <SelectItem value="renteng">Renteng</SelectItem>
                <SelectItem value="dus">Dus</SelectItem>
                <SelectItem value="pack">Pack</SelectItem>
                <SelectItem value="dingin">Minuman dingin</SelectItem>
                <SelectItem value="penjual_gas">Penjual gas</SelectItem>
                <SelectItem value="lusin">Lusin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-3 gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQty(item.kode_barang, item.jumlah - 1, e) }}
              className="h-9 w-9 p-0 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 flex-shrink-0"
            >
              <Minus className="w-3.5 h-3.5" />
            </Button>
            <Input
              type="number"
              value={item.jumlah}
              onChange={(e) => updateQty(item.kode_barang, Math.max(1, Number(e.target.value) || 1), e)}
              onFocus={(e) => e.target.scrollIntoView({ behavior: 'instant', block: 'nearest' })}
              onBlur={(e) => { if (!e.target.value || parseInt(e.target.value) < 1) updateQty(item.kode_barang, 1, e) }}
              className="w-12 h-9 text-center border border-gray-200 rounded-lg font-bold text-sm focus:border-gray-500 focus:ring-0 px-0 bg-white"
              min="1"
            />
            <Button
              variant="outline" size="sm"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQty(item.kode_barang, item.jumlah + 1, e) }}
              className="h-9 w-9 p-0 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-gray-900 text-sm leading-tight">Rp {sub.toLocaleString()}</p>
            {item.satuan_terpilih && item.satuan_terpilih !== 'satuan' && (
              <p className="text-[11px] text-gray-500 mt-0.5 truncate max-w-[100px]">{getSatuanInfo(item)}</p>
            )}
          </div>
        </div>

        <VariantDropdown item={item} transaksi={transaksi} addProductToCart={addProductToCart} />
      </CardContent>
    </Card>
  )
}

function PaymentModal({
  isOpen, onClose, onOk, onCetak,
  total, cartSubtotal, cartLength, formData,
  handleTotalUangChange, handleQuickAmount, handleDiskonChange,
  paymentStatus, formatRupiah, parseRupiah, isProcessing,
}) {
  if (!isOpen) return null
  const canSubmit = paymentStatus?.status !== 'insufficient' && cartLength > 0 && !isProcessing
  const diskonValue = parseRupiah(formData.diskon)
  const hasDiskon = formData.diskon && diskonValue > 0

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white w-full max-w-[520px] max-h-[90dvh] rounded-2xl flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base leading-tight">Pembayaran</p>
              <p className="text-xs text-gray-500 mt-0.5">{cartLength} item dalam keranjang</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Subtotal ({cartLength} item)</span>
              <span className="font-medium text-gray-900">Rp {cartSubtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">Potongan Harga</Label>
              <Input
                id="diskon" type="text" name="diskon"
                value={formData.diskon} onChange={handleDiskonChange}
                placeholder="Contoh: 5000 atau 10%"
                className="border border-gray-300 focus:border-black focus:ring-1 focus:ring-black/20 h-10 text-sm rounded-lg bg-white"
                autoComplete="off"
              />
            </div>
            {hasDiskon && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Potongan</span>
                <span className="font-semibold text-red-500">-{formatRupiah(diskonValue)}</span>
              </div>
            )}
            <Separator className="bg-gray-300" />
            <div className="flex justify-between items-baseline">
              <span className="font-bold text-gray-900 text-sm">TOTAL</span>
              <span className="font-black text-gray-900 text-2xl tracking-tight">Rp {total.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">Uang Dibayar</Label>
            <Input
              id="total_uang" type="text" name="total_uang"
              value={formData.total_uang} onChange={handleTotalUangChange}
              placeholder="Masukkan jumlah uang"
              className="h-14 text-xl font-bold border-2 border-black rounded-xl focus:border-black focus:ring-2 focus:ring-black/10 bg-white tracking-tight"
              autoComplete="off" autoFocus
            />
            <QuickAmounts total={total} onSelect={handleQuickAmount} />
          </div>

          <PaymentStatus paymentStatus={paymentStatus} formatRupiah={formatRupiah} />
        </div>

        <div className="px-5 pb-6 pt-3 border-t border-gray-200 flex gap-2.5 flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={isProcessing} className="flex-1 h-12 rounded-xl border-gray-200 text-gray-600 font-semibold hover:bg-gray-100">
            Batal
          </Button>
          <Button variant="outline" onClick={onCetak} disabled={!canSubmit} className="flex-1 h-12 rounded-xl border-gray-300 text-gray-800 font-semibold hover:bg-gray-100 gap-2">
            {isProcessing
              ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              : <Printer className="w-4 h-4" />}
            Cetak
          </Button>
          <Button onClick={onOk} disabled={!canSubmit} className="flex-[1.4] h-12 rounded-xl bg-black hover:bg-gray-800 text-white font-bold gap-2 border-0 disabled:opacity-40 transition-all">
            {isProcessing
              ? <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>}
            OK · Simpan
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ListKasir() {
  const {
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
    getCurrentPrice, getSatuanInfo, formatRupiah, parseRupiah,
  } = useListKasir()

  const searchWrapperRef = useRef(null)
  const [dropdownRect, setDropdownRect] = useState(null)
  const [showHoldModal, setShowHoldModal] = useState(false)

  const updateDropdownRect = () => {
    if (!searchInputRef.current) return
    const rect = searchInputRef.current.getBoundingClientRect()
    setDropdownRect({ top: rect.bottom + 6, left: rect.left, width: rect.width })
  }

  useEffect(() => {
    if (!showPaymentModal) {
      const id = setTimeout(() => searchInputRef.current?.focus(), 150)
      return () => clearTimeout(id)
    }
  }, [showPaymentModal])

  useEffect(() => {
    if (!showPrint) {
      const id = setTimeout(() => searchInputRef.current?.focus(), 150)
      return () => clearTimeout(id)
    }
  }, [showPrint])

  useEffect(() => {
    if (showSearchResults) updateDropdownRect()
  }, [showSearchResults])
  const handleRestoreWithDiskon = (holdId) => {
    handleRestore(holdId)
  }

  if (showPrint && printData) {
    return <NotaPembelian transactionData={printData} onClose={handleClosePrint} />
  }

  const SearchDropdown = showSearchResults && searchResults.length > 0 && dropdownRect
    ? createPortal(
        <div 
          className="fixed bg-white border border-gray-200 rounded-xl shadow-2xl overflow-y-auto z-[99999]"
          style={{ 
            top: dropdownRect.top, 
            left: dropdownRect.left, 
            width: dropdownRect.width, 
            maxHeight: 260 
          }}
        >
          {searchResults.map((product, index) => (
            <button
              key={product.kode_barang}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSearchResultSelect(product)}
              className={`flex items-center gap-3 w-full text-left px-4 py-2.5 transition-colors ${
                index < searchResults.length - 1 ? 'border-b border-gray-100' : ''
              } ${index === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{product.nama_barang}</p>
                <div className="flex gap-2 mt-0.5">
                  <span className="font-mono text-xs text-gray-500">{product.kode_barang}</span>
                  <span className="text-xs text-gray-500">· Rp {product.harga.toLocaleString()} / {product.satuan}</span>
                </div>
              </div>
              <Badge className="bg-black text-white text-xs font-semibold flex-shrink-0">{product.stok}</Badge>
            </button>
          ))}
        </div>,
        document.body
      )
    : null

  const CartColumn = (
    <div className="flex flex-col gap-3 col-span-3">
      <div ref={searchWrapperRef}>
        <Card className="border border-gray-200 bg-white rounded-xl shadow-sm">
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
                <Scan className="w-4 h-4 text-white" />
              </div>
              <Label className="text-gray-800 font-semibold text-sm">Scan Barcode / Cari Produk</Label>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => { if (searchQuery.length > 0) setShowSearchResults(true); updateDropdownRect() }}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                placeholder="Scan barcode atau ketik nama produk..."
                className="pl-9 pr-10 w-full border border-gray-300 rounded-xl focus:border-black focus:ring-1 focus:ring-black/20 bg-white transition-all h-11 text-sm"
                autoComplete="off"
                autoFocus
              />
              {searchQuery && (
                <Button variant="ghost" size="sm" onClick={handleSearchClear} className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {SearchDropdown}

      <Card className="border border-gray-200 bg-white rounded-xl shadow-sm flex-1">
        <CardHeader className="pb-3 pt-3.5 px-4 flex flex-row items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-sm font-semibold text-gray-900">Keranjang Belanja</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <Badge className="bg-gray-100 text-gray-600 border border-gray-200 font-semibold text-xs px-2">
                {cart.length} item
              </Badge>
            )}

            <button
              onClick={() => {
                if (cart.length === 0) {
                  Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'warning',
                    title: 'Keranjang Kosong!',
                    text: 'Tidak ada transaksi yang dapat ditahan',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                    background: '#ffffff',
                    iconColor: '#6b7280',
                    customClass: {
                      popup: 'rounded-xl shadow-lg',
                      title: 'text-sm font-semibold text-gray-800',
                      timerProgressBar: 'bg-gray-500',
                    },
                  });
                  return;
                }
                
                if (holds.length >= MAX_HOLDS) {
                  Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: 'Slot Penuh!',
                    text: `Maksimal ${MAX_HOLDS} transaksi dapat ditahan`,
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                    background: '#ffffff',
                    iconColor: '#6b7280',
                    customClass: {
                      popup: 'rounded-xl shadow-lg',
                      title: 'text-sm font-semibold text-gray-800',
                      timerProgressBar: 'bg-gray-500',
                    },
                  });
                  return;
                }
                
                handleHold();
                
                setTimeout(() => {
                  Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Transaksi Ditahan!',
                    text: `Pesanan berhasil disimpan${formData.diskon ? ' dengan diskon' : ''}`,
                    showConfirmButton: false,
                    timer: 2500,
                    timerProgressBar: true,
                    background: '#ffffff',
                    iconColor: '#10b981',
                    customClass: {
                      popup: 'rounded-xl shadow-lg',
                      title: 'text-sm font-semibold text-gray-800',
                      timerProgressBar: 'bg-black',
                    },
                  });
                }, 100);
              }}
              disabled={cart.length === 0}
              className={`relative flex items-center justify-center w-8 h-8 rounded-lg border transition-all active:scale-95 ${
                cart.length === 0
                  ? 'border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed'
                  : 'border-gray-200 bg-white hover:bg-black hover:border-black hover:text-white text-gray-500'
              }`}
            >
              <Hand className="w-4 h-4" />
            </button>

          <button
  onClick={() => setShowHoldModal(true)}
  disabled={holds.length === 0}
  title={holds.length === 0 ? "Tidak ada transaksi ditahan" : "Lihat transaksi ditahan"}
  className={`relative flex items-center justify-center w-8 h-8 rounded-lg border transition-all active:scale-95 ${
    holds.length === 0
      ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
      : "border-gray-200 bg-white hover:bg-black hover:border-black hover:text-white text-gray-500"
  }`}
>
  <ShoppingCart className="w-4 h-4" />
  {holds.length > 0 && (
    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center leading-none border border-white">
      {holds.length}
    </span>
  )}
</button>
          </div>
        </CardHeader>

        <CardContent className="p-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-500 text-sm">Keranjang masih kosong</p>
              </div>
            </div>
          ) : (
            <div
              className="space-y-2.5 overflow-y-auto"
              style={{ maxHeight: isDesktop ? 'calc(100vh - 280px)' : '440px', paddingRight: '2px' }}
            >
              {cart.map((item) => (
                <CartItemCard
                  key={item.kode_barang}
                  item={item}
                  updateQty={updateQty}
                  removeItem={removeItem}
                  handleChangeSatuan={handleChangeSatuan}
                  subtotal={subtotal}
                  getCurrentPrice={getCurrentPrice}
                  getSatuanInfo={getSatuanInfo}
                  transaksi={transaksi}
                  addProductToCart={addProductToCart}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const RingkasanColumn = (
    <div className={`flex flex-col gap-0 ${isTablet ? 'col-span-1' : 'col-span-2'}`}>
      <Card
        className={`border border-gray-200 bg-white rounded-xl shadow-sm flex flex-col ${isDesktop ? 'sticky top-6' : ''}`}
        style={{ maxHeight: isDesktop ? 'calc(100vh - 48px)' : undefined }}
      >
        <CardHeader className="pb-3 pt-4 px-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-900">Ringkasan</CardTitle>
            <div className="flex items-center gap-1.5">
              <LiveClock />
              <Button variant="ghost" size="sm" onClick={() => setRingkasanPosition('left')} disabled={ringkasanPosition === 'left'} className="h-7 w-7 p-0 rounded-lg">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setRingkasanPosition('right')} disabled={ringkasanPosition === 'right'} className="h-7 w-7 p-0 rounded-lg">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Subtotal ({cart.length} item)</span>
              <span className="font-semibold text-gray-900">Rp {cartSubtotal.toLocaleString()}</span>
            </div>
         {cart.length > 0 && parseRupiah(formData.diskon) > 0 && (
  <div className="flex justify-between items-center text-sm">
    <span className="text-gray-600">Diskon</span>
    <span className="text-red-500 font-medium">- {formatRupiah(parseRupiah(formData.diskon))}</span>
  </div>
)}
            <Separator className="bg-gray-300" />
            <div className="flex justify-between items-baseline">
              <span className="font-bold text-gray-900 text-base">TOTAL</span>
              <span className="font-black text-gray-900 text-2xl">Rp {total.toLocaleString()}</span>
            </div>
            <p className="text-[11px] text-gray-500 text-center pt-1">
              Harga akan otomatis terpotong jika ada diskon.
            </p>
          </div>
        </div>

        <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-gray-200 bg-white rounded-b-xl">
          <Button
            onClick={handleOpenPaymentModal}
            disabled={cart.length === 0 || isProcessing}
            className="w-full h-12 text-base font-bold text-white rounded-xl border-0 bg-black hover:bg-gray-800 transition-all disabled:opacity-40"
            size="lg"
          >
            <span className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Simpan Transaksi
            </span>
          </Button>
          {cart.length === 0 && (
            <p className="mt-2 text-center text-gray-400 text-xs">
              Tambahkan produk untuk melanjutkan
            </p>
          )}
        </div>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 p-3 md:p-4 lg:p-6">
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={handleModalClose}
        onOk={handleModalOk}
        onCetak={handleModalCetak}
        total={total}
        cartSubtotal={cartSubtotal}
        cartLength={cart.length}
        formData={formData}
        handleTotalUangChange={handleTotalUangChange}
        handleQuickAmount={handleQuickAmount}
        handleDiskonChange={handleDiskonChange}
        paymentStatus={paymentStatus}
        formatRupiah={formatRupiah}
        parseRupiah={parseRupiah}
        isProcessing={isProcessing}
      />

      <HoldModal
        isOpen={showHoldModal}
        onClose={() => setShowHoldModal(false)}
        holds={holds}
        onHold={handleHold}
        onRestore={handleRestoreWithDiskon}
        onDelete={handleDeleteHold}
        cartLength={cart.length}
        MAX_HOLDS={MAX_HOLDS}
      />
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-gray-700">Kasir POS</span>
          </div>
          <span className="text-gray-400">·</span>
          <span className="text-xs text-gray-500">{cart.length} item di keranjang</span>
          {holds.length > 0 && (
            <>
              <span className="text-gray-400">·</span>
            </>
          )}
        </div>

        <div className={`grid gap-4 ${isTablet ? 'grid-cols-4' : 'grid-cols-5'}`}>
          {ringkasanPosition === 'right'
            ? <>{CartColumn}{RingkasanColumn}</>
            : <>{RingkasanColumn}{CartColumn}</>}
        </div>
      </div>
    </div>
  )
}