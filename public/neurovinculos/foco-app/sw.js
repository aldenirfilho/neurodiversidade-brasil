'use strict';
const CACHE='foco-app-shell-v0.1.1';
const SHELL=['./index.html','./app.css','./model.js','./app.js','./manifest.webmanifest','./icon.svg','../foco-claro/motor.js','../foco-claro/dados.js'];
const allowed=new Set(SHELL.map(path=>new URL(path,self.location.href).href));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll([...allowed]))));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('foco-app-shell-')&&key!==CACHE).map(key=>caches.delete(key)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);if(url.origin!==self.location.origin||url.search)return;
  const isShell=allowed.has(url.href);const isRoot=url.href===new URL('./',self.location.href).href;
  if(!isShell&&!isRoot)return;
  const key=isRoot?new URL('./index.html',self.location.href).href:url.href;
  event.respondWith(fetch(event.request).catch(()=>caches.match(key).then(response=>response||new Response('A interface ainda não está disponível offline.',{status:503,headers:{'content-type':'text/plain; charset=utf-8'}}))));
});
