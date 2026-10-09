/* ==========================================================================
   Vital Realty — home.js
   Full-screen frames with paced transitions (one gesture = one frame,
   inertia swallowed), WebGL hero, featured objects, districts, search.
   ========================================================================== */
(function () {
  'use strict';
  var root = document.documentElement;
  var U = window.VRUI, $ = U.$, $$ = U.$$, esc = U.esc;

  /* ---------------- content from data.js ---------------- */
  // search selects
  var sType = $('#s-type'), sDis = $('#s-district'), sDeal = $('#s-deal'), sBud = $('#s-budget');
  VR.types.forEach(function (t) { sType.insertAdjacentHTML('beforeend', '<option>' + t + '</option>'); });
  VR.districts.forEach(function (d) { sDis.insertAdjacentHTML('beforeend', '<option value="' + d.key + '">' + d.name + '</option>'); });
  var BUDGET = {
    sale: [['', 'Любой'], ['400000', '$400 000'], ['700000', '$700 000'], ['1000000', '$1 млн'], ['2000000', '$2 млн']],
    rent: [['', 'Любой'], ['3000', '$3 000 / мес'], ['5000', '$5 000 / мес'], ['10000', '$10 000 / мес']]
  };
  function fillBudget() {
    sBud.innerHTML = BUDGET[sDeal.value].map(function (b) { return '<option value="' + b[0] + '">' + b[1] + '</option>'; }).join('');
  }
  sDeal.addEventListener('change', fillBudget); fillBudget();
  $('#search').addEventListener('submit', function (e) {
    e.preventDefault();
    var q = [];
    [['deal', sDeal], ['type', sType], ['district', sDis], ['max', sBud]].forEach(function (p) { if (p[1].value) q.push(p[0] + '=' + encodeURIComponent(p[1].value)); });
    root.classList.remove('ready'); root.classList.add('leaving');
    setTimeout(function () { location.href = 'catalog.html' + (q.length ? '?' + q.join('&') : ''); }, U.reduce ? 0 : 650);
  });

  // featured collection
  var feat = VR.list.filter(function (o) { return o.featured; }).slice(0, 3);
  $('#colGrid').innerHTML = feat.map(function (o) {
    var d = VR.district(o.district);
    return '<article class="col__item">' +
      '<div class="ph" data-a="img" data-cursor="Смотреть"><img src="' + VR.img(o.imgs[0], 1400) + '" alt="' + esc(o.title) + '" loading="lazy"></div>' +
      '<div class="col__meta" data-a="up"><div><h3><a href="property.html?id=' + o.id + '">' + esc(o.title) + '</a></h3><p>' + esc(d.name) + ', ' + o.area + ' м²</p></div>' +
      '<span class="num">' + VR.price(o) + '</span></div></article>';
  }).join('');

  // districts
  var disList = $('#disList'), disMedia = $('#disMedia'), disNote = $('#disNote'), disPrice = $('#disPrice');
  var shown = VR.districts.slice(0, 6);
  disList.innerHTML = shown.map(function (d, i) {
    var n = VR.list.filter(function (o) { return o.district === d.key; }).length;
    return '<li data-a="up"><a href="catalog.html?district=' + d.key + '" data-i="' + i + '"' + (i === 0 ? ' class="is-on"' : '') + '><b>' + d.name + '</b><small>' + n + ' ' + (n === 1 ? 'объект' : (n > 1 && n < 5 ? 'объекта' : 'объектов')) + '</small></a></li>';
  }).join('');
  disMedia.insertAdjacentHTML('afterbegin', shown.map(function (d, i) {
    return '<img src="' + VR.img(d.cover, 1400) + '" alt="' + esc(d.name) + '" loading="lazy"' + (i === 0 ? ' class="is-on"' : '') + '>';
  }).join(''));
  function setDistrict(i) {
    var d = shown[i];
    $$('#disList a').forEach(function (a, k) { a.classList.toggle('is-on', k === i); });
    $$('#disMedia img').forEach(function (im, k) { im.classList.toggle('is-on', k === i); });
    disNote.textContent = d.note;
    disPrice.innerHTML = 'от $' + String(d.perM).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + '<small>за м²</small>';
  }
  $$('#disList a').forEach(function (a) {
    var i = +a.dataset.i;
    a.addEventListener('mouseenter', function () { setDistrict(i); });
    a.addEventListener('focus', function () { setDistrict(i); });
  });
  setDistrict(0);

  /* ---------------- frames engine ---------------- */
  if (typeof gsap === 'undefined') { root.classList.remove('frames'); return; }

  var reduce = U.reduce, fine = U.fine;
  var DUR = reduce ? 0.01 : 1.3, PAUSE = reduce ? 0 : 650, GESTURE_GAP = 220, WHEEL_T = 34, SWIPE_T = 48;
  var panels = $$('.panel'), N = panels.length;
  var cur = 0, busy = true, needFresh = false, lastWheel = 0, acc = 0;

  var pager = $('#pager');
  panels.forEach(function (p, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', p.dataset.title);
    b.innerHTML = '<span>' + p.dataset.title + '</span>';
    b.addEventListener('click', function () { go(i); });
    pager.appendChild(b);
  });
  function syncUI(i) {
    $$('.pager button').forEach(function (b, k) { b.classList.toggle('is-active', k === i); b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    if (history.replaceState) history.replaceState(null, '', i === 0 ? location.pathname : '#' + panels[i].id);
  }

  function resetPanel(p) {
    gsap.killTweensOf($$('[data-a], [data-a] *', p));
    $$('[data-a="up"]', p).forEach(function (el) { gsap.set(el, { opacity: 0, y: 32 }); });
    $$('[data-a="fade"]', p).forEach(function (el) { gsap.set(el, { opacity: 0 }); });
    $$('[data-a="img"]', p).forEach(function (el) {
      gsap.set(el, { clipPath: 'inset(100% 0% 0% 0%)' });
      var im = $('img', el); if (im) gsap.set(im, { scale: 1.2 });
    });
    $$('[data-count]', p).forEach(function (el) { el.textContent = '0'; });
  }
  function enterPanel(p, delay) {
    var tl = gsap.timeline({ delay: delay || 0 });
    var imgs = $$('[data-a="img"]', p), ups = $$('[data-a="up"]', p), fades = $$('[data-a="fade"]', p);
    if (imgs.length) {
      tl.to(imgs, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, stagger: 0.1, ease: 'expo.inOut' }, 0.05);
      tl.to(imgs.map(function (el) { return $('img', el); }).filter(Boolean), { scale: 1, duration: 1.9, stagger: 0.1, ease: 'expo.out' }, 0.05);
    }
    if (ups.length) tl.to(ups, { opacity: 1, y: 0, duration: 1.1, stagger: 0.06, ease: 'expo.out' }, 0.1);
    if (fades.length) tl.to(fades, { opacity: 1, duration: 1.2, ease: 'power2.out' }, 0.45);
    $$('[data-count]', p).forEach(function (el) {
      var o = { v: 0 }, n = +el.dataset.count;
      tl.to(o, { v: n, duration: 2, ease: 'power3.out', onUpdate: function () { el.textContent = Math.round(o.v); } }, 0.3);
    });
    if (p.id === 'signature') {
      tl.fromTo('#sigMedia img', { scale: 1.25 }, { scale: 1.02, duration: 2.4, ease: 'expo.out' }, 0);
    }
    return tl;
  }

  var heroBits = '.hero__title, .hero__aside, .search';
  function go(i) {
    if (i < 0 || i >= N || i === cur || busy) return;
    if (window.VRmenu) window.VRmenu(false);
    busy = true; needFresh = true; acc = 0;
    var from = panels[cur], to = panels[i], dir = i > cur ? 1 : -1;
    var fromInner = $('.panel__inner', from), toInner = $('.panel__inner', to), fromShade = $('.panel__shade', from);
    resetPanel(to);
    toInner.scrollTop = 0;
    syncUI(i);

    if (reduce) {
      from.classList.remove('is-active'); to.classList.add('is-active');
      if (gl) gl.u.progress = i === 0 ? 0 : 1;
      cur = i; enterPanel(to, 0); busy = false; return;
    }

    to.classList.add('is-next');
    var tl = gsap.timeline({
      defaults: { ease: 'expo.inOut', duration: DUR },
      onComplete: function () {
        from.classList.remove('is-active'); to.classList.remove('is-next'); to.classList.add('is-active');
        gsap.set([from, fromInner, fromShade, to, toInner], { clearProps: 'all' });
        resetPanel(from);
        cur = i;
        setTimeout(function () { busy = false; }, PAUSE);
      }
    });
    if (dir > 0) {
      tl.fromTo(to, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)' }, 0)
        .fromTo(toInner, { yPercent: 14 }, { yPercent: 0 }, 0)
        .to(fromInner, { yPercent: -10 }, 0)
        .to(fromShade, { opacity: 0.75 }, 0);
    } else {
      tl.fromTo(to, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)' }, 0)
        .fromTo(toInner, { yPercent: -14 }, { yPercent: 0 }, 0)
        .to(fromInner, { yPercent: 10 }, 0)
        .to(fromShade, { opacity: 0.75 }, 0);
    }
    if (gl) {
      if (from.id === 'hero') tl.to(gl.u, { progress: 1, duration: DUR, ease: 'power2.in' }, 0);
      if (to.id === 'hero') { gl.u.progress = 1; tl.to(gl.u, { progress: 0, duration: DUR * 1.1, ease: 'expo.out' }, DUR * 0.25); }
    }
    if (from.id === 'hero') tl.to($$(heroBits), { y: -50, opacity: 0, duration: DUR * 0.7, ease: 'power3.in' }, 0);
    if (to.id === 'hero') gsap.set($$(heroBits), { y: 0, opacity: 1 });
    enterPanel(to, DUR * 0.42);
  }
  function next() { go(cur + 1); }
  function prev() { go(cur - 1); }

  function scrollableInside(dir) {
    var el = $('.panel__inner', panels[cur]);
    if (!el || el.scrollHeight <= el.clientHeight + 40) return false;
    return dir > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 2 : el.scrollTop > 2;
  }
  function menuOpen() { return document.body.classList.contains('menu-open'); }

  window.addEventListener('wheel', function (e) {
    var now = performance.now(), gap = now - lastWheel; lastWheel = now;
    if (menuOpen()) return;
    var dy = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : 0;
    if (!dy) return;
    var dir = dy > 0 ? 1 : -1;
    if (scrollableInside(dir)) return;
    e.preventDefault();
    if (busy) return;
    if (needFresh) { if (gap < GESTURE_GAP) return; needFresh = false; }
    if (gap > GESTURE_GAP) acc = 0;
    acc += dy;
    if (Math.abs(acc) >= WHEEL_T) { acc = 0; dir > 0 ? next() : prev(); }
  }, { passive: false });

  var t0 = null;
  window.addEventListener('touchstart', function (e) {
    var t = e.touches[0];
    t0 = { x: t.clientX, y: t.clientY, field: !!e.target.closest('input,select,textarea') };
  }, { passive: true });
  window.addEventListener('touchmove', function (e) {
    if (!t0 || menuOpen()) return;
    var t = e.touches[0], dy = t.clientY - t0.y;
    if (scrollableInside(dy < 0 ? 1 : -1)) return;
    if (e.cancelable) e.preventDefault();
  }, { passive: false });
  window.addEventListener('touchend', function (e) {
    if (!t0 || menuOpen()) { t0 = null; return; }
    var t = e.changedTouches[0], dx = t.clientX - t0.x, dy = t.clientY - t0.y; t0 = null;
    if (Math.abs(dy) < SWIPE_T || Math.abs(dy) < Math.abs(dx) * 1.2) return;
    var dir = dy < 0 ? 1 : -1;
    if (scrollableInside(dir)) return;
    dir > 0 ? next() : prev();
  }, { passive: true });

  window.addEventListener('keydown', function (e) {
    if (menuOpen() || (e.target.closest && e.target.closest('input,select,textarea'))) return;
    var k = e.key;
    if (k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) { e.preventDefault(); next(); }
    else if (k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)) { e.preventDefault(); prev(); }
    else if (k === 'Home') { e.preventDefault(); go(0); }
    else if (k === 'End') { e.preventDefault(); go(N - 1); }
  });

  // tabbing into an off-screen frame jumps to it
  document.addEventListener('focusin', function (e) {
    var p = e.target.closest && e.target.closest('.panel');
    if (!p) return;
    var i = panels.indexOf(p);
    if (i !== cur && !busy) go(i);
  });

  /* ---------------- initial state + intro ---------------- */
  panels.forEach(resetPanel);
  gsap.set('.hero__title .ln > span', { yPercent: 110 });
  gsap.set($$('.hero [data-h="fade"]'), { opacity: 0, y: 20 });
  var start = 0;
  if (location.hash) { var t = $(location.hash); if (t && t.classList.contains('panel')) start = panels.indexOf(t); }
  panels[start].classList.add('is-active');
  cur = start; syncUI(start);

  var gl = initGL();
  if (gl && start !== 0) gl.u.progress = 1;

  function intro() {
    var tl = gsap.timeline({ onComplete: function () { busy = false; } });
    tl.to('#pager', { opacity: 1, duration: 1 }, 0.5);
    gsap.set('.hero__title .ln > span', { yPercent: start === 0 ? 110 : 0 });
    if (start === 0) {
      tl.to('.hero__title .ln > span', { yPercent: 0, duration: 1.5, stagger: 0.1, ease: 'expo.out' }, 0.1)
        .to($$('.hero [data-h="fade"]'), { opacity: 1, y: 0, duration: 1.2, stagger: 0.12, ease: 'expo.out' }, 0.6);
      if (gl) tl.fromTo(gl.u, { intro: 1 }, { intro: 0, duration: 2.4, ease: 'expo.out' }, 0);
    } else {
      gsap.set($$('.hero [data-h="fade"]'), { opacity: 1, y: 0 });
      if (gl) gl.u.intro = 0;
      tl.add(enterPanel(panels[start], 0), 0);
    }
  }
  var started = false;
  function kick() { if (started) return; started = true; setTimeout(intro, reduce ? 0 : 450); }
  if (document.readyState === 'complete') kick(); else window.addEventListener('load', kick);
  setTimeout(kick, 1900);

  /* ---------------- WebGL hero ---------------- */
  function initGL() {
    if (reduce) return null;
    var canvas = $('#gl');
    var g = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false });
    if (!g) return null;
    var vs = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
    var fs = [
      'precision highp float;',
      'varying vec2 v;uniform sampler2D t;uniform vec2 res,img,mouse;uniform float time,progress,intro,hover;',
      'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
      'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
      ' return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
      'float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*noise(p);p*=2.02;a*=.5;}return s;}',
      'vec2 cover(vec2 uv){float rs=res.x/res.y,ri=img.x/img.y;vec2 s=rs<ri?vec2(rs/ri,1.):vec2(1.,ri/rs);return (uv-.5)*s+.5;}',
      'vec3 grade(vec3 c){float l=dot(c,vec3(.299,.587,.114));c=mix(vec3(l),c,.62);c=(c-.5)*1.08+.5;c*=vec3(1.02,.99,.94);return c*.6;}',
      'void main(){',
      ' vec2 uv=v;uv.y=1.-uv.y;',
      ' float pr=progress;',
      ' vec2 cuv=(uv-.5)/(1.+.1*pr+.12*intro)+.5;',
      ' cuv+=(mouse-.5)*vec2(-.014,.01);',
      ' float n=fbm(vec2(uv.x*3.,uv.y*6.-time*.22));',
      ' float st=(pr*.16+intro*.08)*(.4+n);',
      ' cuv.x+=sin(uv.y*26.+time*1.5+n*6.)*st*.35;',
      ' cuv.y+=(n-.5)*st;',
      ' vec2 md=uv-mouse;md.x*=res.x/res.y;float dm=length(md);',
      ' cuv+=normalize(md+1e-5)*sin(dm*40.-time*4.)*.004*smoothstep(.25,0.,dm)*hover;',
      ' vec2 tuv=cover(cuv);',
      ' float rgb=.002+pr*.022+intro*.01;',
      ' vec3 col=vec3(texture2D(t,tuv+vec2(rgb,0.)).r,texture2D(t,tuv).g,texture2D(t,tuv-vec2(rgb,0.)).b);',
      ' col=grade(col);',
      ' float edge=fbm(uv*vec2(4.,8.)+time*.1);',
      ' float dis=smoothstep(pr*1.3-.15,pr*1.3+.05,1.-uv.y+edge*.3);',
      ' col*=mix(1.,dis,step(.001,pr));',
      ' col+=vec3(.85,.76,.6)*pow(n,6.)*pr*(1.-pr)*1.4;',
      ' float vig=smoothstep(1.2,.3,length(uv-.5));col*=mix(.55,1.,vig);',
      ' col+=(h(uv*res+time)-.5)*.035;',
      ' col*=1.-intro*.6;',
      ' gl_FragColor=vec4(col,1.);',
      '}'
    ].join('\n');
    function sh(type, src) {
      var s = g.createShader(type); g.shaderSource(s, src); g.compileShader(s);
      if (!g.getShaderParameter(s, g.COMPILE_STATUS)) { console.warn(g.getShaderInfoLog(s)); return null; }
      return s;
    }
    var a = sh(g.VERTEX_SHADER, vs), b = sh(g.FRAGMENT_SHADER, fs);
    if (!a || !b) return null;
    var prog = g.createProgram();
    g.attachShader(prog, a); g.attachShader(prog, b); g.linkProgram(prog); g.useProgram(prog);
    var buf = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, buf);
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), g.STATIC_DRAW);
    var loc = g.getAttribLocation(prog, 'p'); g.enableVertexAttribArray(loc); g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
    var L = {}; ['res', 'img', 'mouse', 'time', 'progress', 'intro', 'hover'].forEach(function (n) { L[n] = g.getUniformLocation(prog, n); });
    var u = { progress: 0, intro: 1, hover: 0, mx: 0.5, my: 0.5 };
    var mouse = { x: 0.5, y: 0.5 };
    window.addEventListener('mousemove', function (e) { mouse.x = e.clientX / innerWidth; mouse.y = e.clientY / innerHeight; });
    var tex = g.createTexture(), ok = false, im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = function () {
      g.bindTexture(g.TEXTURE_2D, tex);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
      g.texImage2D(g.TEXTURE_2D, 0, g.RGB, g.RGB, g.UNSIGNED_BYTE, im);
      g.uniform2f(L.img, im.naturalWidth, im.naturalHeight);
      ok = true; $('#hero').classList.add('gl-ready');
    };
    im.src = $('.hero__img').currentSrc || $('.hero__img').src;
    function resize() {
      var d = Math.min(devicePixelRatio || 1, 1.75);
      canvas.width = Math.max(1, canvas.clientWidth * d); canvas.height = Math.max(1, canvas.clientHeight * d);
      g.viewport(0, 0, canvas.width, canvas.height); g.uniform2f(L.res, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize); resize();
    gsap.ticker.add(function (time) {
      var visible = panels[cur].id === 'hero' || $('#hero').classList.contains('is-next') || busy;
      if (!ok || !visible) return;
      u.mx += (mouse.x - u.mx) * 0.06; u.my += (mouse.y - u.my) * 0.06;
      u.hover += ((fine ? 1 : 0) - u.hover) * 0.05;
      g.uniform1f(L.time, time); g.uniform1f(L.progress, u.progress); g.uniform1f(L.intro, u.intro); g.uniform1f(L.hover, u.hover);
      g.uniform2f(L.mouse, u.mx, u.my);
      g.drawArrays(g.TRIANGLES, 0, 6);
    });
    return { u: u };
  }
})();
