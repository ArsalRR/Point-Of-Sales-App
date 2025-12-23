import { SEARCH_MAX_RESULTS } from './kasirUtils'

/**
 * Menghitung similarity (kesamaan) antara dua string
 * @param {string} str1 - String pertama
 * @param {string} str2 - String kedua
 * @returns {number} Skor similarity (0-1)
 */
export const calculateSimilarity = (str1, str2) => {
  const set1 = new Set(str1.split(''))
  const set2 = new Set(str2.split(''))
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])
  return intersection.size / union.size
}

/**
 * Menghitung skor pencarian untuk sorting
 * @param {Object} item - Item produk
 * @param {string} query - Query pencarian
 * @param {Array} queryWords - Array kata-kata dalam query
 * @returns {number} Skor pencarian
 */
export const calculateSearchScore = (item, query, queryWords) => {
  const namaBarang = item.nama_barang.toLowerCase()
  const kodeBarang = item.kode_barang.toLowerCase()
  let score = 0

  // Exact kode match
  if (kodeBarang === query) return 1000
  if (kodeBarang.startsWith(query)) score += 800
  if (kodeBarang.includes(query)) score += 600

  // Exact nama match
  if (namaBarang === query) score += 900
  if (namaBarang.startsWith(query)) score += 700

  // Multi-word matching
  const allWordsFound = queryWords.every(word => namaBarang.includes(word))
  if (allWordsFound) score += 500

  const foundWords = queryWords.filter(word => namaBarang.includes(word))
  score += (foundWords.length / queryWords.length) * 300

  if (namaBarang.includes(query)) score += 400

  // Phrase matching
  if (queryWords.length > 1) {
    const queryPhrase = queryWords.join(' ')
    if (namaBarang.includes(queryPhrase)) score += 200
  }

  // Fuzzy matching
  if (score === 0 && query.length >= 3) {
    const similarity = calculateSimilarity(query, namaBarang)
    if (similarity > 0.6) score += similarity * 100
  }

  return score
}

/**
 * Mencari produk berdasarkan query
 * @param {Array} transaksi - Array produk
 * @param {string} query - Query pencarian
 * @returns {Array} Hasil pencarian yang sudah disortir
 */
export const searchProducts = (transaksi, query) => {
  if (!query.trim() || !Array.isArray(transaksi)) return []

  const lowercaseQuery = query.toLowerCase().trim()
  const queryWords = lowercaseQuery.split(/\s+/).filter(word => word.length > 0)

  return transaksi
    .map(item => ({
      ...item,
      searchScore: calculateSearchScore(item, lowercaseQuery, queryWords)
    }))
    .filter(item => item.searchScore > 0)
    .sort((a, b) => {
      if (b.searchScore !== a.searchScore) return b.searchScore - a.searchScore
      if (a.nama_barang.length !== b.nama_barang.length) {
        return a.nama_barang.length - b.nama_barang.length
      }
      return a.nama_barang.localeCompare(b.nama_barang, 'id', { numeric: true })
    })
    .slice(0, SEARCH_MAX_RESULTS) // PAKAI KONSTANTA YANG SUDAH DIIMPOR
}