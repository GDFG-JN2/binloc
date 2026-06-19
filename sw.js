var CACHE = 'binloc-v4.3';
var ASSETS = [
  'index.html',
  'operator.html',
  'manifest.json'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return Promise.allSettled(ASSETS.map(function(url) {
        return c.add(url).catch(function(){});
      }));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'GET_VERSION') {
    e.ports[0].postMessage({ version: CACHE });
  }
});
  var url = e.request.url;
  if (url.includes('script.google.com') || url.includes('workers.dev') || url.includes('cdnjs')) {
    return;
  }
  // operator.html dan index.html selalu ambil dari network dulu
  if (url.includes('operator.html') || url.includes('index.html') || url.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then(function(resp) {
        var clone = resp.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
        return resp;
      }).catch(function() {
        return caches.match(url.includes('operator.html') ? 'operator.html' : 'index.html');
      })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(resp) {
        if (resp && resp.status === 200 && e.request.method === 'GET') {
          var clone = resp.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
        }
        return resp;
      });
    }).catch(function() {
      return caches.match('operator.html');
    })
  );
});
