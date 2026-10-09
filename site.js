/* ==========================================================================
   Vital Realty — site.js (shared on every page)
   Header, menu, footer, page transitions, cursor, reveals, cards, forms.
   ========================================================================== */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (reduce) root.classList.add('no-anim');

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var PHONE = '+998 71 200 00 00', PHONE_HREF = 'tel:+998712000000';
  var MAIL = 'hello@vitalrealty.uz';
  var page = document.body.dataset.page || '';

  var ICON = {
    mark: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M6 9.5h28" stroke="#b89a62" stroke-width="1.2" fill="none"/><path d="M9 9.5 20 32 31 9.5" stroke="#e9e4da" stroke-width="1.4" fill="none" stroke-linejoin="miter"/><path d="M14.5 9.5 20 21l5.5-11.5" stroke="#b89a62" stroke-width="1" fill="none"/></svg>',
    arrow: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 8h13M9 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.7 4.5 7.1 4.5c2 0 3.6 1.2 4.9 3 1.3-1.8 2.9-3 4.9-3 3.4 0 5.7 3.4 4.4 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/></svg>',
    prev: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M15 8H2M7 3 2 8l5 5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
    next: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 8h13M9 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
    close: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2l12 12M14 2 2 14" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>'
  };

  var NAV = [
    ['catalog.html', 'Объекты', 'catalog'],
    ['services.html', 'Услуги', 'services'],
    ['about.html', 'О компании', 'about'],
    ['contacts.html', 'Контакты', 'contacts']
  ];
  function navLinks() {
    return NAV.map(function (n) { return '<a href="' + n[0] + '"' + (page === n[2] ? ' aria-current="page"' : '') + '>' + n[1] + '</a>'; }).join('');
  }

  /* ---------------- chrome: curtain, grain, cursor, header, menu ---------------- */
  var chrome = document.createElement('div');
  chrome.innerHTML =
    '<div class="curtain" aria-hidden="true"><div class="curtain__mark">' + ICON.mark + '</div></div>' +
    '<div class="grain" aria-hidden="true"></div>' +
    '<div class="cursor" aria-hidden="true"><span></span></div>' +
    '<header class="header" id="header">' +
      '<a class="brand" href="index.html" aria-label="Vital Realty, на главную">' + ICON.mark +
        '<span class="brand__name">Vital Realty<small>Элитная недвижимость Ташкента</small></span></a>' +
      '<nav class="nav" aria-label="Основная навигация">' + navLinks() + '</nav>' +
      '<div class="header__cta"><a class="header__phone" href="' + PHONE_HREF + '">' + PHONE + '</a>' +
        '<a class="btn btn--line btn--sm" href="contacts.html#request">Подобрать объект</a>' +
        '<button class="burger" id="burger" aria-label="Меню" aria-expanded="false"><i></i><i></i></button></div>' +
    '</header>' +
    '<div class="menu" id="menu" aria-hidden="true"><nav aria-label="Меню">' +
      '<a href="index.html"' + (page === 'home' ? ' aria-current="page"' : '') + '>Главная</a>' + navLinks() +
    '</nav><div class="menu__foot"><a href="' + PHONE_HREF + '">' + PHONE + '</a><a href="mailto:' + MAIL + '">' + MAIL + '</a><span>Ташкент, Tashkent City</span></div></div>';
  while (chrome.firstChild) document.body.insertBefore(chrome.firstChild, document.body.firstChild);

  /* footer for regular pages */
  var footSlot = $('#footer');
  if (footSlot) {
    footSlot.outerHTML =
      '<footer class="footer"><div class="wrap">' +
        '<div class="footer__top">' +
          '<div><p class="footer__claim">Покупаем, продаём и сдаём дома, в которых хочется жить.</p></div>' +
          '<div><h4>Разделы</h4><ul><li><a href="catalog.html">Объекты</a></li><li><a href="catalog.html?deal=rent">Аренда</a></li><li><a href="services.html">Услуги</a></li><li><a href="about.html">О компании</a></li></ul></div>' +
          '<div><h4>Связь</h4><ul><li><a href="' + PHONE_HREF + '">' + PHONE + '</a></li><li><a href="mailto:' + MAIL + '">' + MAIL + '</a></li><li><a href="#" rel="noopener">Telegram</a></li><li><a href="#" rel="noopener">Instagram</a></li></ul></div>' +
          '<div><h4>Офис</h4><ul><li>Ташкент, Tashkent City</li><li>Бизнес-центр, 14 этаж</li><li>Пн–Сб, 9:00–20:00</li></ul></div>' +
        '</div>' +
        '<div class="wordmark" aria-hidden="true">Vital Realty</div>' +
        '<div class="footer__bottom"><span>© ' + new Date().getFullYear() + ' Vital Realty</span><span>Демо-версия сайта: объекты, цены и команда приведены для примера</span></div>' +
      '</div></footer>';
  }

  /* ---------------- menu ---------------- */
  var menu = $('#menu'), burger = $('#burger');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  burger.addEventListener('click', function () { setMenu(!document.body.classList.contains('menu-open')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  window.VRmenu = setMenu;

  /* ---------------- header behaviour (regular pages) ---------------- */
  var header = $('#header');
  if (page !== 'home') {
    var lastY = 0;
    var onScroll = function () {
      var y = window.scrollY;
      header.classList.toggle('is-solid', y > 40);
      header.classList.toggle('is-hidden', y > lastY && y > 400 && !document.body.classList.contains('menu-open'));
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------------- page transitions ---------------- */
  function ready() { requestAnimationFrame(function () { root.classList.add('ready'); }); }
  if (document.readyState === 'complete') ready(); else window.addEventListener('load', ready);
  setTimeout(ready, 1800); // never keep the curtain down if an image is slow
  window.addEventListener('pageshow', function (e) { if (e.persisted) { root.classList.remove('leaving'); root.classList.add('ready'); } });

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || reduce || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^(tel:|mailto:|https?:)/.test(href)) return;
    var url = new URL(href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return;
    e.preventDefault();
    setMenu(false);
    root.classList.remove('ready');
    root.classList.add('leaving');
    setTimeout(function () { location.href = url.href; }, 650);
  });

  /* ---------------- cursor ---------------- */
  if (fine) {
    var cur = $('.cursor'), label = $('.cursor span'), cx = innerWidth / 2, cy = innerHeight / 2, x = cx, y = cy;
    window.addEventListener('mousemove', function (e) { cx = e.clientX; cy = e.clientY; cur.style.opacity = 1; });
    (function loop() {
      x += (cx - x) * 0.2; y += (cy - y) * 0.2;
      cur.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      requestAnimationFrame(loop);
    })();
    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest && e.target.closest('a, button, input, select, textarea, label, [data-cursor]');
      cur.classList.toggle('is-big', !!t);
      var lab = t && t.getAttribute('data-cursor');
      cur.classList.toggle('has-label', !!lab);
      label.textContent = lab || '';
    });
  }

  /* ---------------- image reveals (regular pages) ---------------- */
  function observeReveals(scope) {
    var els = $$('.rv-img:not(.in)', scope);
    if (!('IntersectionObserver' in window) || reduce) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }
  observeReveals(document);

  /* ---------------- listing card ---------------- */
  function card(o, opts) {
    opts = opts || {};
    var d = VR.district(o.district), isFav = VR.favs().indexOf(o.id) > -1;
    var specs = o.type === 'Коммерция'
      ? '<span>' + o.area + ' м²</span><span>' + o.floor + '</span>'
      : '<span>' + o.area + ' м²</span><span>' + o.beds + ' спальн' + (o.beds === 1 ? 'я' : (o.beds < 5 ? 'и' : 'ен')) + '</span>';
    return '<article class="card">' +
      '<div class="card__media' + (opts.reveal === false ? '' : ' rv-img') + '" data-cursor="Смотреть">' +
        '<img src="' + VR.img(o.imgs[0], 900) + '" alt="' + esc(o.title) + '" loading="lazy">' +
        '<span class="card__tag">' + (o.deal === 'rent' ? 'Аренда' : o.type) + '</span>' +
      '</div>' +
      '<button class="fav' + (isFav ? ' is-on' : '') + '" data-fav="' + o.id + '" aria-pressed="' + isFav + '" aria-label="' + (isFav ? 'Убрать из избранного' : 'В избранное') + '">' + ICON.heart + '</button>' +
      '<div class="card__body">' +
        '<p class="card__place">' + esc(d ? d.name : '') + '</p>' +
        '<h3 class="card__title"><a href="property.html?id=' + o.id + '">' + esc(o.title) + '</a></h3>' +
        '<div class="card__row"><span class="card__price">' + VR.price(o) + '</span><span class="card__specs">' + specs + '</span></div>' +
      '</div></article>';
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-fav]');
    if (!b) return;
    e.preventDefault();
    var on = VR.toggleFav(b.dataset.fav);
    $$('[data-fav="' + b.dataset.fav + '"]').forEach(function (x) {
      x.classList.toggle('is-on', on);
      x.setAttribute('aria-pressed', on);
      x.setAttribute('aria-label', on ? 'Убрать из избранного' : 'В избранное');
    });
    document.dispatchEvent(new CustomEvent('vr:fav'));
  });

  /* ---------------- forms (front-end only until a backend/Telegram bot is connected) ---------------- */
  function bindForms(scope) {
  $$('form[data-lead]:not([data-bound])', scope).forEach(function (f) {
    f.setAttribute('data-bound', '');
    f.setAttribute('novalidate', '');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      $$('[required]', f).forEach(function (el) {
        var bad = !el.value.trim() || (el.type === 'tel' && el.value.replace(/\D/g, '').length < 9);
        el.classList.toggle('is-error', bad);
        if (bad && ok) { el.focus(); ok = false; }
      });
      if (!ok) { var n = $('.form__note', f); if (n) n.textContent = 'Заполните имя и телефон, чтобы мы могли перезвонить.'; return; }
      f.classList.add('is-sent');
    });
  });
  $$('input[type=tel]', scope).forEach(function (el) {
    el.addEventListener('focus', function () { if (!el.value) el.value = '+998 '; });
  });
  }
  bindForms(document);

  window.VRUI = { $: $, $$: $$, esc: esc, card: card, icon: ICON, observeReveals: observeReveals, bindForms: bindForms, reduce: reduce, fine: fine, phone: PHONE, phoneHref: PHONE_HREF, mail: MAIL };
})();
