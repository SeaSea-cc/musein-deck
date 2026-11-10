(function () {
  'use strict';
  const state = { slide: null, grid: null, plays: 0, components: 0, timeline: [] };
  let pending = 0;
  let forceNext = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const owned = new Set();
  function finish() {
    owned.forEach(a => { try { a.finish(); } catch {} });
    owned.clear();
  }
  function currentSlide() {
    return document.querySelector('#deck > section.slide.active')
      || document.querySelector('#deck > section.slide[data-deck-active]');
  }
  function play(force) {
    const slide = currentSlide();
    const grid = slide && slide.querySelector('.bespoke-grid');
    if (!slide) return;
    document.querySelectorAll('#deck video').forEach(video => {
      const active = slide.contains(video);
      video.controls = true;
      video.playsInline = true;
      video.preload = 'auto';
      if (/11-10\.(mp4|webm)/.test(video.getAttribute('src') || '')) {
        video.poster = 'assets/user-media/11-10.poster.jpg';
        if (!video.dataset.compatReady) {
          video.dataset.compatReady = 'true';
          video.addEventListener('error', () => {
            if (!video.src.endsWith('.mp4')) { video.src = 'assets/user-media/11-10.mp4'; video.load(); }
          });
        }
      }
      if (active) { video.muted = true; video.loop = true; video.play().catch(() => {}); }
      else video.pause();
    });
    if (!grid || (!force && state.slide === slide && state.grid === grid)) return;
    finish();
    state.slide = slide;
    state.grid = grid;
    state.components = grid.children.length;
    state.timeline = [];
    if (reduced.matches || window.__deckExportLocked || /[?&](?:export|print|capture)=/.test(location.search)) return;
    state.plays++;
    [...grid.children].forEach((el, index) => {
      const row = parseInt(el.style.gridRow || '1', 10) || 1;
      const col = parseInt(el.style.gridColumn || '1', 10) || 1;
      const kind = el.dataset.bespokeElement || 'text';
      // Text overlaid on its card shares that card's row/column and entrance time.
      const delay = Math.min(650, 70 + (row - 1) * 58 + (col - 1) * 9);
      const duration = kind === 'media' ? 720 : kind === 'text' && row === 1 ? 620 : 560;
      const movement = kind === 'media' ? 'translate3d(0,24px,0) scale(.985)' : 'translate3d(0,20px,0)';
      const animation = el.animate([
        { opacity: 0, transform: movement },
        { opacity: 1, transform: 'translate3d(0,0,0) scale(1)' }
      ], { delay, duration, easing: 'cubic-bezier(.2,.75,.2,1)', fill: 'backwards' });
      owned.add(animation);
      animation.finished.then(() => owned.delete(animation)).catch(() => owned.delete(animation));
      state.timeline.push({ index, kind, row, col, delay, duration });
    });
  }
  function schedule(force) {
    forceNext = forceNext || force;
    if (pending) return;
    pending = requestAnimationFrame(() => {
      pending = 0;
      const force = forceNext;
      forceNext = false;
      play(force);
    });
  }
  function boot() {
    const deck = document.getElementById('deck');
    if (!deck) return;
    // This deck uses component entrances, including for a browser with an older saved transition.
    if (window.__getPageTransition?.() !== 'none') {
      const selector = document.getElementById('preview-transition');
      if (selector) { selector.value = 'none'; selector.dispatchEvent(new Event('change', { bubbles: true })); }
      else window.__setPageTransition?.('none');
    }
    new MutationObserver(() => schedule(false)).observe(deck, { childList: true, subtree: true });
    deck.addEventListener('loadedmetadata', () => schedule(false), true);
    deck.addEventListener('canplay', () => schedule(false), true);
    addEventListener('swiss-slide-change', () => schedule(true));
    addEventListener('swiss-slide-variant-change', () => schedule(true));
    addEventListener('beforeprint', finish);
    reduced.addEventListener('change', () => { finish(); schedule(true); });
    schedule(true);
  }
  window.__museinComponentMotion = { state, replay: () => schedule(true), finish };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
