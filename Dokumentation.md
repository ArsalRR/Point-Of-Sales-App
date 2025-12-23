🗂️ DOKUMENTASI KODE KASIR
📁 STRUKTUR FILE
📄 src/utils/kasirUtils.js
javascript
// KONSTANTA
SATUAN_TYPES = { SATUAN, RENTENG, DUS, PACK, GROSIR }
PAYMENT_STATUS = { EMPTY, INSUFFICIENT, OVERPAID, EXACT }
BARCODE_CONFIG = { MIN_LENGTH: 3, SCAN_TIMEOUT: 50, FOCUS_DELAY: 100 }
TOAST_CONFIG = { toast: true, position: "top-end" }
EXCLUDED_INPUT_IDS = ['total_uang', 'kembalian']
SEARCH_MAX_RESULTS = 8
SEARCH_CLEAR_DELAY = 150

// FUNGSI UTAMA
parseRupiah(value)          // String → Number (Rp 10.000 → 10000)
formatRupiah(value)         // Number → String (10000 → "Rp 10.000")
getCurrentPrice(item)       // Ambil harga berdasarkan satuan
getSatuanInfo(item)         // Info konversi satuan (1 renteng = 10 pcs)
📄 src/utils/searchUtils.js
javascript
// FUNGSI PENCARIAN
calculateSimilarity(str1, str2)    // Hitung similarity 2 string (0-1)
calculateSearchScore(item, query, queryWords)  // Hitung skor pencarian
searchProducts(transaksi, query)   // Search + sort produk
📄 src/utils/promoUtils.js
javascript
// FUNGSI PROMO
findAllPromos(hargaPromo, kodeBarang)        // Cari semua promo untuk kode barang
calculatePromoDiscount(cart, hargaPromo)     // Hitung total diskon promo
📄 src/hooks/useKasir.js
javascript
// STATE PRIMER
transaksi[]         // Data produk dari API
formData{}          // { diskon, total_uang, kembalian }
searchQuery         // Query pencarian
showSearchResults   // Tampilkan hasil search
cart[]              // Keranjang belanja
isProcessing        // Status proses transaksi
showPrint           // Tampilkan nota
printData{}         // Data untuk nota
user{}              // Data user login
hargaPromo[]        // Data promo dari API

// COMPUTED VALUES
searchResults[]     // Hasil pencarian (memoized)
cartSubtotal        // Total cart sebelum diskon
total               // Total setelah diskon
paymentStatus{}     // Status pembayaran {status, message, difference}

// REFS
searchInputRef      // Ref input search
barcodeBufferRef    // Buffer barcode scanner
lastKeyTimeRef      // Waktu terakhir keypress
transaksiRef        // Ref untuk transaksi

// API FUNCTIONS
fetchUser()         // Ambil data user
fetchHargaPromo()   // Ambil data promo
fetchTransaksi()    // Ambil data produk

// CART OPERATIONS
addProductToCart(product)       // Tambah produk ke cart
updateQty(kode_barang, newQty)  // Update quantity
removeItem(kode)                // Hapus item dari cart
subtotal(item)                  // Hitung subtotal per item
handleChangeSatuan(kode_barang, satuan) // Ganti satuan

// FORM HANDLERS
handleDiskonChange(e)           // Handler input diskon
handleTotalUangChange(e)        // Handler input total uang

// SEARCH HANDLERS
handleSearchSelect(product)     // Pilih hasil pencarian

// BARCODE SCANNER
handleBarcodeFound(barcode)     // Handler barcode terdeteksi
showBarcodeNotFoundAlert(barcode) // Alert barcode tidak ditemukan
focusSearchInput(ref, delay)    // Fokus ke input search

// TRANSACTION
postTransaksi(data)             // POST transaksi ke API
handleSubmit(e)                 // Submit form transaksi

// UTILITIES
showToast(title, text, icon, timer) // Tampilkan notifikasi

// EFFECTS
useEffect(fetchHargaPromo, [])                // Load promo awal
useEffect(transaksiRef=transaksi, [transaksi]) // Sync ref
useEffect(checkAndApplyPromo, [promoLoaded])   // Apply promo
useEffect(barcodeScannerLogic, [searchQuery])  // Barcode scanner
useEffect(cleanupSearchQuery, [searchResults]) // Clear search kosong
📄 src/components/Kasir/ListKasir.jsx
javascript
// KOMPONEN UTAMA
ListKasir()                     // Komponen utama kasir

// SUB-KOMPONEN
HeaderSection()                 // Header "Kasir Toko IFA"
SearchSection()                 // Section pencarian produk
SearchResultItem()              // Item hasil pencarian
CartSection()                   // Section keranjang
EmptyCartState()                // State cart kosong
CartItem()                      // Item dalam cart
SatuanSelector()                // Dropdown pilih satuan
QuantityControls()              // Kontrol +- quantity
SubtotalDisplay()               // Display subtotal item
OrderSummarySection()           // Ringkasan pesanan
FormInput()                     // Input form generik
KembalianDisplay()              // Display kembalian
PaymentStatusMessage()          // Pesan status pembayaran
SubmitButton()                  // Tombol proses transaksi

// PROPS MAPING
SearchSection:
  - searchQuery, setSearchQuery
  - showSearchResults, setShowSearchResults  
  - searchResults, searchInputRef
  - handleSearchSelect, transaksi

CartSection:
  - cart, removeItem, getCurrentPrice
  - updateQty, subtotal, handleChangeSatuan
  - getSatuanInfo

OrderSummarySection:
  - cart, cartSubtotal, formData
  - handleDiskonChange, handleTotalUangChange
  - total, paymentStatus, isProcessing
  - handleSubmit, formatRupiah
