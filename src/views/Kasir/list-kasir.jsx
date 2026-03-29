import { useState, useEffect } from 'react'
import { ShoppingCart, Scan, Trash2, Plus, Minus, CreditCard, Search, X, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import NotaPembelian from '../Kasir/NotaPembelian'
import { useKasir } from '@/hooks/useKasir'
import { parseRupiah } from '@/utils/kasirUtils'
import { useMediaQuery } from '@/hooks/useMediaQuery'

// ─── Quick amount pills ───────────────────────────────────────────────────────
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
          className="h-9 px-3 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 active:scale-95 text-sm font-medium text-gray-700 transition-all"
        >
          Rp {v.toLocaleString('id-ID')}
        </button>
      ))}
    </div>
  )
}

// ─── Clock ───────────────────────────────────────────────────────────────────
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
  return <span className="font-mono text-sm text-gray-500 tabular-nums">{time}</span>
}

// ─── Payment Status Card ──────────────────────────────────────────────────────
function PaymentStatus({ paymentStatus, formatRupiah }) {
  if (!paymentStatus || paymentStatus.status === 'empty') return null
  const cfg = {
    insufficient: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', label: 'Uang Kurang' },
    overpaid:     { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Kembalian' },
    exact:        { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'Uang Pas' },
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

// ─── Cart Item Card ───────────────────────────────────────────────────────────
function CartItemCard({
  item, isTablet,
  updateQty, removeItem, handleChangeSatuan,
  subtotal, getCurrentPrice, getSatuanInfo,
}) {
  const price = getCurrentPrice(item)
  const sub = subtotal(item)
  return (
    <Card className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <CardContent className="p-0">
        {/* Top row: name + delete */}
        <div className="flex items-start gap-2 px-4 pt-4 pb-2">
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-gray-900 truncate ${isTablet ? 'text-sm' : 'text-base'}`}>
              {item.nama_barang}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="outline" className="border-gray-300 text-gray-600 text-xs font-mono">
                {item.kode_barang}
              </Badge>
              <span className="text-xs text-gray-500">
                Rp {price.toLocaleString()} / {item.satuan_terpilih || item.satuan}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeItem(item.kode_barang)}
            className="h-9 w-9 p-0 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Divider */}
        <Separator className="bg-gray-100" />

        {/* Bottom row: satuan + qty + subtotal */}
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Satuan */}
          <Select
            value={item.satuan_terpilih || 'satuan'}
            onValueChange={(v) => handleChangeSatuan(item.kode_barang, v)}
          >
            <SelectTrigger className="h-10 text-sm rounded-lg border border-gray-200 bg-gray-50 min-w-[100px] flex-1 focus:border-gray-400 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg">
              <SelectItem value="satuan">Satuan</SelectItem>
              {item.harga_renteng && (
                <>
                  <SelectItem value="renteng">Renteng</SelectItem>
                  <SelectItem value="dus">Dus</SelectItem>
                  <SelectItem value="pack">Pack</SelectItem>
                  <SelectItem value="dingin">Minuman dingin</SelectItem>
                  <SelectItem value="penjual_gas">Penjual gas</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>

          {/* Qty Controls — large touch targets */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQty(item.kode_barang, item.jumlah - 1, e) }}
              className="h-10 w-10 p-0 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Input
              type="number"
              value={item.jumlah}
              onChange={(e) => updateQty(item.kode_barang, Math.max(1, Number(e.target.value) || 1), e)}
              onFocus={(e) => e.target.scrollIntoView({ behavior: 'instant', block: 'nearest' })}
              onBlur={(e) => { if (!e.target.value || parseInt(e.target.value) < 1) updateQty(item.kode_barang, 1, e) }}
              className="w-14 h-10 text-center border border-gray-300 rounded-lg font-semibold text-sm focus:border-gray-500 focus:ring-0"
              min="1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQty(item.kode_barang, item.jumlah + 1, e) }}
              className="h-10 w-10 p-0 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Subtotal */}
          <div className="text-right flex-shrink-0 min-w-[80px]">
            <p className="font-bold text-gray-900 text-sm">Rp {sub.toLocaleString()}</p>
            {item.satuan_terpilih && item.satuan_terpilih !== 'satuan' && (
              <p className="text-xs text-gray-500 truncate mt-0.5">{getSatuanInfo(item)}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
export default function ListKasir() {
  const kasir = useKasir()
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [ringkasanPosition, setRingkasanPosition] = useState('right')

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
  const SearchDropdown = showSearchResults && searchResults.length > 0 && (
    <Card className="absolute top-full left-0 right-0 z-50 mt-1.5 max-h-72 overflow-auto shadow-2xl border border-gray-200 rounded-xl">
      <CardContent className="p-0">
        {searchResults.map((product, index) => (
          <button
            key={product.kode_barang}
            onClick={() => {
              handleSearchSelect(product)
              setSearchQuery('')
              setShowSearchResults(false)
            }}
            className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${index === 0 ? 'bg-gray-50' : ''}`}
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{product.nama_barang}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xs text-gray-500">{product.kode_barang}</span>
                <span className="text-xs text-gray-500">· Rp {product.harga.toLocaleString()} / {product.satuan}</span>
              </div>
            </div>
            <Badge className="bg-gray-900 text-white text-xs font-semibold flex-shrink-0">
              {product.stok}
            </Badge>
          </button>
        ))}
      </CardContent>
    </Card>
  )
  const CartColumn = (
    <div className={`flex flex-col gap-4 ${isTablet ? 'col-span-3' : 'col-span-3'}`}>
      <Card className="border border-gray-200 bg-white rounded-xl shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
              <Scan className="w-4 h-4 text-white" />
            </div>
            <Label className="text-gray-900 font-semibold text-sm">Scan Barcode / Cari Produk</Label>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => {
                const value = e.target.value
                setSearchQuery(value)
                const exactProduct = transaksi.find((p) => p.kode_barang.trim() === value.trim())
                if (exactProduct && value.length >= 3) {
                  setTimeout(() => handleSearchSelect(exactProduct), 50)
                  return
                }
                setShowSearchResults(value.length > 0)
              }}
              onKeyDown={(e) => {
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
              }}
              onFocus={() => { if (searchQuery.length > 0) setShowSearchResults(true) }}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              placeholder="Scan barcode atau ketik nama produk..."
              className={`pl-9 pr-10 w-full border-2 border-gray-200 rounded-xl focus:border-gray-900 focus:ring-0 bg-gray-50 focus:bg-white transition-all ${isTablet ? 'h-12 text-sm' : 'h-12 text-sm'}`}
              autoComplete="off"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setShowSearchResults(false)
                  searchInputRef.current?.focus()
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            {SearchDropdown}
          </div>
        </CardContent>
      </Card>
      <Card className="border border-gray-200 bg-white rounded-xl shadow-sm flex-1">
        <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-sm font-semibold text-gray-900">Keranjang Belanja</CardTitle>
          </div>
          {cart.length > 0 && (
            <Badge className="bg-gray-100 text-gray-700 border border-gray-200 font-semibold text-xs px-2">
              {cart.length} item
            </Badge>
          )}
        </CardHeader>

        <CardContent className="p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-gray-300" />
              </div>
              <div>
                <p className="font-semibold text-gray-500 text-sm">Keranjang masih kosong</p>
                <p className="text-xs text-gray-400 mt-1">Scan barcode atau cari produk</p>
              </div>
            </div>
          ) : (
            <div
              className={`space-y-3 overflow-y-auto pr-1`}
              style={{ maxHeight: isDesktop ? 'calc(100vh - 280px)' : '420px' }}
            >
              {cart.map((item) => (
                <CartItemCard
                  key={item.kode_barang}
                  item={item}
                  isTablet={isTablet}
                  updateQty={updateQty}
                  removeItem={removeItem}
                  handleChangeSatuan={handleChangeSatuan}
                  subtotal={subtotal}
                  getCurrentPrice={getCurrentPrice}
                  getSatuanInfo={getSatuanInfo}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  // ─── Ringkasan Column ────────────────────────────────────────────────────
  const RingkasanColumn = (
    <div className={`flex flex-col gap-0 ${isTablet ? 'col-span-1' : 'col-span-2'}`}>
      <Card
        className={`border border-gray-200 bg-white rounded-xl shadow-sm flex flex-col ${isDesktop ? 'sticky top-6' : ''}`}
        style={{ maxHeight: isDesktop ? 'calc(100vh - 48px)' : undefined }}
      >
        {/* Header */}
        <CardHeader className="pb-3 pt-4 px-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-900">Ringkasan Pesanan</CardTitle>
            <div className="flex items-center gap-1.5">
              <LiveClock />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRingkasanPosition('left')}
                disabled={ringkasanPosition === 'left'}
                className="h-7 w-7 p-0 rounded-lg"
                title="Pindah ke kiri"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRingkasanPosition('right')}
                disabled={ringkasanPosition === 'right'}
                className="h-7 w-7 p-0 rounded-lg"
                title="Pindah ke kanan"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

          {/* Totals Summary */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Subtotal ({cart.length} item)</span>
              <span className="font-semibold text-gray-900">Rp {cartSubtotal.toLocaleString()}</span>
            </div>
            {formData.diskon && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Potongan</span>
                <span className="font-semibold text-red-600">
                  -{formatRupiah(parseRupiah(formData.diskon))}
                </span>
              </div>
            )}
            <Separator className="bg-gray-200" />
            <div className="flex justify-between items-baseline">
              <span className="font-bold text-gray-900 text-base">TOTAL</span>
              <span className="font-black text-gray-900 text-2xl">Rp {total.toLocaleString()}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Potongan Harga</Label>
             <Input
                id="diskon"
                type="text"
                name="diskon"
                value={formData.diskon}
                onChange={handleDiskonChange}
                placeholder="Contoh: 5000 atau 10%"
                className={`border-2 border-gray-300 focus:border-black focus:ring-2 focus:ring-black/20 ${isTablet ? 'h-10 text-sm rounded-lg' : 'h-12 text-base rounded-lg'}`}
                autoComplete="off"
              />
          </div>

          {/* Uang Input */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Uang Dibayar</Label>
             <Input
                id="total_uang"
                type="text"
                name="total_uang"
                value={formData.total_uang}
                onChange={handleTotalUangChange}
                placeholder="Masukkan jumlah uang"
                className={`border-2 border-gray-300 focus:border-black focus:ring-2 focus:ring-black/20 ${isTablet ? 'h-10 text-sm rounded-lg' : 'h-12 text-base rounded-lg'}`}
                autoComplete="off"
              />
            <QuickAmounts total={total} onSelect={handleQuickAmount} />
          </div>

          <PaymentStatus paymentStatus={paymentStatus} formatRupiah={formatRupiah} />
        </div>
        <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-gray-100 bg-white rounded-b-xl">
          <Button
            onClick={handleSubmit}
            disabled={cart.length === 0 || isProcessing}
            className="w-full h-12 text-base font-bold text-white rounded-xl border-0 bg-gray-900 hover:bg-black transition-all disabled:opacity-40"
            size="lg"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Memproses...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Simpan Transaksi
              </span>
            )}
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
    <div className="min-h-screen bg-gray-50 p-3 md:p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">

        {/* Top bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-gray-700">Kasir POS</span>
          </div>
          <span className="text-gray-300">·</span>
          <span className="text-xs text-gray-400">{cart.length} item di keranjang</span>
        </div>

        {/* Grid */}
        <div className={`grid gap-4 ${isTablet ? 'grid-cols-4' : 'grid-cols-5'}`}>
          {ringkasanPosition === 'right' ? (
            <>
              {CartColumn}
              {RingkasanColumn}
            </>
          ) : (
            <>
              {RingkasanColumn}
              {CartColumn}
            </>
          )}
        </div>
      </div>
    </div>
  )
}