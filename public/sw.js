const CACHE = 'mapaconvivencia-v1'
const ASSETS = [
  '/MapaConvivencia/',
  '/MapaConvivencia/index.html',
  '/MapaConvivencia/manifest.json',
  '/MapaConvivencia/favicon.svg',
  '/MapaConvivencia/favicon-96x96.png',
  '/MapaConvivencia/favicon.ico',
  '/MapaConvivencia/apple-touch-icon.png',
  '/MapaConvivencia/icon-192.png',
  '/MapaConvivencia/icon-512.png',
  '/MapaConvivencia/logo.png',
  '/MapaConvivencia/logoCuadrado.png',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  )
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)
  if (url.origin !== location.origin) return
  if (url.pathname.startsWith('/MapaConvivencia/assets/')) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        const clone = res.clone()
        caches.open(CACHE).then(c => c.put(e.request, clone))
        return res
      }))
    )
  }
})
