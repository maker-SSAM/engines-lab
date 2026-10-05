/* ═══════════════════════════════════════════════════════════════
   core.js — 강의 덱 엔진
   · 1920×1080 무대를 화면에 맞춰 배율(레터박스)
   · 장면(scene) = 도입(enter, 저절로) + 빌드 단계(클릭마다 한 단계)
   · 모든 모습은 "단계 k 의 함수"다. 되돌아가기·건너뛰기는 k 로 즉시 그려서 언제나 같은 모습
   · 애니메이션 도구(ctx)는 장면을 떠나면 저절로 정리됨
   ───────────────────────────────────────────────────────────────
   Deck.scene(id, {
     steps?,            // 클릭 단계 수 (생략하면 data-s 의 최댓값)
     build(root),       // 처음 보일 때 한 번: SVG/DOM 조립
     enter(ctx),        // 장면에 들어올 때마다: 반복 애니메이션 시작 (ctx.loop 등)
     go(k, ctx, instant)// 단계 k 가 되었을 때(앞·뒤 모두): k 에 맞게 그리기
   })
   · HTML 쪽: data-s="n" → n단계에 나타남 / 슬라이드에 클래스 ge1..geN → 단계 ≥ n 이면 붙음
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const SW = 1920, SH = 1080, MAXSTEP = 12;
  const Q = new URLSearchParams(location.search);
  const STILL = Q.get('still') === '1';
  const defs = {}, ctxs = {};
  let slides = [], cur = -1, step = 0, buf = '';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function makeCtx(root) {
    const loops = new Set(), timers = new Set(); let dead = false;
    return {
      root, state: {},
      $: s => root.querySelector(s), $$: s => [...root.querySelectorAll(s)],
      /** 매 프레임 fn(경과ms) 호출. 반환값을 부르면 멈춤 */
      loop(fn) {
        let on = true, id; const t0 = performance.now();
        const tick = n => { if (!on || dead) return; fn(n - t0); id = requestAnimationFrame(tick); };
        id = requestAnimationFrame(tick);
        const stop = () => { on = false; cancelAnimationFrame(id); loops.delete(stop); };
        loops.add(stop); return stop;
      },
      after(fn, ms) { const id = setTimeout(fn, ms); timers.add(id); return id; },
      dispose() { dead = true; loops.forEach(s => s()); timers.forEach(clearTimeout); }
    };
  }

  function maxStep(el) {
    const d = defs[el.id];
    if (d && typeof d.steps === 'number') return d.steps;
    return $$('[data-s]', el).reduce((m, n) => Math.max(m, +n.dataset.s || 0), 0);
  }

  function apply(el, k, instant) {
    const d = defs[el.id] || {};
    if (instant) el.classList.add('instant');
    $$('[data-s]', el).forEach(n => n.classList.toggle('on', +n.dataset.s <= k));
    for (let n = 1; n <= MAXSTEP; n++) el.classList.toggle('ge' + n, n <= k);
    el.dataset.step = k;
    if (d.go) d.go(k, ctxs[el.id], !!instant);
    if (instant) { void el.offsetWidth; setTimeout(() => el.classList.remove('instant'), 80); }
    hud();
  }

  function show(i, k, instant) {
    i = clamp(i, 0, slides.length - 1);
    const el = slides[i], d = defs[el.id] || {};
    const max = maxStep(el);
    if (STILL) { k = max; instant = true; }
    k = clamp(k, 0, max);
    if (i !== cur) {
      if (cur >= 0) {
        const old = slides[cur];
        if (ctxs[old.id]) ctxs[old.id].dispose();
        old.classList.remove('is-on');
      }
      cur = i;
      el.classList.add('is-on');
      if (!el._built) { if (d.build) d.build(el); el._built = true; }
      ctxs[el.id] = makeCtx(el);
      if (d.enter) d.enter(ctxs[el.id]);
      history.replaceState(null, '', '#' + (i + 1));
      renderNotes();
    }
    step = k;
    apply(el, k, instant);
  }

  function next() {
    const el = slides[cur];
    if (step < maxStep(el)) show(cur, step + 1);
    else if (cur < slides.length - 1) show(cur + 1, 0);
  }
  function prev() {
    if (step > 0) show(cur, step - 1);
    else if (cur > 0) show(cur - 1, 999, true);
  }
  const go = n => show(n - 1, 0);

  function fit() {
    const s = Math.min(innerWidth / SW, innerHeight / SH);
    $('#stage').style.transform = 'scale(' + s + ') translate(' + (-SW / 2) + 'px,' + (-SH / 2) + 'px)';
  }
  function hud() {
    $('#hud').textContent = (cur + 1) + ' / ' + slides.length;
    const el = slides[cur], m = maxStep(el) || 1;
    $('#bar').style.width = ((cur + (maxStep(el) ? step / m : 1) * 0.999) / slides.length * 100) + '%';
  }
  function renderNotes() {
    $('#notes').textContent = slides[cur].dataset.notes || '(이 장에는 대본이 없습니다)';
  }
  function toggle(id) {
    const n = $(id); const on = !n.classList.contains('on');
    $$('#overview,#help').forEach(x => { if (x !== n) x.classList.remove('on'); });
    n.classList.toggle('on', on);
    return on;
  }
  function buildOverview() {
    const ov = $('#overview');
    ov.innerHTML = slides.map((s, i) =>
      '<button data-i="' + i + '"><b>' + (i + 1) + '</b>' + (s.dataset.title || s.id) + '</button>').join('');
    ov.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      ov.classList.remove('on'); go(+b.dataset.i + 1);
    });
  }
  function markCur() { $$('#overview button').forEach(b => b.classList.toggle('cur', +b.dataset.i === cur)); }

  function keys(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (/^[0-9]$/.test(k)) { buf += k; return; }
    if (k === 'Enter' && buf) { go(+buf); buf = ''; return; }
    buf = '';
    if (k === 'ArrowRight' || k === ' ' || k === 'PageDown' || k === 'Enter') { e.preventDefault(); next(); }
    else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace') { e.preventDefault(); prev(); }
    else if (k === 'Home') go(1);
    else if (k === 'End') go(slides.length);
    else if (k === 'n' || k === 'N') $('#notes').classList.toggle('on');
    else if (k === 'o' || k === 'O') { markCur(); toggle('#overview'); }
    else if (k === 'h' || k === 'H' || k === '?') toggle('#help');
    else if (k === 'f' || k === 'F') { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }
    else if (k === 'b' || k === 'B') $('#blank').className = $('#blank').className === 'b' ? '' : 'b';
    else if (k === 'w' || k === 'W') $('#blank').className = $('#blank').className === 'w' ? '' : 'w';
    else if (k === 'r' || k === 'R') { const s = step; show(cur, 0, true); setTimeout(() => show(cur, s), 120); }
    else if (k === 'Escape') { $$('#overview,#help').forEach(x => x.classList.remove('on')); $('#blank').className = ''; }
  }

  window.Deck = {
    scene(id, def) { defs[id] = def; },
    next, prev, go,
    start() {
      slides = $$('#stage > .slide');
      if (STILL) document.body.classList.add('still');
      fit(); addEventListener('resize', fit);
      buildOverview();
      addEventListener('keydown', keys);
      /* 클릭 = 다음, 오른쪽 클릭 = 이전 */
      $('#viewport').addEventListener('click', e => { if (!e.target.closest('#notes,#overview,#help')) next(); });
      $('#viewport').addEventListener('contextmenu', e => { e.preventDefault(); prev(); });
      /* 전자칠판 좌우 밀기 */
      let tx = 0, ty = 0;
      addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
      addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { dx < 0 ? next() : prev(); }
      }, { passive: true });
      addEventListener('hashchange', () => { const n = +location.hash.slice(1); if (n && n - 1 !== cur) go(n); });
      show(clamp((+location.hash.slice(1) || 1) - 1, 0, slides.length - 1), 0);
    }
  };
})();
