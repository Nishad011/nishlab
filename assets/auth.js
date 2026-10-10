/* Login / free-video sign-up. Same Google Apps Script backend and session key as the original site,
   so student-dashboard.html and admin-dashboard.html keep working unchanged. */
(function () {
  var N = window.NISH || {};
  var $ = function (id) { return document.getElementById(id); };
  function call(body) {
    return fetch(N.scriptUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }
  function save(res) {
    var u = { email: res.email, name: res.name, role: res.role, adminKey: res.adminKey || '' };
    sessionStorage.setItem('nishlab_session', JSON.stringify(u)); return u;
  }
  function err(el, text) { el.className = 'msg err'; el.textContent = text; }
  function busy(btn, on, label) { btn.disabled = on; if (label) btn.textContent = on ? label[0] : label[1]; }

  /* login page */
  var lf = $('loginOnly');
  if (lf) {
    lf.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = $('loginBtn'), m = $('loginMsg');
      busy(btn, true, ['Signing in...', 'Sign in']); m.className = 'msg';
      call({ action: 'login', email: $('l_email').value.trim(), password: $('l_password').value }).then(function (res) {
        if (res.result === 'success') {
          save(res); m.className = 'msg ok'; m.textContent = 'Signed in. Opening your dashboard...';
          setTimeout(function () { location.href = String(res.role).toLowerCase() === 'admin' ? 'admin-dashboard.html' : 'student-dashboard.html'; }, 400);
        } else { err(m, res.message || 'Login failed. Check your email and password.'); busy(btn, false, ['', 'Sign in']); }
      }).catch(function () { err(m, 'Could not reach the server. Check your internet connection.'); busy(btn, false, ['', 'Sign in']); });
    });
    var fg = $('forgot');
    if (fg) fg.addEventListener('click', function (e) { e.preventDefault(); $('loginMsg').className = 'msg err'; $('loginMsg').textContent = 'To reset your password, email nishad@nishlabcreations.com from your registered address.'; });
  }

  /* videos page */
  var gate = $('gate');
  if (gate) {
    var area = $('videosArea');
    var show = function (u) { gate.hidden = true; area.hidden = false; $('who').textContent = 'Signed in as ' + u.name; };
    var tabS = $('tabSignup'), tabL = $('tabLogin');
    var setTab = function (t) {
      tabS.setAttribute('aria-selected', t === 'signup'); tabL.setAttribute('aria-selected', t === 'login');
      $('signupForm').hidden = t !== 'signup'; $('loginForm').hidden = t !== 'login';
    };
    tabS.addEventListener('click', function () { setTab('signup'); });
    tabL.addEventListener('click', function () { setTab('login'); });
    $('signupForm').addEventListener('submit', function (e) {
      e.preventDefault(); var b = $('su_btn'), m = $('su_msg'); m.className = 'msg'; busy(b, true, ['Creating account...', 'Create account and watch']);
      call({ action: 'signup', name: $('su_name').value.trim(), email: $('su_email').value.trim(), password: $('su_password').value }).then(function (res) {
        if (res.result === 'success') show(save(res)); else err(m, res.message || 'Could not create the account.');
      }).catch(function () { err(m, 'Could not reach the server.'); }).then(function () { busy(b, false, ['', 'Create account and watch']); });
    });
    $('loginForm').addEventListener('submit', function (e) {
      e.preventDefault(); var b = $('li_btn'), m = $('li_msg'); m.className = 'msg'; busy(b, true, ['Signing in...', 'Sign in and watch']);
      call({ action: 'login', email: $('li_email').value.trim(), password: $('li_password').value }).then(function (res) {
        if (res.result === 'success') show(save(res)); else err(m, res.message || 'Login failed.');
      }).catch(function () { err(m, 'Could not reach the server.'); }).then(function () { busy(b, false, ['', 'Sign in and watch']); });
    });
    $('signOut').addEventListener('click', function () { sessionStorage.removeItem('nishlab_session'); area.hidden = true; gate.hidden = false; });
    try { var ex = sessionStorage.getItem('nishlab_session'); if (ex) show(JSON.parse(ex)); } catch (e) { }
  }

  /* demo page: unlock recording after registration */
  var demo = $('demoForm');
  if (demo) {
    demo.addEventListener('nishlab:sent', function () {
      var u = $('unlocked'); u.hidden = false; u.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    var slots = demo.querySelectorAll('.slot input');
    Array.prototype.forEach.call(slots, function (r) { r.addEventListener('change', function () { Array.prototype.forEach.call(demo.querySelectorAll('.slot'), function (s) { s.classList.toggle('on', s.querySelector('input').checked); }); }); });
  }
})();
