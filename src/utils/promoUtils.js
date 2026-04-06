/**
 * Helper: parse angka dari string/number
 */
const toNumber = (val) => {
  const num = Number(val)
  return isNaN(num) ? 0 : num
}

/**
 * Tentukan tipe_harga item berdasarkan satuan_terpilih
 * Cocok dengan logika getCurrentPrice
 */
const getTipeHargaItem = (item) => {
  const rentengSatuanTypes = ['renteng', 'dus', 'pack', 'lusin', 'penjual_gas', 'dingin']
  const satuan = (item.satuan_terpilih || 'satuan').toLowerCase()
  return rentengSatuanTypes.includes(satuan) ? 'harga_renteng' : 'harga'
}

/**
 * Mencari semua promo untuk kode barang tertentu
 */
export const findAllPromos = (hargaPromo, kodeBarang) => {
  if (!Array.isArray(hargaPromo) || !kodeBarang) return []

  const normalizedKode = kodeBarang.toString().trim().toLowerCase()

  return hargaPromo.filter(p => {
    const promoKode = p?.kode_barang || p?.produk?.kode_barang
    return promoKode?.toString().trim().toLowerCase() === normalizedKode
  })
}
export const calculatePromoDiscount = (cart, hargaPromo) => {
  if (
    !Array.isArray(hargaPromo) || hargaPromo.length === 0 ||
    !Array.isArray(cart) || cart.length === 0
  ) return 0

  const promoMap    = {}
  const katPromoMap = {}

  // 1. Build promoMap & katPromoMap
  hargaPromo.forEach(promo => {
    const kodeBarang = promo.kode_barang || promo?.produk?.kode_barang
    if (!kodeBarang) return

    const katPromo  = promo.kat_promo  || 'default'
    const tipeHarga = promo.tipe_harga || 'harga'
    const potongan  = toNumber(promo.potongan_harga)
    const minQty    = toNumber(promo.min_qty)
    const key       = `${katPromo}_${potongan}_${minQty}_${tipeHarga}`

    if (!promoMap[kodeBarang]) promoMap[kodeBarang] = []
    promoMap[kodeBarang].push({ ...promo, katPromo, tipeHarga, potongan, minQty, key })

    if (!katPromoMap[key]) {
      katPromoMap[key] = {
        kat_promo     : katPromo,
        potongan_harga: potongan,
        min_qty       : minQty,
        tipe_harga    : tipeHarga,
        total_qty     : 0,
        individual_discounts: []
      }
    }
  })

  // 2. Proses cart items
  cart.forEach(item => {
    const promos        = promoMap[item.kode_barang] || []
    const tipeHargaItem = getTipeHargaItem(item) // ← dari satuan_terpilih
    const jumlah        = toNumber(item.jumlah)

    promos.forEach(promo => {
      // Hanya proses promo yang tipe_harga-nya cocok dengan satuan item
      if (promo.tipeHarga !== tipeHargaItem) return

      const { key, potongan, minQty } = promo

      // A. PRODUK SAMA: qty item memenuhi min_qty sendiri
      if (jumlah >= minQty) {
        const multiplier = Math.floor(jumlah / minQty)
        katPromoMap[key].individual_discounts.push(potongan * multiplier)
      }

      // B. Akumulasi qty untuk grup kat_promo
      katPromoMap[key].total_qty += jumlah
    })
  })

  // 3. Hitung diskon
  let totalDiskon = 0

  Object.values(katPromoMap).forEach(group => {
    if (group.total_qty === 0) return

    const discounts = []

    // A. Diskon individual terbesar
    if (group.individual_discounts.length > 0) {
      discounts.push(Math.max(...group.individual_discounts))
    }

    // B. Diskon gabungan (produk berbeda, kat_promo sama)
    if (group.total_qty >= group.min_qty) {
      const multiplier = Math.floor(group.total_qty / group.min_qty)
      discounts.push(group.potongan_harga * multiplier)
    }

    // C. Ambil terbesar
    if (discounts.length > 0) {
      totalDiskon += Math.max(...discounts)
    }
  })

  return totalDiskon
}

/**
 * Versi sederhana untuk performance (tanpa individual discount tracking)
 */
export const calculatePromoDiscountSimple = (cart, hargaPromo) => {
  if (
    !Array.isArray(hargaPromo) || hargaPromo.length === 0 ||
    !Array.isArray(cart) || cart.length === 0
  ) return 0

  const promoGroups = {}

  // 1. Inisialisasi grup promo
  hargaPromo.forEach(promo => {
    const tipeHarga = promo.tipe_harga || 'harga'
    const potongan  = toNumber(promo.potongan_harga)
    const minQty    = toNumber(promo.min_qty)
    const key       = `${promo.kat_promo || 'default'}_${potongan}_${minQty}_${tipeHarga}`

    if (!promoGroups[key]) {
      promoGroups[key] = {
        potongan_harga: potongan,
        min_qty       : minQty,
        tipe_harga    : tipeHarga,
        total_qty     : 0,
        kode_barangs  : new Set()
      }
    }
  })

  // 2. Buat itemMap lalu akumulasi qty per grup
  const itemMap = {}
  cart.forEach(item => {
    itemMap[item.kode_barang] = item
  })

  hargaPromo.forEach(promo => {
    const kodeBarang     = promo.kode_barang || promo?.produk?.kode_barang
    if (!kodeBarang || !itemMap[kodeBarang]) return

    const item           = itemMap[kodeBarang]
    const tipeHargaPromo = promo.tipe_harga || 'harga'
    const tipeHargaItem  = getTipeHargaItem(item) // ← dari satuan_terpilih

    if (tipeHargaPromo !== tipeHargaItem) return

    const potongan = toNumber(promo.potongan_harga)
    const minQty   = toNumber(promo.min_qty)
    const key      = `${promo.kat_promo || 'default'}_${potongan}_${minQty}_${tipeHargaPromo}`
    const group    = promoGroups[key]

    if (group) {
      group.total_qty += toNumber(item.jumlah)
      group.kode_barangs.add(kodeBarang)
    }
  })

  // 3. Hitung diskon
  let totalDiskon = 0

  Object.values(promoGroups).forEach(group => {
    if (group.total_qty >= group.min_qty) {
      const multiplier = Math.floor(group.total_qty / group.min_qty)
      totalDiskon += group.potongan_harga * multiplier
    }
  })

  return totalDiskon
}