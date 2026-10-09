/* Vital Realty — catalog.js: filters synced with the URL, favourites, sorting */
(function () {
  'use strict';
  var U = window.VRUI, $ = U.$, $$ = U.$$;

  var fType = $('#f-type'), fDis = $('#f-district'), fMax = $('#f-max'), fBeds = $('#f-beds'), fSort = $('#f-sort'), fFav = $('#f-fav');
  var grid = $('#grid'), title = $('#resultsTitle');

  VR.types.forEach(function (t) { fType.insertAdjacentHTML('beforeend', '<option>' + t + '</option>'); });
  VR.districts.forEach(function (d) { fDis.insertAdjacentHTML('beforeend', '<option value="' + d.key + '">' + d.name + '</option>'); });

  var BUDGET = {
    sale: [['', 'Любой'], ['400000', '$400 000'], ['700000', '$700 000'], ['1000000', '$1 млн'], ['2000000', '$2 млн']],
    rent: [['', 'Любой'], ['3000', '$3 000 / мес'], ['5000', '$5 000 / мес'], ['10000', '$10 000 / мес']]
  };

  var params = new URLSearchParams(location.search);
  var state = {
    deal: params.get('deal') === 'rent' ? 'rent' : 'sale',
    type: params.get('type') || '',
    district: params.get('district') || '',
    max: params.get('max') || '',
    beds: params.get('beds') || '',
    sort: params.get('sort') || 'new',
    fav: params.get('fav') === '1'
  };

  function fillBudget() {
    fMax.innerHTML = BUDGET[state.deal].map(function (b) { return '<option value="' + b[0] + '">' + b[1] + '</option>'; }).join('');
    if (!BUDGET[state.deal].some(function (b) { return b[0] === state.max; })) state.max = '';
    fMax.value = state.max;
  }

  function syncControls() {
    $$('[data-deal]').forEach(function (b) {
      var on = b.dataset.deal === state.deal;
      b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on);
    });
    fillBudget();
    fType.value = state.type; fDis.value = state.district; fBeds.value = state.beds; fSort.value = state.sort;
    fFav.setAttribute('aria-pressed', state.fav);
    fFav.classList.toggle('btn--solid', state.fav); fFav.classList.toggle('btn--line', !state.fav);
    var n = VR.favs().length;
    $('#favCount').textContent = n ? '(' + n + ')' : '';
  }

  function writeURL() {
    var q = new URLSearchParams();
    if (state.deal !== 'sale') q.set('deal', state.deal);
    ['type', 'district', 'max', 'beds'].forEach(function (k) { if (state[k]) q.set(k, state[k]); });
    if (state.sort !== 'new') q.set('sort', state.sort);
    if (state.fav) q.set('fav', '1');
    var s = q.toString();
    history.replaceState(null, '', location.pathname + (s ? '?' + s : ''));
  }

  function plural(n) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return 'объект';
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'объекта';
    return 'объектов';
  }

  function render() {
    var favs = VR.favs();
    var items = VR.list.filter(function (o) {
      if (state.fav) return favs.indexOf(o.id) > -1;
      if (o.deal !== state.deal) return false;
      if (state.type && o.type !== state.type) return false;
      if (state.district && o.district !== state.district) return false;
      if (state.max && o.price > +state.max) return false;
      if (state.beds && o.beds < +state.beds) return false;
      return true;
    });
    var s = state.sort;
    items.sort(function (a, b) {
      if (s === 'price-asc') return a.price - b.price;
      if (s === 'price-desc') return b.price - a.price;
      if (s === 'area-desc') return b.area - a.area;
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });

    var label = state.fav ? 'в избранном' : (state.deal === 'rent' ? 'в аренду' : 'на продажу');
    title.innerHTML = items.length + ' ' + plural(items.length) + ' <span>' + label + '</span>';

    if (!items.length) {
      grid.innerHTML = state.fav
        ? '<div class="empty"><p class="d3">В избранном пока пусто</p><p class="lead">Нажмите на сердце в карточке объекта, чтобы сохранить его здесь и сравнить позже.</p><button class="btn btn--line" type="button" id="emptyReset">Показать все объекты</button></div>'
        : '<div class="empty"><p class="d3">По этим условиям объектов нет</p><p class="lead">Попробуйте расширить бюджет или район. Или оставьте запрос: часть объектов продаётся закрыто и не попадает в каталог.</p><div style="display:flex;gap:12px;flex-wrap:wrap"><button class="btn btn--line" type="button" id="emptyReset">Сбросить фильтры</button><a class="btn btn--solid" href="contacts.html#request">Оставить запрос</a></div></div>';
      var r = $('#emptyReset');
      if (r) r.addEventListener('click', function () { state.type = state.district = state.max = state.beds = ''; state.fav = false; update(); });
      return;
    }
    grid.innerHTML = items.map(function (o) { return U.card(o); }).join('');
    U.observeReveals(grid);
  }

  function update() { syncControls(); writeURL(); render(); }

  $$('[data-deal]').forEach(function (b) {
    b.addEventListener('click', function () { state.deal = b.dataset.deal; state.fav = false; update(); });
  });
  fType.addEventListener('change', function () { state.type = fType.value; state.fav = false; update(); });
  fDis.addEventListener('change', function () { state.district = fDis.value; state.fav = false; update(); });
  fMax.addEventListener('change', function () { state.max = fMax.value; update(); });
  fBeds.addEventListener('change', function () { state.beds = fBeds.value; update(); });
  fSort.addEventListener('change', function () { state.sort = fSort.value; update(); });
  fFav.addEventListener('click', function () { state.fav = !state.fav; update(); });
  document.addEventListener('vr:fav', function () { syncControls(); if (state.fav) render(); });

  update();
})();
