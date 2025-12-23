/**
 * Mencari semua promo untuk kode barang tertentu
 * @param {Array} hargaPromo - Array data promo
 * @param {string} kodeBarang - Kode barang yang dicari
 * @returns {Array} Array promo yang sesuai
 */
export const findAllPromos = (hargaPromo, kodeBarang) => {
  if (!Array.isArray(hargaPromo) || !kodeBarang) return []
  
  const normalizedKode = kodeBarang.trim().toLowerCase()
  
  return hargaPromo.filter(p => 
    p?.produk?.kode_barang?.trim()?.toLowerCase() === normalizedKode ||
    p?.kode_barang?.trim()?.toLowerCase() === normalizedKode
  )
}

/**
 * Menghitung total diskon dari promo untuk cart
 * @param {Array} cart - Array item dalam cart
 * @param {Array} hargaPromo - Array data promo
 * @returns {number} Total diskon
 */
export const calculatePromoDiscount = (cart, hargaPromo) => {
  if (!Array.isArray(hargaPromo) || hargaPromo.length === 0) return 0

  return cart.reduce((totalDiskon, item) => {
    const promos = findAllPromos(hargaPromo, item.kode_barang)
    
    if (promos.length === 0) return totalDiskon
    let maxDiskon = 0
    
    promos.forEach(promo => {
      if (item.jumlah >= promo.min_qty) {
        const multiplier = Math.floor(item.jumlah / promo.min_qty)
        const diskonPromo = promo.potongan_harga * multiplier
        if (diskonPromo > maxDiskon) {
          maxDiskon = diskonPromo
        }
      }
    })

    return totalDiskon + maxDiskon
  }, 0)
}