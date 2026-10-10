/* NISHLAB CREATIONS — shared behaviour. Content and prices live in data.js. */
(function () {
  var N = window.NISH || {};
  var inr = function (n) { return '₹' + Number(n).toLocaleString('en-IN'); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  window.NISH_inr = inr;

  /* mobile nav */
  var burger = $('.burger'), hdr = $('.hdr');
  if (burger && hdr) {
    burger.addEventListener('click', function () {
      var open = hdr.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('.nav a').forEach(function (a) { a.addEventListener('click', function () { hdr.classList.remove('nav-open'); burger.setAttribute('aria-expanded', 'false'); }); });
  }

  /* WhatsApp links: <a data-wa="message"> */
  function waUrl(msg) { return 'https://wa.me/' + N.phone + '?text=' + encodeURIComponent(msg); }
  window.NISH_wa = waUrl;
  $$('[data-wa]').forEach(function (a) { a.href = waUrl(a.getAttribute('data-wa')); a.target = '_blank'; a.rel = 'noopener'; });

  /* countdown to next batch (only if a date is set in data.js) */
  var cdEls = $$('[data-countdown]');
  if (cdEls.length && N.nextBatch && N.nextBatch.iso) {
    var target = new Date(N.nextBatch.iso).getTime();
    var tick = function () {
      var d = target - Date.now();
      cdEls.forEach(function (el) {
        if (d <= 0) { el.hidden = true; return; }
        el.hidden = false;
        var days = Math.floor(d / 864e5), h = Math.floor(d % 864e5 / 36e5), m = Math.floor(d % 36e5 / 6e4), s = Math.floor(d % 6e4 / 1e3);
        var set = function (k, v) { var n = el.querySelector('[data-' + k + ']'); if (n) n.textContent = String(v).padStart(2, '0'); };
        set('d', days); set('h', h); set('m', m); set('s', s);
      });
    };
    tick(); setInterval(tick, 1000);
  } else { cdEls.forEach(function (el) { el.hidden = true; }); }
  $$('[data-batch-label]').forEach(function (el) {
    el.textContent = N.nextBatch && N.nextBatch.label ? 'Next batch: ' + N.nextBatch.label : 'New batches open every month. Message us for the next start date.';
  });

  /* forms -> Google Apps Script (same backend as before) */
  $$('form[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type=submit]'), msg = form.querySelector('.msg');
      var payload = { formType: form.getAttribute('data-form') };
      $$('[name]', form).forEach(function (f) { if (f.type === 'radio' && !f.checked) return; payload[f.name] = f.value; });
      var label = btn.textContent; btn.disabled = true; btn.textContent = 'Sending...';
      var done = function (ok) {
        btn.disabled = false; btn.textContent = label;
        msg.className = 'msg ' + (ok ? 'ok' : 'err');
        msg.textContent = ok ? 'Thank you. Your details reached our team and we will contact you shortly.' : 'We could not send that. Please tap WhatsApp and message us directly.';
        if (ok) { form.reset(); form.dispatchEvent(new CustomEvent('nishlab:sent', { bubbles: true, detail: payload })); }
      };
      fetch(N.scriptUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
        .then(function () { done(true); }).catch(function () { done(false); });
    });
  });

  /* lightbox */
  var lb = $('#lb');
  if (lb) {
    var lbImg = $('img', lb);
    $$('[data-full]').forEach(function (b) { b.addEventListener('click', function () { lbImg.src = b.getAttribute('data-full'); lbImg.alt = b.getAttribute('data-alt') || ''; lb.classList.add('show'); }); });
    var close = function () { lb.classList.remove('show'); };
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.tagName === 'BUTTON') close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* course filters + deep links */
  var filters = $$('.filters button');
  if (filters.length) {
    filters.forEach(function (b) {
      b.addEventListener('click', function () {
        filters.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        var c = b.getAttribute('data-cat');
        $$('.course').forEach(function (el) { el.hidden = !(c === 'all' || el.getAttribute('data-cat') === c); });
      });
    });
  }
  function openFromHash() {
    var id = location.hash.slice(1); if (!id) return;
    var el = document.getElementById(id);
    if (el && el.tagName === 'DETAILS') { el.open = true; setTimeout(function () { el.scrollIntoView({ block: 'start' }); }, 50); }
  }
  openFromHash(); window.addEventListener('hashchange', openFromHash);

  /* combo builder (plans page) */
  var pick = $('#pick');
  if (pick && N.courses) {
    var STARTER = ['autocad', 'solidworks', 'ansys'];
    var MASTER = ['autocad', 'solidworks', 'catia', 'creo', 'fusion', 'ansys', 'keyshot'];
    var byId = {}; N.courses.forEach(function (c) { byId[c.id] = c; });
    pick.innerHTML = N.courses.map(function (c) {
      return '<label><input type="checkbox" value="' + c.id + '"><span><b>' + c.name + '</b><small>' + inr(c.fee) + ' · ' + c.hrs + ' hrs</small></span></label>';
    }).join('');
    var out = { lines: $('#qLines'), total: $('#qTotal'), why: $('#qWhy'), save: $('#qSave'), wa: $('#qWa'), list: $('#qList') };
    var sumOf = function (ids) { return ids.reduce(function (t, i) { return t + byId[i].fee; }, 0); };
    var calc = function () {
      var sel = $$('input:checked', pick).map(function (i) { return i.value; });
      if (!sel.length) {
        out.list.textContent = 'No course selected yet'; out.total.textContent = inr(0); out.save.hidden = true;
        out.why.textContent = 'Tick the courses you want. We will show the cheapest way to take them.';
        out.wa.setAttribute('data-wa', 'Hi NISHLAB, I need help choosing a course.'); out.wa.href = waUrl('Hi NISHLAB, I need help choosing a course.'); return;
      }
      var sum = sumOf(sel), best = { name: 'Individual courses', cost: sum };
      var hasStarter = STARTER.every(function (i) { return sel.indexOf(i) > -1; });
      if (hasStarter) {
        var c1 = sum - sumOf(STARTER) + N.plans.starter.fee;
        if (c1 < best.cost) best = { name: 'CAD Starter Combo + your other picks', cost: c1 };
      }
      var inMaster = sel.filter(function (i) { return MASTER.indexOf(i) > -1; });
      var rest = sel.filter(function (i) { return MASTER.indexOf(i) === -1; });
      var c2 = N.plans.master.fee + sumOf(rest);
      if (inMaster.length >= 4 && c2 < best.cost) best = { name: 'Master CAD/CAE Program' + (rest.length ? ' + your other picks' : ''), cost: c2 };
      out.list.textContent = sel.length + ' course' + (sel.length > 1 ? 's' : '') + ' at list price: ' + inr(sum);
      out.total.textContent = inr(best.cost);
      var saved = sum - best.cost;
      out.save.hidden = saved <= 0; out.save.textContent = 'You save ' + inr(saved);
      var why = 'Best option: ' + best.name + '.';
      if (best.name.indexOf('Master') === -1 && inMaster.length >= 3) {
        var extra = c2 - best.cost;
        if (extra > 0 && extra <= 12000) why += ' For ' + inr(extra) + ' more you can take all 7 Master courses.';
      }
      out.why.textContent = why + ' Final fee is confirmed on WhatsApp.';
      var msg = 'Hi NISHLAB, I want to enroll in: ' + sel.map(function (i) { return byId[i].name; }).join(', ') + '. The site shows ' + inr(best.cost) + ' (' + best.name + '). Please share batch details.';
      out.wa.href = waUrl(msg);
    };
    pick.addEventListener('change', calc);
    var pre = (location.hash || '').slice(1);
    var presets = { starter: STARTER, master: MASTER };
    if (presets[pre]) $$('input', pick).forEach(function (i) { i.checked = presets[pre].indexOf(i.value) > -1; });
    calc();
  }

  /* enquiry course preselect: ?course=ansys on join page */
  var sel = $('select[name=courseInterest]');
  if (sel) {
    var q = new URLSearchParams(location.search).get('course');
    if (q) $$('option', sel).forEach(function (o) { if (o.value.toLowerCase().indexOf(q.toLowerCase()) > -1) sel.value = o.value; });
  }
})();
