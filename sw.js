/* Rend l'application utilisable sans réseau une fois qu'elle a été ouverte une fois.
   À déposer à côté de index.html, à la racine de l'hébergement. */

var CACHE = "papiers-v1";

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){ return c.add("./"); })
      .catch(function(){})
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(noms){
      return Promise.all(noms.map(function(n){ return n===CACHE ? null : caches.delete(n); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET") return;

  /* La page elle-même : on essaie le réseau d'abord, pour qu'une nouvelle
     version mise en ligne soit prise en compte sans manipulation.
     Hors ligne, on sert la copie en cache. */
  if(e.request.mode === "navigate"){
    e.respondWith(
      fetch(e.request).then(function(res){
        var copie = res.clone();
        caches.open(CACHE).then(function(c){ c.put("./", copie); }).catch(function(){});
        return res;
      }).catch(function(){
        return caches.match("./").then(function(r){ return r || caches.match(e.request); });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function(rep){
      if(rep) return rep;
      return fetch(e.request).then(function(res){
        var copie = res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copie); }).catch(function(){});
        return res;
      }).catch(function(){ return caches.match("./"); });
    })
  );
});
