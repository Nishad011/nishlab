/* Parametric gear pair: the hero demo. Change a number, the part regenerates.
   Geometry: straight-flank 20 degree pressure-angle teeth, meshed at the pitch point. */
(function () {
  var cv = document.getElementById('gearCanvas');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var $ = function (id) { return document.getElementById(id); };
  var inZ1 = $('zA'), inZ2 = $('zB'), inM = $('mod');
  var oZ1 = $('zAo'), oZ2 = $('zBo'), oM = $('modo');
  var hCd = $('hCd'), hRatio = $('hRatio'), hRpm = $('hRpm'), hOd = $('hOd');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CYAN = '#6fd3ff', GOLD = '#f4b400', DIM = 'rgba(169,189,224,.75)';
  var dpr = 1, W = 0, H = 0, angle = 0.35, last = 0, visible = true, raf = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = cv.getBoundingClientRect();
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function gearPath(cx, cy, z, m, S, rot) {
    var r = m * z / 2 * S, ra = (m * z / 2 + m) * S, rr = (m * z / 2 - 1.25 * m) * S;
    var p = 2 * Math.PI / z, t20 = Math.tan(20 * Math.PI / 180);
    var h0 = p / 4 - 0.02 * p;
    var hOut = Math.max(h0 - (ra - r) * t20 / r, p * 0.04);
    var hRoot = Math.min(h0 + (r - rr) * t20 / r, p * 0.46);
    ctx.beginPath();
    for (var k = 0; k < z; k++) {
      var t = rot + k * p;
      var x1 = cx + rr * Math.cos(t - hRoot), y1 = cy + rr * Math.sin(t - hRoot);
      if (k === 0) ctx.moveTo(x1, y1); else ctx.lineTo(x1, y1);
      ctx.lineTo(cx + ra * Math.cos(t - hOut), cy + ra * Math.sin(t - hOut));
      ctx.lineTo(cx + ra * Math.cos(t + hOut), cy + ra * Math.sin(t + hOut));
      ctx.lineTo(cx + rr * Math.cos(t + hRoot), cy + rr * Math.sin(t + hRoot));
      ctx.arc(cx, cy, rr, t + hRoot, t + p - hRoot);
    }
    ctx.closePath();
    return { r: r, ra: ra, rr: rr };
  }

  function drawGear(cx, cy, z, m, S, rot, label) {
    var g = gearPath(cx, cy, z, m, S, rot);
    ctx.fillStyle = 'rgba(111,211,255,.09)'; ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = CYAN; ctx.stroke();
    // pitch circle
    ctx.setLineDash([5, 4]); ctx.lineWidth = 1; ctx.strokeStyle = DIM;
    ctx.beginPath(); ctx.arc(cx, cy, g.r, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    // bore + keyway
    var bore = Math.max(g.rr * 0.28, 5);
    ctx.lineWidth = 1.4; ctx.strokeStyle = CYAN;
    ctx.beginPath(); ctx.arc(cx, cy, bore, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(rot) * bore, cy + Math.sin(rot) * bore);
    ctx.lineTo(cx + Math.cos(rot) * (bore + 4), cy + Math.sin(rot) * (bore + 4)); ctx.stroke();
    // lightening holes on bigger gears
    if (z >= 24) {
      var n = 5, hr = (g.rr - bore) * 0.2, hd = (g.rr + bore) / 2;
      ctx.lineWidth = 1.2;
      for (var i = 0; i < n; i++) {
        var a = rot + i * 2 * Math.PI / n + Math.PI / n;
        ctx.beginPath(); ctx.arc(cx + hd * Math.cos(a), cy + hd * Math.sin(a), hr, 0, 7); ctx.stroke();
      }
    }
    // centre lines
    ctx.setLineDash([14, 3, 2, 3]); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(244,180,0,.8)';
    ctx.beginPath(); ctx.moveTo(cx - g.ra - 10, cy); ctx.lineTo(cx + g.ra + 10, cy);
    ctx.moveTo(cx, cy - g.ra - 10); ctx.lineTo(cx, cy + g.ra + 10); ctx.stroke(); ctx.setLineDash([]);
    // label
    ctx.fillStyle = DIM; ctx.font = '11px "IBM Plex Mono",monospace'; ctx.textAlign = 'center';
    ctx.fillText(label, cx, cy + g.ra + 20);
    return g;
  }

  function arrowDim(x1, x2, y, text) {
    ctx.strokeStyle = GOLD; ctx.fillStyle = GOLD; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
    [[x1, 1], [x2, -1]].forEach(function (a) {
      ctx.beginPath(); ctx.moveTo(a[0], y); ctx.lineTo(a[0] + a[1] * 8, y - 3); ctx.lineTo(a[0] + a[1] * 8, y + 3); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(a[0], y - 7); ctx.lineTo(a[0], y + 7); ctx.stroke();
    });
    ctx.font = '11px "IBM Plex Mono",monospace'; ctx.textAlign = 'center';
    ctx.fillText(text, (x1 + x2) / 2, y - 7);
  }

  function draw() {
    if (!W) return;
    var z1 = +inZ1.value, z2 = +inZ2.value, m = +inM.value;
    var cd = m * (z1 + z2) / 2;
    var ra1 = m * z1 / 2 + m, ra2 = m * z2 / 2 + m;
    var totalW = ra1 + cd + ra2, maxR = Math.max(ra1, ra2);
    var S = Math.min((W - 44) / totalW, (H - 104) / (2 * maxR));
    var cx1 = (W - totalW * S) / 2 + ra1 * S;
    var cx2 = cx1 + cd * S;
    var cy = (H - 52) / 2 + 4;
    ctx.clearRect(0, 0, W, H);
    // faint sheet ticks
    ctx.strokeStyle = 'rgba(127,176,255,.10)'; ctx.lineWidth = 1;
    for (var gx = 0; gx < W; gx += 30) { ctx.beginPath(); ctx.moveTo(gx + .5, 0); ctx.lineTo(gx + .5, H); ctx.stroke(); }
    for (var gy = 0; gy < H; gy += 30) { ctx.beginPath(); ctx.moveTo(0, gy + .5); ctx.lineTo(W, gy + .5); ctx.stroke(); }
    var a2 = Math.PI + Math.PI / z2 - angle * z1 / z2;
    drawGear(cx1, cy, z1, m, S, angle, 'DRIVER  Z' + z1 + '  PD ' + (m * z1).toFixed(0));
    drawGear(cx2, cy, z2, m, S, a2, 'DRIVEN  Z' + z2 + '  PD ' + (m * z2).toFixed(0));
    // contact point marker
    ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(cx1 + (m * z1 / 2) * S, cy, 3.2, 0, 7); ctx.fill();
    arrowDim(cx1, cx2, H - 12, 'C = ' + cd.toFixed(1) + ' mm');
    // readouts
    hCd.textContent = cd.toFixed(1) + ' mm';
    hRatio.textContent = (z2 / z1).toFixed(2) + ' : 1';
    hRpm.textContent = Math.round(1000 * z1 / z2) + ' rpm';
    hOd.textContent = (2 * ra1).toFixed(0) + ' / ' + (2 * ra2).toFixed(0) + ' mm';
    oZ1.textContent = z1; oZ2.textContent = z2; oM.textContent = m.toFixed(1);
  }

  function frame(ts) {
    if (!visible) { raf = 0; return; }
    var dt = last ? Math.min((ts - last) / 1000, 0.05) : 0;
    last = ts; angle += dt * 0.55;
    draw(); raf = requestAnimationFrame(frame);
  }
  function start() { if (!reduce && !raf) { last = 0; raf = requestAnimationFrame(frame); } }

  [inZ1, inZ2, inM].forEach(function (el) { el.addEventListener('input', draw); });
  window.addEventListener('resize', resize);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); }, { threshold: 0.05 }).observe(cv);
  }
  resize(); start();
})();
