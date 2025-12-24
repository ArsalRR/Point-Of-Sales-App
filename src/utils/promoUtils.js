/**
 * Mencari semua promo untuk kode barang tertentu
 */
export const findAllPromos = (hargaPromo, kodeBarang) => {
  if (!Array.isArray(hargaPromo) || !kodeBarang) return []
  
  const normalizedKode = kodeBarang.trim().toLowerCase()
  
  return hargaPromo.filter(p => {
    const promoKode = p?.kode_barang || p?.produk?.kode_barang
    return promoKode?.toString().trim().toLowerCase() === normalizedKode
  })
}

/**
 * Menghitung total diskon dari promo untuk cart dengan logika:
 * 1. Untuk produk YANG SAMA: jika qty ≥ min_qty, dapat diskon
 * 2. Untuk produk BERBEDA dengan kat_promo SAMA: qty dijumlahkan, jika total ≥ min_qty, dapat diskon
 * 3. Hanya ambil diskon terbesar jika ada konflik
 */
export const calculatePromoDiscount = (cart, hargaPromo) => {
  if (!Array.isArray(hargaPromo) || hargaPromo.length === 0 || !Array.isArray(cart) || cart.length === 0) {
    return 0
  }

  // 1. Buat struktur data untuk mapping
  const promoMap = {}
  const katPromoMap = {}
  
  hargaPromo.forEach(promo => {
    const kodeBarang = promo.kode_barang || promo?.produk?.kode_barang
    if (!kodeBarang) return
    
    const katPromo = promo.kat_promo || 'default'
    const key = `${katPromo}_${promo.potongan_harga}_${promo.min_qty}`
    
    // Tambah ke promoMap
    if (!promoMap[kodeBarang]) {
      promoMap[kodeBarang] = []
    }
    promoMap[kodeBarang].push({
      ...promo,
      katPromo,
      key
    })
    
    // Inisialisasi katPromoMap
    if (!katPromoMap[key]) {
      katPromoMap[key] = {
        kat_promo: katPromo,
        potongan_harga: promo.potongan_harga,
        min_qty: promo.min_qty,
        total_qty: 0,
        individual_discounts: []
      }
    }
  })

  // 2. Proses cart items
  cart.forEach(item => {
    const promos = promoMap[item.kode_barang] || []
    
    promos.forEach(promo => {
      const key = promo.key
      
      // A. PRODUK SAMA: Cek jika qty item memenuhi min_qty sendiri
      if (item.jumlah >= promo.min_qty) {
        const multiplier = Math.floor(item.jumlah / promo.min_qty)
        const individualDiscount = promo.potongan_harga * multiplier
        katPromoMap[key].individual_discounts.push(individualDiscount)
      }
      
      // B. TAMBAH ke total_qty untuk produk berbeda (kat_promo sama)
      katPromoMap[key].total_qty += item.jumlah
    })
  })

  // 3. Hitung diskon untuk setiap kat_promo group
  let totalDiskon = 0
  
  Object.values(katPromoMap).forEach(group => {
    if (group.total_qty === 0) return
    
    const discounts = []
    
    // A. Diskon dari INDIVIDUAL produk (produk sama)
    if (group.individual_discounts.length > 0) {
      const maxIndividual = Math.max(...group.individual_discounts)
      discounts.push(maxIndividual)
    }
    
    // B. Diskon dari PRODUK BERBEDA (qty digabung)
    if (group.total_qty >= group.min_qty) {
      const multiplier = Math.floor(group.total_qty / group.min_qty)
      const combinedDiscount = group.potongan_harga * multiplier
      discounts.push(combinedDiscount)
    }
    
    // C. Ambil diskon TERBESAR dari kedua tipe
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
  if (!Array.isArray(hargaPromo) || hargaPromo.length === 0 || !Array.isArray(cart) || cart.length === 0) {
    return 0
  }

  // Kelompokkan promo berdasarkan kat_promo + potongan + min_qty
  const promoGroups = {}
  
  // 1. Inisialisasi grup promo
  hargaPromo.forEach(promo => {
    const key = `${promo.kat_promo || 'default'}_${promo.potongan_harga}_${promo.min_qty}`
    
    if (!promoGroups[key]) {
      promoGroups[key] = {
        potongan_harga: promo.potongan_harga,
        min_qty: promo.min_qty,
        total_qty: 0,
        kode_barangs: new Set()
      }
    }
  })

  // 2. Proses cart items
  const itemMap = {}
  cart.forEach(item => {
    itemMap[item.kode_barang] = item
  })
  
  hargaPromo.forEach(promo => {
    const kodeBarang = promo.kode_barang || promo?.produk?.kode_barang
    if (!kodeBarang || !itemMap[kodeBarang]) return
    
    const key = `${promo.kat_promo || 'default'}_${promo.potongan_harga}_${promo.min_qty}`
    const group = promoGroups[key]
    const item = itemMap[kodeBarang]
    
    if (group) {
      group.total_qty += item.jumlah
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