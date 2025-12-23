// ===== CONSTANTS =====
export const SATUAN_TYPES = {
  SATUAN: 'satuan',
  RENTENG: 'renteng',
  DUS: 'dus',
  PACK: 'pack',
  GROSIR: 'grosir'
}

export const PAYMENT_STATUS = {
  EMPTY: 'empty',
  INSUFFICIENT: 'insufficient',
  OVERPAID: 'overpaid',
  EXACT: 'exact'
}

export const BARCODE_CONFIG = {
  MIN_LENGTH: 3,
  SCAN_TIMEOUT: 50,
  FOCUS_DELAY: 100
}

export const TOAST_CONFIG = {
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timerProgressBar: true
}

export const EXCLUDED_INPUT_IDS = ['total_uang', 'kembalian']
export const SEARCH_MAX_RESULTS = 8
export const SEARCH_CLEAR_DELAY = 150

// ===== UTILITY FUNCTIONS =====

/**
 * Mengonversi string format Rupiah ke angka
 * @param {string|number} value - Nilai yang akan diparsing
 * @returns {number} Angka hasil parsing
 */
export const parseRupiah = (value) => {
  if (!value && value !== 0) return 0
  const numberString = value.toString().replace(/[^\d]/g, "")
  return numberString === "" ? 0 : parseInt(numberString, 10)
}

/**
 * Memformat angka ke format Rupiah
 * @param {number} value - Angka yang akan diformat
 * @returns {string} String format Rupiah
 */
export const formatRupiah = (value) => {
  if (!value && value !== 0) return ""
  const number = typeof value === 'string' ? parseRupiah(value) : value
  if (number < 0) return ""
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number)
}

/**
 * Mendapatkan harga berdasarkan satuan yang dipilih
 * @param {Object} item - Item produk
 * @returns {number} Harga saat ini
 */
export const getCurrentPrice = (item) => {
  const satuan = item.satuan_terpilih || SATUAN_TYPES.SATUAN
  const priceMap = {
    [SATUAN_TYPES.RENTENG]: item.harga_renteng,
    [SATUAN_TYPES.DUS]: item.harga_dus,
    [SATUAN_TYPES.PACK]: item.harga_pack,
    [SATUAN_TYPES.GROSIR]: item.harga_grosir,
  }
  return priceMap[satuan] || item.harga
}

/**
 * Mendapatkan informasi satuan untuk ditampilkan
 * @param {Object} item - Item produk
 * @returns {string} Informasi satuan
 */
export const getSatuanInfo = (item) => {
  const satuan = item.satuan_terpilih || SATUAN_TYPES.SATUAN
  const basePrice = item.harga

  if (satuan === SATUAN_TYPES.SATUAN || !basePrice || basePrice === 0) return ""

  const infoMap = {
    [SATUAN_TYPES.RENTENG]: item.jumlah_lainnya ? `1 renteng = ${item.jumlah_lainnya} pcs` : "Harga renteng",
    [SATUAN_TYPES.DUS]: item.jumlah_lainnya ? `1 dus = ${item.jumlah_lainnya} pcs` : "Harga dus",
    [SATUAN_TYPES.PACK]: item.jumlah_lainnya ? `1 pack = ${item.jumlah_lainnya} pcs` : "Harga pack",
    [SATUAN_TYPES.GROSIR]: "Harga grosir",
  }
  return infoMap[satuan] || ""
}