📄 src/api/
javascript
// API ENDPOINTS
Kasirapi.js:
  - postKasir(data)      // POST: /api/transaksi
  - getTransaksi()       // GET: /api/produk

Userapi.js:
  - getProfile()         // GET: /api/user/profile

HargaPromoapi.js:
  - getHargaPromo()      // GET: /api/promo
📄 src/components/Kasir/NotaPembelian.jsx
javascript
// PROPS
transactionData{
  no_transaksi      // Nomor transaksi
  items[]           // Array item: {nama_barang, harga, jumlah, satuan}
  subtotal          // Subtotal
  diskon            // Diskon
  total             // Total akhir
  total_uang        // Uang dibayar
  kembalian         // Kembalian
}
onClose()           // Callback tutup nota
🔗 DATA FLOW
🔄 ALIRAN DATA TRANSAKSI
text
1. User Input
   ↓
2. Barcode Scanner / Search
   ↓
3. addProductToCart() → cart[]
   ↓
4. cartSubtotal (computed)
   ↓
5. checkAndApplyPromo() → formData.diskon
   ↓
6. total (computed: cartSubtotal - diskon)
   ↓
7. Input total_uang → kembalian (computed)
   ↓
8. handleSubmit() → postTransaksi()
   ↓
9. API Response → printData
   ↓
10. NotaPembelian Component
🔍 ALIRAN PENCARIAN
text
1. Keyboard Input → searchQuery
   ↓
2. searchProducts() → searchResults[]
   ↓
3. handleSearchSelect() → addProductToCart()
   ↓
4. Auto-clear jika tidak ada hasil
⚙️ KONFIGURASI
⚡ PERFORMANCE OPTIMIZATION
javascript
// MEMOIZATION
searchResults = useMemo(() => searchProducts(), [transaksi, searchQuery])
cartSubtotal = useMemo(() => calculate(), [cart])
total = useMemo(() => getTotalToBePaid(), [getTotalToBePaid])
paymentStatus = useMemo(() => getPaymentStatus(), [getPaymentStatus])

// CALLBACK OPTIMIZATION
Semua handler menggunakan useCallback dengan dependency array
🎯 BARCODE SCANNER LOGIC
javascript
// LOGIC DETECTION
1. Key press → barcodeBufferRef += key
2. Timeout 50ms → Jika length >= 3, process
3. handleBarcodeFound() → Cari produk → addToCart

// EXCLUSION RULES
- Skip jika di input/textarea (kecuali search)
- Skip jika di select component
- Skip excluded inputs (total_uang, kembalian)
🏷️ TIPE DATA
📦 PRODUK OBJECT
javascript
produk{
  kode_barang: string      // "BRG001"
  nama_barang: string      // "Indomie Goreng"
  harga: number           // 3500
  satuan: string          // "pcs"
  stok: number           // 100
  harga_renteng?: number  // 30000
  harga_dus?: number      // 300000
  harga_pack?: number     // 15000
  harga_grosir?: number   // 2800
  jumlah_lainnya?: number // 10 (1 renteng = 10 pcs)
}
🛒 CART ITEM OBJECT
javascript
cartItem{
  ...produk               // Semua properti produk
  jumlah: number         // Quantity
  satuan_terpilih: string // Satuan yang dipilih
}
🧾 TRANSACTION DATA
javascript
transactionData{
  no_transaksi: string
  items: array[
    {
      nama_barang: string
      harga: number
      jumlah: number
      satuan: string
    }
  ]
  subtotal: number
  diskon: number
  total: number
  total_uang: number
  kembalian: number
}
🚨 ERROR HANDLING
🔴 ERROR CODES
javascript
// TOAST MESSAGES
"User belum terdeteksi"           // User tidak ditemukan
"Keranjang masih kosong"          // Cart empty
"Terjadi kesalahan saat memproses transaksi" // API error
"Kode Barcode Tidak Ditemukan"    // Barcode tidak ada
🟡 VALIDASI INPUT
javascript
// DISKON: Max = cartSubtotal
// QUANTITY: Min = 1
// BARCODE: Min length = 3
// SEARCH: Auto-clear jika no results
🔄 DEPENDENCY MAP
📦 useKasir.js DEPENDENCIES
javascript
IMPORTS:
- useState, useEffect, useRef, useCallback, useMemo
- postKasir, getTransaksi (Kasirapi)
- getProfile (Userapi)
- getHargaPromo (HargaPromoapi)
- Swal (sweetalert2)
- parseRupiah, formatRupiah, getCurrentPrice, getSatuanInfo
- SATUAN_TYPES, PAYMENT_STATUS, BARCODE_CONFIG
- EXCLUDED_INPUT_IDS, SEARCH_CLEAR_DELAY, TOAST_CONFIG
- searchProducts (searchUtils)
- calculatePromoDiscount (promoUtils)

EXPORTS:
- Semua state, functions, refs ke ListKasir.jsx
🎨 ListKasir.jsx DEPENDENCIES
javascript
IMPORTS:
- useKasir (hook)
- parseRupiah (utils)
- UI Components (Shadcn)
- Icons (lucide-react)
- NotaPembelian (component)

EXPORTS:
- Default component ListKasir
📝 CATATAN TEKNIS
💾 LOCAL STORAGE
javascript
// Tidak digunakan - state managed in-memory
// Reset on: page refresh, transaction complete
🔄 STATE RESET
javascript
// Setelah transaksi sukses:
cart = []
formData = { diskon: '', total_uang: '', kembalian: 0 }
searchQuery = ''
showPrint = true
printData = transactionData
🎯 FOCUS MANAGEMENT
javascript
// Auto-focus ke search input:
1. Setelah transaksi selesai
2. Setelah barcode tidak ditemukan
3. Setelah clear search query
4. On component mount