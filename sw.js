/* Service worker — coquille en cache, saisie hors ligne.
   Le nom du cache porte l'EMPREINTE de la page : il change à chaque modification de
   l'application, ce qui suffit à faire prendre la mise à jour sur un téléphone déjà équipé.
   Les appels d'API ne sont JAMAIS mis en cache — un dépôt servi depuis le cache donnerait un
   faux succès, et le relevé serait cru transmis. */
var CACHE='aqs-releve-1.1-fb4dfafe';
var COQUILLE=['index.html','manifest.webmanifest','icone-192.png','icone-512.png'];

self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){
    return c.addAll(COQUILLE);
  }).then(function(){return self.skipWaiting();}));
});

self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.map(function(k){
      if(k!==CACHE) return caches.delete(k);
    }));
  }).then(function(){return self.clients.claim();}));
});

self.addEventListener('fetch',function(e){
  var u=new URL(e.request.url);
  if(e.request.method!=='GET' || u.pathname.indexOf('/api/')!==-1) return;
  e.respondWith(
    caches.match(e.request,{ignoreSearch:true}).then(function(r){
      return r || fetch(e.request).then(function(rep){
        if(rep.ok && rep.type==='basic'){
          var copie=rep.clone();
          caches.open(CACHE).then(function(c){c.put(e.request,copie);});
        }
        return rep;
      }).catch(function(){
        return caches.match('index.html');
      });
    })
  );
});
