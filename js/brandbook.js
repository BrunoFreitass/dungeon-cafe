/* Brandbook: menu hambúrguer e ajuste/zoom das pranchas (antes inline no brandbook.html;
   movido para cá para o CSP não precisar de 'unsafe-inline' em script-src). */
/* Menu hambúrguer: mesmo comportamento do js/main.js da home (o main.js inteiro não é
   carregado aqui porque procura o login e a janela dos cafés, que só existem na home). */
(()=>{const t=document.querySelector('.nav-toggle'),n=document.getElementById('menu');if(!t||!n)return;
const set=o=>{t.setAttribute('aria-expanded',String(o));t.querySelector('.sr-only').textContent=o?'Fechar menu':'Abrir menu';n.classList.toggle('is-open',o);};
t.addEventListener('click',()=>set(t.getAttribute('aria-expanded')!=='true'));
n.addEventListener('click',e=>{if(e.target.closest('a'))set(false);});
document.addEventListener('keydown',e=>{if(e.key==='Escape')set(false);});})();
(()=>{const f=[...document.querySelectorAll('.prancha--html')];
const fit=()=>f.forEach(e=>e.style.setProperty('--s',e.clientWidth/1123));
fit();if('ResizeObserver'in window){const r=new ResizeObserver(fit);f.forEach(e=>r.observe(e));}else addEventListener('resize',fit);
const d=document.querySelector('.zoom');if(!d||!d.showModal)return;
const box=d.querySelector('.zoom__box');
d.querySelector('button').addEventListener('click',()=>d.close());
d.addEventListener('close',()=>{box.innerHTML='';});
f.forEach(e=>e.addEventListener('click',()=>{
  if(innerWidth>760)return;
  const z=Math.max(0.7,innerWidth/1123),pg=e.querySelector('.pg').cloneNode(true);
  pg.style.transform='scale('+z+')';pg.querySelectorAll('img').forEach(i=>i.removeAttribute('loading'));
  box.style.width=1123*z+'px';box.style.height=794*z+'px';box.replaceChildren(pg);
  d.setAttribute('aria-label',e.getAttribute('aria-label')+' (ampliada)');d.showModal();
  d.querySelector('.zoom__area').scrollTo(0,0);}));
})();
