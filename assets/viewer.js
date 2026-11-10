(function(){
 'use strict';
 const slides=[...document.querySelectorAll('#deck > [data-viewer-page]')];
 const previous=document.getElementById('previous'),next=document.getElementById('next');
 let index=0;
 function resize(){const main=document.querySelector('main');document.documentElement.style.setProperty('--viewer-scale',Math.min(main.clientWidth/1920,main.clientHeight/1080));}
 function show(n){
  index=Math.max(0,Math.min(slides.length-1,n));
  slides.forEach((s,i)=>{s.hidden=i!==index;s.classList.toggle('active',i===index);s.toggleAttribute('data-deck-active',i===index);s.setAttribute('aria-hidden',i===index?'false':'true');});
  previous.disabled=index===0;next.disabled=index===slides.length-1;
  document.getElementById('viewer-counter').textContent=`${index+1} / ${slides.length}`;
  const url=new URL(location.href);url.searchParams.set('page',String(index+1));history.replaceState(null,'',url);
  document.title=`Musein — ${index+1} / ${slides.length}`;
  dispatchEvent(new CustomEvent('swiss-slide-change'));
 }
 previous.onclick=()=>show(index-1);next.onclick=()=>show(index+1);
 document.getElementById('fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.().catch(()=>{});};
 addEventListener('keydown',e=>{if(e.target.closest('video,button'))return;if(['ArrowRight','ArrowDown',' ','PageDown'].includes(e.key)){e.preventDefault();show(index+1);}if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();show(index-1);}if(e.key==='Home')show(0);if(e.key==='End')show(slides.length-1);});
 let touch=null;
 document.querySelector('main').addEventListener('touchstart',e=>{if(e.target.closest('video'))return;touch={x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY};},{passive:true});
 document.querySelector('main').addEventListener('touchend',e=>{if(!touch)return;const dx=e.changedTouches[0].clientX-touch.x,dy=e.changedTouches[0].clientY-touch.y;touch=null;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)show(index+(dx<0?1:-1));},{passive:true});
 addEventListener('resize',resize);resize();show((Number(new URLSearchParams(location.search).get('page'))||1)-1);
 window.__museinViewer={show,get index(){return index;},slides};
})();
