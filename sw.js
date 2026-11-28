// Eleven Lab: funziona anche offline dopo la prima apertura
const CACHE='elevenlab-v85';
const APP='./app.202611280919.js';
const SHELL=['./','./index.html',APP,'./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET')return;
  // il codice dell'app ha la versione nel nome: si prende dalla cache (già compilato), la rete solo la prima volta
  if(u.origin===location.origin&&/\/app\.\d+\.js$/.test(u.pathname)){e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{const c=n.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return n})));return}
  // pagina: prima la rete (per ricevere gli aggiornamenti), poi la cache
  if(u.origin===location.origin){e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));return}
  // font e librerie (Google Fonts, cdnjs): prima la cache
  if(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/.test(u.host)){e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{const c=n.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return n})))}
});
// --- extra ---
// notifiche push dal servizio personale (Cloudflare Worker): la notifica arriva senza contenuto,
// il testo (generico, senza dati dei giocatori) si chiede al servizio
self.addEventListener('push',e=>{e.waitUntil((async()=>{let m={t:'Eleven Lab',b:'Apri l’app per i dettagli.'};
 try{const c=await caches.open('el-cfg');const r=await c.match('./el-cfg.json');const cfg=r?await r.json():null;const sub=await self.registration.pushManager.getSubscription();
  if(cfg?.url&&sub){const h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(sub.endpoint));const id=btoa(String.fromCharCode(...new Uint8Array(h))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'').slice(0,32);
   const x=await fetch(cfg.url.replace(/\/+$/,'')+'/push/msg?id='+id,{cache:'no-store'});if(x.ok)m=await x.json()}}catch(err){}
 await self.registration.showNotification(m.t||'Eleven Lab',{body:m.b||'',icon:'icon-192.png',badge:'icon-192.png',tag:'el-'+(m.t||'')})})())});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil((async()=>{const l=await clients.matchAll({type:'window',includeUncontrolled:true});for(const c of l){if('focus' in c)return c.focus()}return clients.openWindow('./')})())});
