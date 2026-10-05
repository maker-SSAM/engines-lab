/* ═══════════════════════════════════════════════════════════════
   objects.js — 오브젝트(OBJ) 라이브러리 · 공용 효과(FX)
   규약:
   · OBJ.def(name, {box:[w,h], svg(o)}) — svg(o) 는 문자열. 좌표는 (0,0)~box 안(조금 넘어도 됨)
   · 그라데이션·필터 id 는 `${o.id}-무엇` 으로 (같은 오브젝트가 여러 장에 나와도 안 겹치게)
   · 움직이는 부품에는 class="p-부품" 을 붙인다 → 장면 CSS/JS 에서 이 이름으로 잡음
   · 색은 var(--fil) 같은 의미 색 변수만 쓴다 (밝은 면/어두운 면에서 자동 전환)
   · 쓰는 법: OBJ.place('hotend', {id, x, y, s})  → <g transform=...> 문자열
   ═══════════════════════════════════════════════════════════════ */
window.OBJ = (function () {
  const reg = {}; let n = 0;
  return {
    def(name, d) { reg[name] = d; },
    box(name) { return reg[name].box; },
    place(name, o) {
      o = o || {}; const d = reg[name];
      if (!d) throw new Error('OBJ 없음: ' + name);
      const id = o.id || (name + '-' + (++n));
      return '<g class="o-' + name + '" id="' + id + '" transform="translate(' + (o.x || 0) + ' ' + (o.y || 0) +
        ') scale(' + (o.s == null ? 1 : o.s) + ')">' + d.svg(Object.assign({}, o, { id })) + '</g>';
    }
  };
})();

/* ── 핫엔드(노즐 조립체). 노즐 끝 = (60,170). 필라멘트 굵은 선이 위로 들어옴 ── */
OBJ.def('hotend', {
  box: [120, 170],
  svg(o) {
    const fil = o.fil || 70;
    return `
      <rect class="p-fil" x="55" y="${-fil}" width="10" height="${fil + 60}" rx="5" style="fill:var(--fil)"/>
      <rect x="28" y="0" width="64" height="46" rx="8" fill="#48484a"/>
      <path d="M34 12H86M34 24H86M34 36H86" stroke="#2c2c2e" stroke-width="3" stroke-linecap="round"/>
      <rect class="p-heater" x="16" y="46" width="88" height="62" rx="10" style="fill:var(--heater,#5a5a5e);transition:fill .8s"/>
      <path d="M40 108H80L66 170H54Z" style="fill:var(--metal)"/>
      <path d="M54 170H66" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>`;
  }
});

/* ── 필라멘트 스풀. 중심 (100,100). 돌아가면 구멍 3개가 보임(class p-spool) ── */
OBJ.def('spool', {
  box: [200, 200],
  svg(o) {
    const holes = [0, 120, 240].map(a => {
      const r = a * Math.PI / 180; return `<circle cx="${100 + 58 * Math.sin(r)}" cy="${100 - 58 * Math.cos(r)}" r="11" fill="#1d1d1f"/>`;
    }).join('');
    return `<g class="p-spool" style="transform-box:fill-box;transform-origin:center">
      <circle cx="100" cy="100" r="96" fill="#2c2c2e"/>
      <circle cx="100" cy="100" r="84" style="fill:var(--fil)"/>
      <circle cx="100" cy="100" r="70" fill="none" stroke="#000" stroke-opacity=".16" stroke-width="3"/>
      <circle cx="100" cy="100" r="54" fill="none" stroke="#000" stroke-opacity=".16" stroke-width="3"/>
      <circle cx="100" cy="100" r="38" fill="#2c2c2e"/>
      ${holes.replace(/r="11"/g, 'r="9"')}
      <circle cx="100" cy="100" r="12" fill="#6e6e73"/></g>`;
  }
});

/* ── 출력판(베드). 윗면 중심이 (0,0). 좌우 ±260 ── */
OBJ.def('bed', {
  box: [520, 22],
  svg() {
    return `<rect x="-260" y="0" width="520" height="22" rx="6" fill="#3a3a3c"/>
      <rect x="-260" y="0" width="520" height="4" rx="2" fill="#6e6e73"/>`;
  }
});

