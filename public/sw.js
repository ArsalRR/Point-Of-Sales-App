const CACHE_NAME = 'pos-cache-v2'

const CACHEABLE_EXTENSIONS = ['.js', '.css', '.png', '.jpg', '.svg', '.ico', '.woff2']

const isCacheable = (url) => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false
  try {
    const { pathname } = new URL(url)
    return CACHEABLE_EXTENSIONS.some(ext => pathname.endsWith(ext))
  } catch {
    return false
  }
}

self.addEventListener('install', event => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const req = event.request

  if (req.method !== 'GET') return

  if (!req.url.startsWith('http://') && !req.url.startsWith('https://')) return

  if (!isCacheable(req.url)) return

  event.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req)
        .then(networkRes => {
          if (networkRes && networkRes.ok) {
            const resClone = networkRes.clone()
            caches.open(CACHE_NAME).then(cache => {
              try {
                cache.put(req, resClone)
              } catch (err) {
                console.warn('[SW] Gagal cache:', req.url, err)
              }
            })
          }
          return networkRes
        })
        .catch(() => {
          if (cached) return cached
          return new Response('Offline — aset tidak tersedia', { status: 503 })
        })

      return cached || fetchPromise
    })
  )
})