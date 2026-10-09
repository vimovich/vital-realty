/* Vital Realty — property.js: single object page built from data.js */
(function () {
  'use strict';
  var U = window.VRUI, $ = U.$, $$ = U.$$, esc = U.esc;
  var id = new URLSearchParams(location.search).get('id');
  var o = VR.byId(id) || null;
  var top = $('#pTop'), body = $('#pBody');

  if (!o) {
    top.innerHTML = '<nav class="crumbs" aria-label="Навигация"><a href="index.html">Главная</a><span aria-hidden="true">/</span><a href="catalog.html">Объекты</a></nav>' +
      '<h1 class="d2" style="margin-bottom:20px">Объект не найден</h1><p class="lead" style="margin-bottom:28px">Возможно, он уже продан или ссылка устарела. Посмотрите другие предложения в каталоге.</p>' +
      '<a class="btn btn--solid" href="catalog.html">Перейти в каталог</a>';
    body.style.paddingBottom = '80px';
    return;
  }

  var d = VR.district(o.district), agent = VR.agents[o.agent], isRent = o.deal === 'rent';
  document.title = o.title + ' — Vital Realty';
  var fmt = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
  var isFav = VR.favs().indexOf(o.id) > -1;

  /* ---------------- title + gallery ---------------- */
  var gal = o.imgs.slice(0, 3);
  top.innerHTML =
    '<nav class="crumbs" aria-label="Навигация"><a href="index.html">Главная</a><span aria-hidden="true">/</span><a href="catalog.html' + (isRent ? '?deal=rent' : '') + '">Объекты</a><span aria-hidden="true">/</span><span>' + esc(o.title) + '</span></nav>' +
    '<div class="p-title">' +
      '<div><p class="label" style="margin-bottom:14px">' + esc(o.type) + ', ' + esc(d.name) + '</p><h1 class="d2">' + esc(o.title) + '</h1><p class="small" style="margin-top:14px">' + esc(o.address) + '</p></div>' +
      '<div class="p-price"><span class="num">' + VR.price(o) + '</span><small>' + (isRent ? 'залог и комиссия обсуждаются отдельно' : '$' + fmt(o.price / o.area) + ' за м²') + '</small></div>' +
    '</div>' +
    '<div class="gallery">' + gal.map(function (p, i) {
      return '<button type="button" data-lb="' + i + '" data-cursor="Открыть" aria-label="Открыть фото ' + (i + 1) + '"><img src="' + VR.img(p, i === 0 ? 1800 : 900) + '" alt="' + esc(o.title) + ', фото ' + (i + 1) + '"' + (i ? ' loading="lazy"' : '') + '>' +
        (i === gal.length - 1 ? '<span class="gallery__all">Все фото (' + o.imgs.length + ')</span>' : '') + '</button>';
    }).join('') + '</div>';

  /* ---------------- specs + content ---------------- */
  var specs = o.type === 'Коммерция'
    ? [[o.area + ' м²', 'площадь'], [o.floor.split(' ')[0], 'этаж'], [o.baths, 'санузлов'], [o.year.split(',')[0], 'год сдачи']]
    : [[o.area + ' м²', 'площадь'], [o.beds, 'спальни'], [o.baths, 'санузла'], [o.plot ? o.plot + ' сот.' : o.floor.split(' ')[0], o.plot ? 'участок' : 'этаж']];

  var rows = [
    ['Тип', o.type], ['Сделка', isRent ? 'Аренда' : 'Продажа'], ['Район', d.name], ['Адрес', o.address],
    ['Площадь', o.area + ' м²']
  ];
  if (o.plot) rows.push(['Участок', o.plot + ' соток']);
  rows.push(['Этажность', o.floor], ['Год', o.year], ['Номер объекта', o.id.toUpperCase()]);

  var mapQ = encodeURIComponent((d.key === 'chimgan' ? 'Chimgan, Uzbekistan' : d.key === 'kibray' ? 'Kibray, Tashkent region' : d.name + ' район, Ташкент'));

  var left =
    '<div>' +
      '<div class="p-specs">' + specs.map(function (s) { return '<div><b>' + s[0] + '</b><span>' + s[1] + '</span></div>'; }).join('') + '</div>' +
      '<div class="p-block"><h2>Об объекте</h2><p class="lead" style="margin-bottom:16px;color:var(--stone)">' + esc(o.lead) + '</p><p>' + esc(o.desc) + '</p></div>' +
      '<div class="p-block"><h2>Особенности</h2><ul class="p-feat">' + o.features.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="p-block"><h2>Характеристики</h2><table class="p-table"><tbody>' + rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + esc(r[1]) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<div class="p-block" style="border-bottom:0"><h2>Расположение</h2><p style="margin-bottom:20px">Точный адрес брокер сообщает перед показом. На карте отмечен район.</p>' +
        '<div class="map"><iframe title="Карта района" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=' + mapQ + '&z=13&output=embed"></iframe></div></div>' +
    '</div>';

  var calc = isRent || o.type === 'Коммерция' ? '' :
    '<div class="panel-box"><h3>Ипотека</h3><p class="small" style="margin-bottom:18px">Ориентировочный платёж. Точные условия брокер уточнит в банке-партнёре.</p>' +
      '<div class="calc">' +
        '<div class="range"><div class="range__top"><span>Первый взнос</span><b id="cDownV"></b></div><input type="range" id="cDown" min="20" max="80" step="5" value="40" aria-label="Первый взнос, процентов"></div>' +
        '<div class="range"><div class="range__top"><span>Срок</span><b id="cYearsV"></b></div><input type="range" id="cYears" min="3" max="20" step="1" value="10" aria-label="Срок, лет"></div>' +
        '<div class="range"><div class="range__top"><span>Ставка</span><b id="cRateV"></b></div><input type="range" id="cRate" min="8" max="26" step="0.5" value="18" aria-label="Ставка, процентов годовых"></div>' +
        '<div style="padding-top:14px;border-top:1px solid var(--line)"><span class="small">Платёж в месяц</span><br><output id="cOut">—</output></div>' +
      '</div></div>';

  var aside =
    '<aside class="aside">' +
      '<div class="agent"><img src="' + agent.photo + '" alt="' + esc(agent.name) + '"><div><b>' + esc(agent.name) + '</b><span>' + esc(agent.role) + '</span></div></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn--line btn--sm" href="tel:' + agent.phone.replace(/\s/g, '') + '">Позвонить брокеру</a>' +
        '<button class="btn btn--line btn--sm fav-inline" type="button" data-fav="' + o.id + '" aria-pressed="' + isFav + '">' + (isFav ? 'В избранном' : 'В избранное') + '</button></div>' +
      '<div class="panel-box" id="viewing"><h3>Записаться на показ</h3><p class="small" style="margin-bottom:18px">Брокер подтвердит время в течение 15 минут.</p>' +
        '<form class="form" data-lead>' +
          '<div class="field"><label for="v-name">Имя</label><input class="input" id="v-name" autocomplete="name" required></div>' +
          '<div class="field"><label for="v-phone">Телефон</label><input class="input" id="v-phone" type="tel" autocomplete="tel" required></div>' +
          '<div class="field"><span class="field__label">Когда удобно</span><div class="chips">' +
            '<label class="chip"><input type="radio" name="when" checked><span>Будни</span></label>' +
            '<label class="chip"><input type="radio" name="when"><span>Выходные</span></label>' +
            '<label class="chip"><input type="radio" name="when"><span>Онлайн-показ</span></label></div></div>' +
          '<button class="btn btn--solid" type="submit">Записаться на показ</button>' +
          '<p class="form__note">Объект ' + o.id.toUpperCase() + '. Нажимая кнопку, вы соглашаетесь на обработку персональных данных.</p>' +
          '<div class="form__ok"><b>Вы записаны</b><p class="muted">' + esc(agent.name.split(' ')[0]) + ' перезвонит, чтобы согласовать время показа.</p></div>' +
        '</form></div>' +
      calc +
    '</aside>';

  body.innerHTML = left + aside;
  U.bindForms(body);

  // keep the inline favourite button label in sync
  document.addEventListener('vr:fav', function () {
    var on = VR.favs().indexOf(o.id) > -1;
    $$('.fav-inline').forEach(function (b) { b.textContent = on ? 'В избранном' : 'В избранное'; });
  });

  /* ---------------- mortgage ---------------- */
  if (calc) {
    var cDown = $('#cDown'), cYears = $('#cYears'), cRate = $('#cRate');
    var calcRun = function () {
      var down = +cDown.value, years = +cYears.value, rate = +cRate.value;
      var loan = o.price * (1 - down / 100), r = rate / 100 / 12, n = years * 12;
      var pay = r ? loan * r / (1 - Math.pow(1 + r, -n)) : loan / n;
      $('#cDownV').textContent = down + '%, $' + fmt(o.price * down / 100);
      $('#cYearsV').textContent = years + ' ' + (years % 10 === 1 && years !== 11 ? 'год' : (years % 10 >= 2 && years % 10 <= 4 && (years < 12 || years > 14) ? 'года' : 'лет'));
      $('#cRateV').textContent = String(rate).replace('.', ',') + '% годовых';
      $('#cOut').textContent = '$' + fmt(pay);
    };
    [cDown, cYears, cRate].forEach(function (el) { el.addEventListener('input', calcRun); });
    calcRun();
  }

  /* ---------------- lightbox ---------------- */
  var lb = $('#lightbox'), lbImg = $('#lbImg'), idx = 0, lastFocus = null;
  $('#lbClose').innerHTML = U.icon.close; $('#lbPrev').innerHTML = U.icon.prev; $('#lbNext').innerHTML = U.icon.next;
  function show(i) {
    idx = (i + o.imgs.length) % o.imgs.length;
    lbImg.src = VR.img(o.imgs[idx], 2000);
    lbImg.alt = o.title + ', фото ' + (idx + 1);
    $('#lbCount').textContent = (idx + 1) + ' из ' + o.imgs.length;
  }
  function open(i) { lastFocus = document.activeElement; show(i); lb.classList.add('is-open'); document.body.style.overflow = 'hidden'; $('#lbClose').focus(); }
  function close() { lb.classList.remove('is-open'); document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  $$('[data-lb]').forEach(function (b) { b.addEventListener('click', function () { open(+b.dataset.lb); }); });
  $('#lbClose').addEventListener('click', close);
  $('#lbPrev').addEventListener('click', function () { show(idx - 1); });
  $('#lbNext').addEventListener('click', function () { show(idx + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lightbox__img')) close(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
  var sx = null;
  lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1));
  }, { passive: true });

  /* ---------------- similar ---------------- */
  var sim = VR.list.filter(function (x) { return x.id !== o.id && x.deal === o.deal; })
    .map(function (x) {
      var s = 0;
      if (x.type === o.type) s += 2;
      if (x.district === o.district) s += 2;
      s -= Math.abs(Math.log(x.price / o.price));
      return { x: x, s: s };
    })
    .sort(function (a, b) { return b.s - a.s; }).slice(0, 3).map(function (r) { return r.x; });
  if (sim.length) {
    $('#similar').innerHTML = sim.map(function (x) { return U.card(x); }).join('');
    $('#similarWrap').hidden = false;
    U.observeReveals($('#similar'));
  }

  if (location.hash === '#viewing') setTimeout(function () { var v = $('#viewing'); if (v) v.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 900);
})();