/* ═══════════════════════════════════════════════════════════════
   FX — 공용 효과
   FX.printLoop(ctx, o)  3D 프린터가 한 층씩 쌓는 모습(노즐 고정, 베드가 좌우·아래로 움직임)
     o.bed      베드 그룹(<g>) — 안에 베드와 층(rect)이 들어 있음. 좌표 원점 = 베드 윗면 중심
     o.layers   층 rect 배열(아래층부터). 각 rect 는 베드 좌표계에서 y = -(j+1)*h
     o.tipX/tipY 노즐 끝의 화면 좌표        o.h 한 층 두께(px)
     o.wAt(j)   j번째 층의 너비            o.per 한 층 걸리는 시간(ms)   o.hold 다 쌓고 멈춤(ms)
     o.glow     (선택) 노즐 끝 불빛 요소 — 쌓는 동안 깜박임
   반환: stop() — 호출하면 멈추고 빈 베드로 되돌림
   ═══════════════════════════════════════════════════════════════ */
window.FX = {
  printReset(o) {
    o.layers.forEach(r => { r.setAttribute('width', 0); r.setAttribute('x', 0); });
    o.bed.setAttribute('transform', 'translate(' + o.tipX + ' ' + o.tipY + ')');
    o.bed.style.opacity = 1;
  },
  printLoop(ctx, o) {
    const N = o.layers.length, cyc = N * o.per + o.hold, FADE = 500;
    const sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
    const stopLoop = ctx.loop(t => {
      const tt = t % cyc, p = Math.min(tt / o.per, N);
      const L = Math.min(Math.floor(p), N - 1), f = p >= N ? 1 : p - L;
      o.layers.forEach((r, j) => {
        const w = o.wAt(j);
        if (j < L || (j === L && f >= 1)) { r.setAttribute('x', -w / 2); r.setAttribute('width', w); }
        else if (j === L) {
          r.setAttribute('width', w * f);
          r.setAttribute('x', L % 2 === 0 ? -w / 2 : w / 2 - w * f);
        } else { r.setAttribute('width', 0); }
      });
      const w = o.wAt(L);
      const xloc = f >= 1 ? 0 : (L % 2 === 0 ? -w / 2 + w * f : w / 2 - w * f);
      o.bed.setAttribute('transform', 'translate(' + (o.tipX - xloc) + ' ' + (o.tipY + o.h * (L + sm(f / 0.15))) + ')');
      o.bed.style.opacity = tt > cyc - FADE ? Math.max(0, (cyc - tt) / FADE) : 1;
      if (o.glow) o.glow.style.opacity = p >= N ? 0.25 : 0.7 + 0.3 * Math.sin(t / 60);
    });
    const stop = () => { stopLoop(); FX.printReset(o); if (o.glow) o.glow.style.opacity = 0; };
    return stop;
  }
};

/* ── 파라메트릭 꽃병 ── FX.vase(h,R,amp,cnt) → {body, rim, rx, ry}  (원점 = 윗면 중심, 아래로 h)
   h 높이(px) · R 최대 반지름 · amp 물결 크기(0~1) · cnt 물결 개수. body 는 <path d>, rim 은 윗면 타원의 rx/ry */
FX.vase = function (h, R, amp, cnt) {
  const N = 48, r = t => R * (0.3 + 0.7 * Math.sin(Math.PI * (0.08 + 0.84 * Math.pow(t, 0.8)))) *
    (1 + amp * 0.12 * Math.sin(t * cnt * 2 * Math.PI));
  const L = [], Rt = [];
  for (let i = 0; i <= N; i++) { const t = i / N, y = (t * h).toFixed(1), x = r(t); L.push((-x).toFixed(1) + ' ' + y); Rt.push(x.toFixed(1) + ' ' + y); }
  const rb = r(1), rt = r(0);
  const d = 'M' + L.join('L') + 'A' + rb.toFixed(1) + ' ' + (rb * 0.25).toFixed(1) + ' 0 0 0 ' + Rt[N] + 'L' + Rt.reverse().join('L') + 'Z';
  return { body: d, rx: rt, ry: rt * 0.25 };
};
