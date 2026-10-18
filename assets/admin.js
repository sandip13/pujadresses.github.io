/* Pooja Dresses — owner panel (works fully on the owner's phone; data kept in the phone's storage) */
(function () {
  'use strict';
  const { ic, esc, fmt, pic, catById, typeById, collById, CATS, TYPES, COLLS, SIZE_GROUPS, FESTIVALS, ls } = PD;
  const $ = s => document.querySelector(s);
  const app = $('#app');
  const DAY = 86400000;

  const A = {
    items: [], settings: PD.mergeSettings({}), sel: new Set(),
    filt: { q: '', cat: 'all', out: false, nophoto: false, recent: false }, show: 40,
    draft: null, mode: 'add', editId: null, kp: 'price', err: {}, justSaved: null, confirmDel: false,
    bulk: null, bulkPct: 10, bulkDir: -1, bulkCat: null, bulkType: null, bulkColls: [], bulkCollMode: 'add', bulkConfirm: false,
    multi: null, pin: '', pinBad: false, flash: null
  };

  /* ---------- helpers ---------- */
  const bi = (hi, en, hs) => '<span class="hi"' + (hs ? ' style="font-size:' + hs + '"' : '') + '>' + hi + '</span><span class="en">' + en + '</span>';
  const byId = id => A.items.find(i => i.id === id);
  const typeName = it => it.typeName || (typeById(it.type) || {}).hi || '';
  const typeNameEn = it => it.typeName || (typeById(it.type) || {}).en || '';
  const catLine = it => { const c = catById(it.cat) || {}; const t = typeName(it); return (c.hi || '') + (t ? ' › ' + t : '') + ' · ' + (c.en || '') + (typeNameEn(it) ? ' › ' + typeNameEn(it) : ''); };
  function toast(kind, hi, en, ms) {
    const box = $('#toasts'); while (box.children.length >= 2) box.firstChild.remove();
    const el = document.createElement('div'); el.className = 'toast ' + kind;
    el.innerHTML = '<span class="tic">' + ic(kind === 'ok' ? 'check' : kind === 'err' ? 'alert' : 'info', 18, 'style="stroke-width:3"') + '</span><span style="flex:1"><b>' + hi + '</b><span class="sub">' + (en || '') + '</span></span>';
    box.appendChild(el); setTimeout(() => el.remove(), ms || 3500); return el;
  }
  let undoTimer = null;
  function undoBar(hi, en, onUndo) {
    clearUndo();
    const el = document.createElement('div'); el.className = 'undo'; el.setAttribute('role', 'status');
    let left = 10;
    el.innerHTML = '<span style="flex:1;line-height:1.2"><b style="display:block;font-size:.95rem">' + hi + '</b><span style="font-size:.78rem;opacity:.85" class="cd">' + en + ' · ' + left + ' sec</span></span><button>' + ic('undo', 20) + '<span style="line-height:1.1;text-align:left">वापस लाएँ<span style="display:block;font-size:.75rem;font-weight:500">Undo</span></span></button>';
    document.body.appendChild(el);
    el.querySelector('button').onclick = () => { clearUndo(); onUndo(); };
    undoTimer = setInterval(() => { left--; if (left <= 0) clearUndo(); else el.querySelector('.cd').textContent = en + ' · ' + left + ' sec'; }, 1000);
  }
  function clearUndo() { clearInterval(undoTimer); document.querySelectorAll('.undo').forEach(e => e.remove()); }
  async function persist(countChange) {
    await PD.kvSet('items', A.items); await PD.kvSet('settings', A.settings);
    ls.set('pd_owner_used', true); ls.set('pd_preview', true);
    if (countChange !== false) ls.set('pd_dirty', ls.get('pd_dirty', 0) + 1);
  }
  function download(name, text, type) {
    const blob = new Blob([text], { type: type || 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  const shopUrl = id => new URL('index.html' + (id ? '#/p/' + id : ''), location.href).href;
  const today = () => new Date().toISOString().slice(0, 10);
  function keepScroll(fn) { const y = window.scrollY; fn(); window.scrollTo(0, y); }

  /* ---------- load ---------- */
  async function load() {
    let items = await PD.kvGet('items'); let settings = await PD.kvGet('settings');
    if (!Array.isArray(items)) {
      const pub = await PD.loadPublished();
      items = pub.items || []; settings = Object.assign({}, pub.settings || {}, settings || {});
      A.items = items; A.settings = PD.mergeSettings(settings);
      await persist(false);
    } else { A.items = items; A.settings = PD.mergeSettings(settings); }
  }

  /* ---------- PIN ---------- */
  function viewPin() {
    $('#nav').innerHTML = ''; $('#bulk').innerHTML = '';
    let dots = ''; for (let i = 0; i < 4; i++) dots += '<i class="' + (i < A.pin.length ? 'f' : '') + '"></i>';
    let keys = ''; for (let i = 1; i <= 9; i++) keys += '<button data-act="pk" data-k="' + i + '">' + i + '</button>';
    app.innerHTML = '<div class="pin-wrap"><span class="logo" style="width:4rem;height:4rem;border-radius:1.25rem;font-size:2.1rem">पू</span>' +
      '<h1 style="margin:.9rem 0 0;text-align:center">' + bi('मालिक पैनल', 'Owner panel · ' + esc(A.settings.shopNameEn), '1.75rem') + '</h1>' +
      '<div style="margin-top:1.6rem;text-align:center">' + bi('अपना 4 अंकों का PIN डालें', 'Enter your 4-digit PIN', '1.2rem') + '</div>' +
      '<div class="dots4' + (A.pinBad ? ' bad' : '') + '" aria-label="' + A.pin.length + ' of 4 digits entered">' + dots + '</div>' +
      (A.pinBad ? '<div class="errbanner" role="alert" style="margin:0 0 1rem;width:100%"><span class="tic">' + ic('alert', 18, 'style="stroke-width:3"') + '</span><span><b>PIN मेल नहीं खाया — फिर से डालें</b><span class="sub" style="display:block;font-size:.8rem">That PIN didn’t match. Try again.</span></span></div>' : '') +
      '<div class="pinpad">' + keys + '<button class="del" data-act="pk" data-k="del">' + ic('backspace', 24) + '<span style="line-height:1">मिटाएँ</span><span class="en" style="line-height:1">Delete</span></button>' +
      '<button data-act="pk" data-k="0">0</button><button class="go" data-act="pk" data-k="go"><span>खोलें</span><span style="font-size:.75rem;font-family:Hind;font-weight:500">Open</span></button></div>' +
      '<div class="note sage" style="margin:auto 0 0;margin-top:1.5rem;width:100%">' + ic('lock', 24, 'style="color:var(--sage-d)"') + '<div>' + bi('PIN सिर्फ़ पैनल छुपाता है', 'The PIN only hides this panel from customers who pick up your phone. First PIN: 1234 — change it in Tools.', '.95rem') + '</div></div>' +
      '<button class="btn" style="margin-top:.6rem;border:0;background:transparent;color:var(--sage-d)" data-act="forgot">' + bi('PIN भूल गए?', 'Forgot PIN?', '.95rem') + '</button></div>';
  }
  function pinKey(k) {
    if (k === 'del') A.pin = A.pin.slice(0, -1);
    else if (k === 'go') return checkPin();
    else if (A.pin.length < 4) A.pin += k;
    A.pinBad = false;
    if (A.pin.length === 4) return checkPin();
    viewPin();
  }
  function checkPin() {
    if (A.pin === String(A.settings.pin || '1234')) { sessionStorage.setItem('pd_unlocked', '1'); A.pin = ''; route(); }
    else { A.pinBad = true; A.pin = ''; viewPin(); if (navigator.vibrate) navigator.vibrate(120); }
  }

  /* ---------- nav ---------- */
  function nav(cur) {
    const a = (href, icon, hi, en, on) => '<a href="' + href + '"' + (on ? ' aria-current="page"' : '') + '><span class="icw">' + ic(icon, 24) + '</span>' + bi(hi, en, '.88rem') + '</a>';
    $('#nav').innerHTML = '<nav class="onav" aria-label="पैनल / Panel"><div class="in">' + a('#/items', 'hanger', 'सामान', 'Items', cur === 'items') +
      '<a href="#/add"><span class="plus">' + ic('plus', 30, 'style="stroke-width:2.6"') + '</span>' + bi('जोड़ें', 'Add item', '.88rem') + '</a>' +
      a('#/tools', 'tools', 'टूल्स', 'Tools', cur === 'tools') + '</div></nav>';
  }

  /* ---------- items list ---------- */
  function filtered() {
    const f = A.filt; const q = PD.norm(f.q); const wk = Date.now() - 7 * DAY;
    return A.items.filter(it => {
      if (f.cat !== 'all' && it.cat !== f.cat) return false;
      if (f.out && it.inStock) return false;
      if (f.nophoto && it.photos && it.photos.length) return false;
      if (f.recent && !((it.createdAt || 0) > wk)) return false;
      if (q && PD.norm([it.name, it.nameEn, typeName(it), typeNameEn(it)].join(' ')).indexOf(q) < 0) return false;
      return true;
    }).sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
  }
  function row(it) {
    const on = !!it.inStock; const sel = A.sel.has(it.id);
    const hasPhoto = it.photos && it.photos.length;
    return '<div class="orow' + (sel ? ' sel' : '') + '"><div class="top1">' +
      '<label class="cbwrap"><input type="checkbox" data-sel="' + it.id + '"' + (sel ? ' checked' : '') + ' aria-label="चुनें · select ' + esc(it.nameEn || it.name) + '"></label>' +
      (hasPhoto ? '<img class="thumb" alt="" loading="lazy" src="' + it.photos[0] + '">' : '<button class="nophoto" data-act="edit" data-id="' + it.id + '" aria-label="फ़ोटो जोड़ें, add photo"><img alt="" src="' + PD.placeholderPic(it) + '"><span class="nph">+ फ़ोटो</span></button>') +
      '<div style="flex:1;min-width:0"><span class="hi" style="font-size:1rem">' + esc(it.name) + (it.isNew ? ' <span style="font-size:.7rem;background:var(--terra);color:var(--on-terra);padding:.05rem .35rem;border-radius:.35rem;vertical-align:middle">NEW</span>' : '') + '</span>' +
      '<span style="display:block;font-family:\'Baloo 2\';font-weight:700;font-size:1.2rem;line-height:1.2">' + fmt(it.price) + '</span><span class="en">' + esc(catLine(it)) + '</span></div>' +
      '<button class="sw" role="switch" aria-checked="' + on + '" data-act="stock" data-id="' + it.id + '" aria-label="स्टॉक में · In stock"><span class="tr"><span class="kn"></span></span><span class="lb">' + (on ? 'स्टॉक में<br>In stock' : 'ख़त्म<br>Sold out') + '</span></button></div>' +
      '<div class="acts"><button class="btn" data-act="edit" data-id="' + it.id + '">' + ic('edit', 20) + '<span>' + bi('बदलें', 'Edit') + '</span></button>' +
      '<button class="btn" data-act="similar" data-id="' + it.id + '">' + ic('copy', 20) + '<span>' + bi('ऐसा और', 'Similar') + '</span></button>' +
      '<button class="btn" data-act="share" data-id="' + it.id + '">' + ic('share', 20) + '<span>' + bi('भेजें', 'Share') + '</span></button></div></div>';
  }
  function viewItems() {
    const all = A.items; const wk = Date.now() - 7 * DAY;
    const nOut = all.filter(i => !i.inStock).length, nNo = all.filter(i => !(i.photos && i.photos.length)).length, nNew = all.filter(i => (i.createdAt || 0) > wk).length;
    const f = A.filt; const list = filtered();
    const flash = A.flash; A.flash = null;
    let html = '<header class="ohead"><h1>' + bi('सारा सामान', 'All items · Owner panel', '1.5rem') + '</h1>' +
      '<button class="pill-btn" data-act="lock">' + ic('lock', 20) + '<span>' + bi('बंद करें', 'Lock', '.85rem') + '</span></button></header>';
    if (flash) html += '<div class="okbanner" role="status"><span class="tic">' + ic('check', 18, 'style="stroke-width:3"') + '</span><span><b style="font-size:1.05rem">' + flash.hi + '</b><span style="display:block;font-size:.8rem">' + flash.en + '</span></span></div>';
    html += '<div class="stats">' +
      '<button class="stat" data-act="fstat" data-k="all" aria-pressed="' + (!f.out && !f.nophoto && !f.recent && f.cat === 'all' && !f.q) + '"><b>' + all.length + '</b><span>' + bi('कुल सामान', 'Total items', '.95rem') + '</span></button>' +
      '<button class="stat t" data-act="fstat" data-k="out" aria-pressed="' + f.out + '"><b>' + nOut + '</b><span>' + bi('स्टॉक ख़त्म', 'Out of stock', '.95rem') + '</span></button>' +
      '<button class="stat" data-act="fstat" data-k="nophoto" aria-pressed="' + f.nophoto + '"><b>' + nNo + '</b><span>' + bi('बिना फ़ोटो', 'No photo', '.95rem') + '</span></button>' +
      '<button class="stat s" data-act="fstat" data-k="recent" aria-pressed="' + f.recent + '"><b>' + nNew + '</b><span>' + bi('इस हफ़्ते नए', 'New this week', '.95rem') + '</span></button></div>' +
      '<form class="search" data-form="isearch" role="search" style="padding-right:1rem"><span class="muted" aria-hidden="true">' + ic('search', 22) + '</span><label class="sr" for="iq">सामान खोजें</label><input id="iq" type="search" value="' + esc(f.q) + '" placeholder="नाम से खोजें · Search by name" autocomplete="off"></form>' +
      '<div class="chips" role="group" aria-label="कैटेगरी"><button class="fchip" data-act="fcat" data-v="all" aria-pressed="' + (f.cat === 'all') + '">' + bi('सब', 'All') + '</button>' +
      CATS.map(c => '<button class="fchip" data-act="fcat" data-v="' + c.id + '" aria-pressed="' + (f.cat === c.id) + '">' + bi(c.hi, c.en.split(' ·')[0]) + '</button>').join('') + '</div>' +
      '<div class="chips"><button class="fchip" data-act="fout" aria-pressed="' + f.out + '">' + bi('स्टॉक ख़त्म (' + nOut + ')', 'Out of stock') + '</button><button class="fchip" data-act="fno" aria-pressed="' + f.nophoto + '">' + bi('बिना फ़ोटो (' + nNo + ')', 'No photo') + '</button></div>' +
      '<label class="check" style="padding:.25rem 1rem 0"><input type="checkbox" id="selall"' + (list.length && list.every(i => A.sel.has(i.id)) ? ' checked' : '') + '><span>' + bi('सब चुनें', 'Select all · ' + list.length + ' items', '1rem') + '</span></label>' +
      '<div class="olist" id="olist">' + (list.length ? list.slice(0, A.show).map(row).join('') : '<div class="empty">' + bi('कुछ नहीं मिला', 'No items match — change the filter', '1.05rem') + '</div>') + '</div>' +
      (list.length > A.show ? '<div class="more"><button class="btn" data-act="imore">' + bi('और दिखाएँ (' + (list.length - A.show) + ')', 'Show more') + '</button></div>' : '') +
      '<div style="height:' + (A.sel.size ? '22rem' : '1rem') + '"></div>';
    app.innerHTML = html;
    renderBulk();
  }

  /* ---------- bulk actions ---------- */
  function renderBulk() {
    const box = $('#bulk');
    if (!A.sel.size || location.hash.indexOf('#/items') !== 0 && location.hash !== '' && location.hash !== '#/') { box.innerHTML = ''; nav(curView()); return; }
    $('#nav').innerHTML = '';
    const n = A.sel.size; const b = A.bulk;
    const act = (k, icon, hi, en) => '<button class="act" data-act="bulk" data-k="' + k + '" aria-pressed="' + (b === k) + '">' + ic(icon, 24) + '<span>' + bi(hi, en, '.95rem') + '</span></button>';
    let sub = '';
    const selItems = A.items.filter(i => A.sel.has(i.id));
    if (b === 'price') {
      const prev = selItems.slice(0, 3).map(i => '<span style="white-space:nowrap"><s class="muted">' + fmt(i.price) + '</s> → <b>' + fmt(Math.round(i.price * (1 + A.bulkDir * A.bulkPct / 100))) + '</b></span>').join(' · ');
      sub = '<div class="subpanel"><div class="seg" style="grid-template-columns:1fr 1fr"><button data-act="bdir" data-v="-1" aria-pressed="' + (A.bulkDir < 0) + '">− घटाएँ · Lower</button><button data-act="bdir" data-v="1" aria-pressed="' + (A.bulkDir > 0) + '">+ बढ़ाएँ · Raise</button></div>' +
        '<div class="row">' + [5, 10, 15, 20].map(p => '<button class="pchip" data-act="bpct" data-v="' + p + '" aria-pressed="' + (A.bulkPct === p) + '">' + p + '%</button>').join('') + '</div>' +
        '<label class="row" style="gap:.5rem"><span class="en" style="font-size:.85rem">अपना % · Own %</span><input type="number" inputmode="numeric" min="1" max="90" id="bpctin" class="fld" style="height:3rem;max-width:6rem" value="' + ([5, 10, 15, 20].indexOf(A.bulkPct) < 0 ? A.bulkPct : '') + '"></label>' +
        '<div style="font-size:.95rem">' + '<span class="en" style="font-size:.82rem">नया दाम ऐसा होगा · New prices will be</span>' + prev + (n > 3 ? ' …' : '') + '</div>' +
        '<button class="btn primary block" data-act="bapply" data-k="price">' + bi(n + ' सामान का दाम ' + A.bulkPct + '% ' + (A.bulkDir < 0 ? 'घटाएँ' : 'बढ़ाएँ'), (A.bulkDir < 0 ? 'Lower' : 'Raise') + ' price of ' + n + ' items by ' + A.bulkPct + '%', '1.05rem') + '</button></div>';
    } else if (b === 'cat') {
      sub = '<div class="subpanel"><span>' + bi('किस कैटेगरी में ले जाएँ?', 'Move to which category?', '1rem') + '</span><div class="ctiles">' +
        CATS.map(c => '<button class="ctile" data-act="bcat" data-v="' + c.id + '" aria-pressed="' + (A.bulkCat === c.id) + '">' + bi(c.hi, c.en.split(' ·')[0], '.95rem') + '</button>').join('') + '</div>' +
        '<button class="btn primary block" data-act="bapply" data-k="cat"' + (A.bulkCat ? '' : ' disabled') + '>' + bi(A.bulkCat ? n + ' सामान “' + catById(A.bulkCat).hi + '” में ले जाएँ' : 'पहले कैटेगरी चुनें', A.bulkCat ? 'Move ' + n + ' items' : 'Choose a category first', '1.05rem') + '</button></div>';
    } else if (b === 'type') {
      const cats = [...new Set(selItems.map(i => i.cat))];
      const types = TYPES.filter(t => cats.indexOf(t.cat) >= 0);
      sub = '<div class="subpanel"><span>' + bi('कौन सा टाइप लगाएँ?', 'Which type?', '1rem') + '</span><div class="zchips">' +
        types.map(t => '<button class="z" data-act="btype" data-v="' + t.id + '" aria-pressed="' + (A.bulkType === t.id) + '">' + t.hi + '</button>').join('') + '</div>' +
        '<button class="btn primary block" data-act="bapply" data-k="type"' + (A.bulkType ? '' : ' disabled') + '>' + bi(A.bulkType ? n + ' सामान पर “' + typeById(A.bulkType).hi + '” लगाएँ' : 'पहले टाइप चुनें', A.bulkType ? 'Set type on ' + n + ' items' : 'Choose a type first', '1.05rem') + '</button></div>';
    } else if (b === 'coll') {
      sub = '<div class="subpanel"><div class="seg" style="grid-template-columns:1fr 1fr"><button data-act="bcollmode" data-v="add" aria-pressed="' + (A.bulkCollMode === 'add') + '">कलेक्शन में डालें · Add</button><button data-act="bcollmode" data-v="remove" aria-pressed="' + (A.bulkCollMode === 'remove') + '">निकालें · Remove</button></div>' +
        COLLS.filter(c => c.id !== 'new').map(c => '<label class="tick"><input type="checkbox" data-bcoll="' + c.id + '"' + (A.bulkColls.indexOf(c.id) >= 0 ? ' checked' : '') + '><span>' + bi(c.hi, c.en, '1rem') + '</span></label>').join('') +
        '<label class="tick"><input type="checkbox" data-bcoll="new"' + (A.bulkColls.indexOf('new') >= 0 ? ' checked' : '') + '><span>' + bi('नया टैग (NEW)', 'NEW tag', '1rem') + '</span></label>' +
        '<button class="btn primary block" data-act="bapply" data-k="coll"' + (A.bulkColls.length ? '' : ' disabled') + '>' + bi(A.bulkCollMode === 'add' ? n + ' सामान डालें' : n + ' सामान निकालें', A.bulkCollMode === 'add' ? 'Add ' + n + ' items' : 'Remove ' + n + ' items', '1.05rem') + '</button></div>';
    } else if (b === 'del') {
      sub = '<div class="subpanel" style="background:var(--err-t)" role="alertdialog"><span>' + bi('पक्का ' + n + ' सामान हटाएँ?', 'Delete ' + n + ' items for sure? You can undo for 10 seconds.', '1.1rem') + '</span>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem"><button class="btn" data-act="bulk" data-k="del">' + bi('नहीं, रहने दें', 'Keep them', '.95rem') + '</button><button class="btn danger-fill" data-act="bapply" data-k="del">' + bi('हाँ, हटाएँ', 'Yes, delete', '.95rem') + '</button></div></div>';
    }
    box.innerHTML = '<div class="bulk"><section class="sheet" aria-label="चुने हुए सामान"><span class="handle"></span>' +
      '<div class="row" style="justify-content:space-between;margin-bottom:.6rem"><span>' + bi('इन ' + n + ' सामान का क्या करें?', n + ' selected — what to do?', '1.15rem') + '</span>' +
      '<button class="btn" style="min-height:2.9rem" data-act="bclear">' + ic('x', 20) + '<span>' + bi('रद्द', 'Cancel', '.85rem') + '</span></button></div>' +
      '<div class="actgrid">' + act('out', 'boxoff', 'स्टॉक ख़त्म', 'Out of stock') + act('in', 'box', 'स्टॉक में', 'In stock') + act('price', 'percent', 'दाम ± %', 'Change price') +
      act('cat', 'folder', 'कैटेगरी बदलें', 'Move category') + act('type', 'tag', 'टाइप लगाएँ', 'Set type') + act('coll', 'star', 'कलेक्शन', 'Add to collection') + '</div>' +
      (sub ? '<div style="margin-top:.6rem">' + sub + '</div>' : '') +
      (b === 'del' ? '' : '<button class="btn danger block" style="margin-top:.6rem" data-act="bulk" data-k="del">' + ic('trash', 22) + '<span>' + bi(n + ' सामान हटाएँ', 'Delete · undo for 10 seconds', '1rem') + '</span></button>') +
      '</section></div>';
  }
  async function bulkApply(k) {
    const ids = [...A.sel]; const sel = A.items.filter(i => A.sel.has(i.id)); const n = sel.length; const now = Date.now();
    if (k === 'del') {
      const backup = A.items.slice();
      A.items = A.items.filter(i => !A.sel.has(i.id)); A.sel.clear(); A.bulk = null;
      await persist(); viewItems();
      undoBar(n + ' सामान हटाए', n + ' items deleted', async () => { A.items = backup; await persist(); viewItems(); toast('ok', 'वापस आ गए ✓', 'Items restored'); });
      return;
    }
    if (k === 'out' || k === 'in') sel.forEach(i => { i.inStock = k === 'in'; i.updatedAt = now; });
    if (k === 'price') sel.forEach(i => { i.price = Math.max(1, Math.round(i.price * (1 + A.bulkDir * A.bulkPct / 100))); i.updatedAt = now; });
    if (k === 'cat') sel.forEach(i => { i.cat = A.bulkCat; const t = typeById(i.type); if (t && t.cat !== A.bulkCat) { i.type = ''; } i.updatedAt = now; });
    if (k === 'type') sel.forEach(i => { i.type = A.bulkType; i.typeName = ''; i.updatedAt = now; });
    if (k === 'coll') sel.forEach(i => {
      A.bulkColls.forEach(c => {
        if (c === 'new') { i.isNew = A.bulkCollMode === 'add'; return; }
        i.colls = i.colls || [];
        if (A.bulkCollMode === 'add') { if (i.colls.indexOf(c) < 0) i.colls.push(c); } else i.colls = i.colls.filter(x => x !== c);
      }); i.updatedAt = now;
    });
    const msg = {
      out: [n + ' सामान स्टॉक ख़त्म ✓', n + ' items marked sold out'], in: [n + ' सामान स्टॉक में हो गए ✓', n + ' items marked in stock'],
      price: [n + ' सामान का दाम ' + A.bulkPct + '% ' + (A.bulkDir < 0 ? 'घटा' : 'बढ़ा') + ' दिया ✓', 'Prices changed for ' + n + ' items'],
      cat: [n + ' सामान “' + (catById(A.bulkCat) || {}).hi + '” में चले गए ✓', 'Moved ' + n + ' items'],
      type: [n + ' सामान पर टाइप लग गया ✓', 'Type set on ' + n + ' items'],
      coll: [n + ' सामान ' + (A.bulkCollMode === 'add' ? 'कलेक्शन में डाले' : 'कलेक्शन से निकाले') + ' ✓', 'Collections updated for ' + n + ' items']
    }[k];
    await persist();
    A.sel.clear(); A.bulk = null; A.bulkCat = null; A.bulkType = null; A.bulkColls = []; A.flash = { hi: msg[0], en: msg[1] };
    void ids; viewItems(); window.scrollTo(0, 0);
  }

  /* ---------- add / edit form ---------- */
  function blankDraft() { return { photos: [], name: '', nameEn: '', price: '', mrp: '', cat: '', type: '', typeName: '', sizes: [], colls: [], inStock: true, isNew: true, colorId: '', rgb: null, hash: '' }; }
  function draftFrom(it, keepPhotos) {
    return { photos: keepPhotos ? (it.photos || []).slice() : [], name: it.name || '', nameEn: it.nameEn || '', price: String(it.price || ''), mrp: it.mrp ? String(it.mrp) : '', cat: it.cat || '', type: it.type || '', typeName: it.typeName || '',
      sizes: (it.sizes || []).slice(), colls: (it.colls || []).slice(), inStock: it.inStock !== false, isNew: keepPhotos ? !!it.isNew : true, colorId: keepPhotos ? it.colorId : '', rgb: keepPhotos ? it.rgb : null, hash: keepPhotos ? it.hash : '' };
  }
  function viewForm() {
    const d = A.draft; const e = A.err; const edit = A.mode === 'edit';
    const off = (+d.mrp > +d.price && +d.price > 0) ? Math.round((1 - d.price / d.mrp) * 100) : 0;
    let html = '<header class="ohead"><a class="btn" style="border:0;background:transparent;padding:0 .4rem" href="#/items">' + ic(edit ? 'back' : 'x', 24) + '<span>' + bi(edit ? 'वापस' : 'बंद', edit ? 'Back' : 'Close', '.85rem') + '</span></a>' +
      '<h1 style="flex:1">' + bi(edit ? 'सामान बदलें' : 'नया सामान', edit ? 'Edit item' : 'Add new item', '1.5rem') + '</h1></header>';
    if (A.justSaved) html += '<div class="okbanner" role="status"><span class="tic">' + ic('check', 18, 'style="stroke-width:3"') + '</span><span><b style="font-size:1.05rem">सेव हो गया ✓</b><span style="display:block;font-size:.82rem">“' + esc(A.justSaved) + '” दुकान में है। बाकी सब भरा है — बस नई फ़ोटो लें · Saved. Just take the new photo.</span></span></div>';
    if (Object.keys(e).length) html += '<div class="errbanner" role="alert"><span class="tic">' + ic('alert', 18, 'style="stroke-width:3"') + '</span><span><b style="font-size:1.02rem">' + (Object.keys(e).length === 1 ? 'बस एक चीज़ बाकी है' : 'कुछ चीज़ें बाकी हैं') + '</b><span style="display:block;font-size:.82rem">' + Object.values(e).map(x => x[0]).join(' · ') + '</span></span></div>';
    // photos
    html += '<section class="osec"><span class="otitle">' + bi('1. फ़ोटो', 'Photo first', '1.08rem') + '</span><div class="bigpick">' +
      '<button class="cam" data-act="cam">' + ic('camera', 44, 'style="stroke-width:1.8"') + bi('फ़ोटो खींचें', 'Take photo', '1.2rem') + '</button>' +
      '<button class="gal" data-act="gal">' + ic('gallery', 44, 'style="stroke-width:1.8"') + '<span class="hi" style="font-size:1.2rem;color:var(--ink)">गैलरी</span><span class="en">Gallery · many at once</span></button></div>' +
      (d.photos.length ? '<div class="thumbs">' + d.photos.map((p, i) => '<div class="t"><img alt="फ़ोटो ' + (i + 1) + '" src="' + p + '">' + (i === 0 ? '<span class="main">मुख्य · Main</span>' : '<button class="rm" style="left:.25rem;right:auto;top:auto;bottom:.25rem" data-act="mainph" data-i="' + i + '">मुख्य बनाएँ</button>') + '<button class="rm" data-act="rmph" data-i="' + i + '" aria-label="फ़ोटो हटाएँ, remove photo">× हटाएँ</button></div>').join('') + '</div>' : '') + '</section>';
    // name
    html += '<section class="osec"><label for="f_name" class="otitle">' + bi('2. नाम', 'Item name', '1.08rem') + '</label><input id="f_name" class="fld' + (e.name ? ' bad' : '') + '" data-f="name" value="' + esc(d.name) + '" placeholder="जैसे: नीली सूती कमीज़" style="font-size:1.15rem">' +
      (e.name ? '<span class="ferr">' + e.name[0] + '<span class="en">' + e.name[1] + '</span></span>' : '') +
      '<label for="f_nameEn" class="lab" style="margin-top:.6rem"><span class="en" style="font-size:.85rem">अंग्रेज़ी नाम (चाहें तो) · English name (optional)</span></label><input id="f_nameEn" class="fld" style="height:3rem;font-size:1rem" data-f="nameEn" value="' + esc(d.nameEn) + '"></section>';
    // price + keypad
    html += '<section class="osec"><label for="f_price" class="otitle">' + bi('3. दाम', 'Selling price', '1.08rem') + '</label>' +
      '<div class="pricebox' + (A.kp === 'price' ? ' active' : '') + (e.price ? ' bad' : '') + '"><span>₹</span><input id="f_price" data-f="price" data-kp="price" inputmode="none" autocomplete="off" value="' + esc(d.price) + '" placeholder="0"></div>' +
      (e.price ? '<span class="ferr">' + e.price[0] + '<span class="en">' + e.price[1] + '</span></span>' : '') +
      '<div class="keypad" aria-label="नंबर कीपैड">' + ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0'].map(k => '<button type="button" data-act="kp" data-k="' + k + '">' + k + '</button>').join('') +
      '<button type="button" class="sm" data-act="kp" data-k="del" aria-label="मिटाएँ, delete">' + ic('backspace', 22) + 'मिटाएँ</button></div>' +
      '<div class="row" style="align-items:flex-end;gap:.75rem;margin-top:.75rem"><div style="flex:0 0 48%"><label for="f_mrp" class="lab">' + bi('MRP (छपा दाम)', 'Printed price — optional', '.95rem') + '</label>' +
      '<div class="pricebox small' + (A.kp === 'mrp' ? ' active' : '') + '"><span>₹</span><input id="f_mrp" data-f="mrp" data-kp="mrp" inputmode="none" autocomplete="off" value="' + esc(d.mrp) + '"></div></div>' +
      '<span id="offbadge" style="flex:1;padding:.5rem .65rem;border-radius:.75rem;background:var(--terra-t);color:var(--terra-d);font-weight:700;font-size:.95rem;line-height:1.2' + (off ? '' : ';visibility:hidden') + '">' + off + '% छूट दिखेगी<span style="display:block;font-size:.75rem;font-weight:500">Shows ' + off + '% off</span></span></div></section>';
    // category
    html += '<section class="osec"><span class="otitle">' + bi('4. कैटेगरी', 'Category', '1.08rem') + '</span><div class="ctiles">' +
      CATS.map(c => '<button type="button" class="ctile" data-act="fcatpick" data-v="' + c.id + '" aria-pressed="' + (d.cat === c.id) + '"' + (e.cat ? ' style="border-color:var(--err)"' : '') + '><span class="bub ' + c.tint + '" style="width:2rem;height:2rem;border-radius:1rem;display:flex;align-items:center;justify-content:center">' + ic(c.icon, 18) + '</span>' + bi(c.hi, c.en.split(' ·')[0], '.95rem') + '</button>').join('') + '</div>' +
      (e.cat ? '<span class="ferr">' + e.cat[0] + '<span class="en">' + e.cat[1] + '</span></span>' : '') + '</section>';
    if (d.cat) {
      const types = TYPES.filter(t => t.cat === d.cat);
      html += '<section class="osec"><span class="otitle">' + bi('5. टाइप', 'Type (inside ' + catById(d.cat).en.split(' ·')[0] + ')', '1.08rem') + '</span><div class="zchips">' +
        types.map(t => '<button type="button" class="z" data-act="ftype" data-v="' + t.id + '" aria-pressed="' + (d.type === t.id && !d.typeName) + '">' + t.hi + '</button>').join('') +
        '<button type="button" class="z dash" data-act="ftypenew" aria-pressed="' + (!!d.typeName) + '">+ नया · New</button></div>' +
        (d.typeName || A.typeNew ? '<input class="fld" style="margin-top:.5rem;height:3rem" data-f="typeName" placeholder="नया टाइप लिखें · e.g. शेरवानी" value="' + esc(d.typeName) + '">' : '') + '</section>';
    }
    // sizes
    html += '<section class="osec"><span class="otitle">' + bi('6. साइज़ — जो हैं उन पर दबाएँ', 'Sizes — tap all that you have', '1.08rem') + '</span>' +
      SIZE_GROUPS.map(g => '<span class="en" style="margin:.5rem 0 .3rem">' + g.hi + ' · ' + g.en + '</span><div class="zchips">' +
        g.sizes.map(s => '<button type="button" class="z" data-act="fsize" data-v="' + s + '" aria-pressed="' + (d.sizes.indexOf(s) >= 0) + '">' + (s === 'Free' ? 'फ़्री साइज़ · Free' : s) + '</button>').join('') + '</div>').join('') + '</section>';
    // collections
    html += '<section class="osec"><span class="otitle">' + bi('7. कलेक्शन', 'Show in collections', '1.08rem') + '</span><div style="display:flex;flex-direction:column;gap:.5rem">' +
      COLLS.filter(c => c.id !== 'new').map(c => '<label class="tick"><input type="checkbox" data-fcoll="' + c.id + '"' + (d.colls.indexOf(c.id) >= 0 ? ' checked' : '') + '><span>' + bi(c.hi, c.en, '1rem') + '</span></label>').join('') + '</div></section>';
    // toggles
    const tg = (k, hi, en, badge) => '<div class="togrow"><span class="row" style="gap:.6rem">' + (badge || '') + '<span>' + bi(hi, en, '1rem') + '</span></span><button type="button" class="sw" role="switch" aria-checked="' + !!d[k] + '" data-act="ftog" data-k="' + k + '" aria-label="' + en + '"><span class="tr"><span class="kn"></span></span></button></div>';
    html += '<section class="osec" style="display:flex;flex-direction:column;gap:.5rem">' + tg('inStock', 'स्टॉक में है', 'In stock') + tg('isNew', 'नया टैग लगाएँ', 'Show NEW tag', '<span style="background:var(--terra);color:var(--on-terra);font-weight:800;font-size:.72rem;padding:.15rem .45rem;border-radius:.45rem">NEW</span>') + '</section>';
    if (edit) {
      html += '<section class="osec" style="margin-top:1.75rem;border-top:1px dashed var(--line);padding-top:1.25rem">' +
        (A.confirmDel
          ? '<div class="subpanel" style="background:var(--err-t)" role="alertdialog"><div class="row" style="align-items:flex-start;gap:.6rem">' + ic('trash', 26, 'style="color:var(--err)"') + '<span>' + bi('पक्का हटाना है?', 'Delete for sure? It leaves the shop. You can undo for 10 seconds.', '1.15rem') + '</span></div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem"><button class="btn" data-act="delno">' + bi('नहीं, रहने दें', 'Keep it', '.95rem') + '</button><button class="btn danger-fill" data-act="delyes">' + bi('हाँ, हटाएँ', 'Yes, delete', '.95rem') + '</button></div></div>'
          : '<button class="btn danger block" data-act="delask">' + ic('trash', 22) + '<span>' + bi('यह सामान हटाएँ', 'Delete this item', '1rem') + '</span></button>') + '</section>';
    }
    html += '<div class="savebar"><button class="btn primary block big" data-act="save">' + ic('check', 26, 'style="stroke-width:2.6"') + '<span>' + bi(edit ? 'बदलाव सेव करें' : 'सेव करें', edit ? 'Save changes' : 'Save', '1.25rem') + '</span></button>' +
      (edit ? '' : '<button class="btn block" style="border:2px solid var(--sage)" data-act="savesim">' + ic('copy', 22, 'style="color:var(--sage-d)"') + '<span>' + bi('सेव करके ऐसा ही और जोड़ें', 'Save and add similar', '1rem') + '</span></button>') + '</div>';
    app.innerHTML = html;
  }
  function updateOff() {
    const d = A.draft; const b = $('#offbadge'); if (!b) return;
    const off = (+d.mrp > +d.price && +d.price > 0) ? Math.round((1 - d.price / d.mrp) * 100) : 0;
    b.style.visibility = off ? 'visible' : 'hidden';
    b.innerHTML = off + '% छूट दिखेगी<span style="display:block;font-size:.75rem;font-weight:500">Shows ' + off + '% off</span>';
  }
  function validate(d) {
    const e = {};
    if (!d.name.trim()) e.name = ['नाम लिखना रह गया', 'Please write the item name'];
    if (!(+d.price > 0)) e.price = ['दाम लिखना रह गया — ऊपर के बटन से लिखें', 'Price is missing — type it with the keys'];
    if (!d.cat) e.cat = ['कैटेगरी चुनें', 'Choose a category'];
    return e;
  }
  async function saveDraft(similar) {
    const d = A.draft; A.err = validate(d);
    if (Object.keys(A.err).length) { A.justSaved = null; viewForm(); window.scrollTo(0, 0); return; }
    const now = Date.now();
    let colorId = d.colorId;
    if (!colorId) { const pq = PD.parseQuery(d.name + ' ' + d.nameEn); colorId = pq.colors[0] || ''; }
    const base = { name: d.name.trim(), nameEn: d.nameEn.trim(), price: Math.round(+d.price), mrp: Math.round(+d.mrp) || 0, cat: d.cat, type: d.type, typeName: d.typeName.trim(),
      sizes: d.sizes, colls: d.colls, inStock: d.inStock, isNew: d.isNew, photos: d.photos, colorId, rgb: d.rgb, hash: d.hash, updatedAt: now };
    let saved;
    if (A.mode === 'edit') { saved = byId(A.editId); Object.assign(saved, base); }
    else { saved = Object.assign({ id: PD.uid(), createdAt: now }, base); A.items.unshift(saved); }
    try { await persist(); } catch (err) { toast('err', 'फ़ोन में जगह कम है — सेव नहीं हुआ', 'Phone storage is full — remove some photos'); return; }
    if (similar) {
      A.justSaved = saved.name; A.err = {};
      A.draft = Object.assign(draftFrom(saved, false), { name: saved.name });
      viewForm(); window.scrollTo(0, 0);
    } else {
      A.flash = { hi: 'सेव हो गया ✓', en: '“' + saved.name + '” ' + (A.mode === 'edit' ? 'updated' : 'is now in your shop list') };
      A.justSaved = null; location.hash = '#/items';
    }
  }

  async function addPhotos(files) {
    const t = toast('info', 'फ़ोटो तैयार हो रही है…', 'Preparing photo…', 15000);
    try {
      for (const f of files) {
        const src = await PD.compressPhoto(f, 720, 0.72);
        if (!A.draft.photos.length) { const sig = await PD.analyseImage(src); A.draft.colorId = sig.colorId; A.draft.rgb = sig.rgb; A.draft.hash = sig.hash; }
        A.draft.photos.push(src);
      }
      t.remove(); A.justSaved = null; delete A.err.photo; keepScroll(viewForm);
    } catch (e) { t.remove(); toast('err', 'यह फ़ोटो खुल नहीं पाई', 'Couldn’t open this photo — try another'); }
  }
  async function startMulti(files) {
    const t = toast('info', files.length + ' फ़ोटो तैयार हो रही हैं…', 'Preparing photos…', 30000);
    const rows = [];
    for (const f of files) { try { const src = await PD.compressPhoto(f, 720, 0.72); const sig = await PD.analyseImage(src); rows.push({ src, sig, name: '', price: '' }); } catch (e) { /* skip unreadable */ } }
    t.remove();
    A.multi = { rows, cat: A.draft && A.draft.cat || '', type: A.draft && A.draft.type || '', sizes: (A.draft && A.draft.sizes) || [], tried: false };
    location.hash = '#/multi';
  }
  function chooseGalleryMode(files) {
    const sc = document.createElement('div'); sc.className = 'scrim';
    sc.innerHTML = '<div class="sheet" role="dialog"><span class="handle"></span>' + bi(files.length + ' फ़ोटो चुनीं', files.length + ' photos picked', '1.2rem') +
      '<div style="display:flex;flex-direction:column;gap:.6rem;margin-top:.9rem"><button class="btn primary block" id="gm_multi" style="min-height:4rem">' + bi('हर फ़ोटो अलग सामान है', 'Each photo is a different item', '1.05rem') + '</button>' +
      '<button class="btn block" id="gm_one" style="min-height:4rem">' + bi('सब एक ही सामान की फ़ोटो हैं', 'All photos are of one item', '1.05rem') + '</button>' +
      '<button class="btn block" id="gm_x" style="border:0">' + bi('रद्द', 'Cancel', '.95rem') + '</button></div></div>';
    document.body.appendChild(sc);
    sc.querySelector('#gm_multi').onclick = () => { sc.remove(); startMulti(files); };
    sc.querySelector('#gm_one').onclick = () => { sc.remove(); addPhotos(files); };
    sc.querySelector('#gm_x').onclick = () => sc.remove();
  }

  /* ---------- multi-photo add ---------- */
  function viewMulti() {
    const m = A.multi;
    if (!m || !m.rows.length) { location.hash = '#/add'; return; }
    const missing = m.rows.filter(r => !(+r.price > 0)).length;
    let html = '<header class="ohead"><a class="btn" style="border:0;background:transparent;padding:0 .4rem" href="#/add">' + ic('back', 24) + '<span>' + bi('वापस', 'Back', '.85rem') + '</span></a><h1 style="flex:1">' + bi(m.rows.length + ' फ़ोटो चुनीं', m.rows.length + ' photos · add them together', '1.45rem') + '</h1></header>';
    html += '<section class="ocard sage"><span>' + bi('सब पर एक साथ लगाएँ', 'Apply to all ' + m.rows.length, '1.08rem') + '</span>' +
      '<div><span class="en" style="margin-bottom:.35rem">कैटेगरी · Category</span><div class="zchips">' + CATS.map(c => '<button class="z" data-act="mcat" data-v="' + c.id + '" aria-pressed="' + (m.cat === c.id) + '">' + c.hi + '</button>').join('') + '</div>' + (m.tried && !m.cat ? '<span class="ferr">कैटेगरी चुनें<span class="en">Choose a category</span></span>' : '') + '</div>' +
      (m.cat ? '<div><span class="en" style="margin-bottom:.35rem">टाइप · Type</span><div class="zchips">' + TYPES.filter(t => t.cat === m.cat).map(t => '<button class="z" data-act="mtype" data-v="' + t.id + '" aria-pressed="' + (m.type === t.id) + '">' + t.hi + '</button>').join('') + '</div></div>' : '') +
      '<div><span class="en" style="margin-bottom:.35rem">साइज़ · Sizes</span><div class="zchips">' + SIZE_GROUPS.map(g => g.sizes.map(s => '<button class="z" data-act="msize" data-v="' + s + '" aria-pressed="' + (m.sizes.indexOf(s) >= 0) + '">' + (s === 'Free' ? 'फ़्री' : s) + '</button>').join('')).join('') + '</div></div></section>';
    html += '<div class="osec"><span class="otitle">' + bi('हर फ़ोटो का नाम और दाम', 'Name and price for each photo', '1.08rem') + '</span><div style="display:flex;flex-direction:column;gap:.6rem">' +
      m.rows.map((r, i) => {
        const bad = m.tried && !(+r.price > 0);
        return '<div class="mrow' + (bad ? ' bad' : '') + '"><div style="display:flex;flex-direction:column;gap:.35rem;flex:none"><img alt="फ़ोटो ' + (i + 1) + '" src="' + r.src + '"><button class="btn" style="min-height:2.6rem;padding:0 .4rem;font-size:.8rem" data-act="mrm" data-i="' + i + '">हटाएँ · Remove</button></div>' +
          '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:.45rem"><label style="font-size:.82rem;font-weight:600">नाम · Name<input class="fld" style="height:3.1rem;margin-top:.15rem;font-size:1rem" data-m="name" data-i="' + i + '" value="' + esc(r.name) + '" placeholder="जैसे: ' + (m.type ? typeById(m.type).hi : 'कुर्ती') + ' — ' + PD.colorById(r.sig.colorId).hi + '"></label>' +
          '<label style="font-size:.82rem;font-weight:600">दाम · Price<div class="prefix' + (bad ? ' bad' : '') + '" style="height:3.1rem;margin-top:.15rem"><span>₹</span><input inputmode="numeric" data-m="price" data-i="' + i + '" value="' + esc(r.price) + '"></div></label>' +
          (bad ? '<span class="ferr" style="margin:0">दाम भरना बाकी है<span class="en">Please add a price</span></span>' : '') + '</div></div>';
      }).join('') + '</div></div>';
    const ready = m.rows.length - missing;
    html += '<div class="savebar">' + (m.tried && missing ? '<span class="ferr" style="text-align:center;margin:0">' + missing + ' फ़ोटो में दाम बाकी है — उन्हें छोड़कर ' + ready + ' सेव होंगे<span class="en">' + missing + ' need a price — the other ' + ready + ' will be saved</span></span>' : '') +
      '<button class="btn primary block big" data-act="msave">' + ic('check', 26, 'style="stroke-width:2.6"') + '<span>' + bi(m.tried && missing ? ready + ' तैयार सामान सेव करें' : 'सब सेव करें', m.tried && missing ? 'Save the ' + ready + ' ready items' : 'Save all', '1.2rem') + '</span></button></div>';
    app.innerHTML = html;
  }
  async function multiSave() {
    const m = A.multi;
    if (!m.cat) { m.tried = true; keepScroll(viewMulti); toast('err', 'पहले कैटेगरी चुनें', 'Choose a category for all photos'); return; }
    const missing = m.rows.filter(r => !(+r.price > 0));
    if (missing.length && !m.tried) { m.tried = true; keepScroll(viewMulti); toast('err', missing.length + ' फ़ोटो में दाम बाकी है', 'Add prices, or tap save again to save the rest'); return; }
    const ready = m.rows.filter(r => +r.price > 0);
    if (!ready.length) { toast('err', 'किसी में दाम नहीं है', 'No item has a price yet'); return; }
    const now = Date.now(); const T = typeById(m.type);
    ready.forEach((r, k) => {
      const col = PD.colorById(r.sig.colorId);
      A.items.unshift({ id: PD.uid(), createdAt: now + k, updatedAt: now + k, name: r.name.trim() || ((T ? T.hi : catById(m.cat).hi) + ' — ' + col.hi), nameEn: r.name.trim() ? '' : (col.en + ' ' + (T ? T.en : '')).trim(),
        price: Math.round(+r.price), mrp: 0, cat: m.cat, type: m.type, typeName: '', sizes: m.sizes.slice(), colls: [], inStock: true, isNew: true, photos: [r.src], colorId: r.sig.colorId, rgb: r.sig.rgb, hash: r.sig.hash });
    });
    await persist();
    A.multi = missing.length ? Object.assign(m, { rows: missing, tried: false }) : null;
    A.flash = { hi: ready.length + ' सामान सेव हो गए ✓', en: ready.length + ' items saved' + (missing.length ? ' · ' + missing.length + ' still need a price' : '') };
    if (A.multi) { keepScroll(viewMulti); toast('ok', ready.length + ' सामान सेव हो गए ✓', 'Now add prices for the remaining ' + missing.length); }
    else location.hash = '#/items';
  }

  /* ---------- tools ---------- */
  function viewTools() {
    const st = A.settings; const dirty = ls.get('pd_dirty', 0); const sale = st.sale; const fest = st.festival;
    const flash = A.flash; A.flash = null;
    let html = '<header class="ohead"><h1>' + bi('टूल्स', 'Tools & settings', '1.5rem') + '</h1><a class="pill-btn" href="index.html" target="_blank" rel="noopener">' + ic('shop', 20) + '<span>' + bi('दुकान देखें', 'View shop', '.85rem') + '</span></a></header>';
    if (flash) html += '<div class="okbanner" role="status"><span class="tic">' + ic('check', 18, 'style="stroke-width:3"') + '</span><span><b style="font-size:1.05rem">' + flash.hi + '</b><span style="display:block;font-size:.8rem">' + flash.en + '</span></span></div>';
    // publish
    html += '<section class="ocard sage"><div class="row" style="gap:.65rem"><span style="min-width:2.5rem;height:2.5rem;border-radius:1.25rem;background:' + (dirty ? 'var(--terra)' : 'var(--ok)') + ';color:var(--bg);font-family:\'Baloo 2\';font-weight:800;font-size:1.2rem;display:flex;align-items:center;justify-content:center;padding:0 .5rem">' + (dirty ? dirty : ic('check', 20, 'style="stroke-width:3"')) + '</span>' +
      '<span>' + (dirty ? bi(dirty + ' बदलाव अभी वेबसाइट पर नहीं गए', dirty + ' changes are not on the website yet', '1.05rem') : bi('सब कुछ पब्लिश है', 'Everything is published', '1.05rem')) + '</span></div>' +
      '<button class="btn primary block big" data-act="publish">' + ic('upload', 26) + '<span>' + bi('बदलाव पब्लिश करें', 'Publish changes · downloads items.json', '1.2rem') + '</span></button>' +
      '<span class="en" style="font-size:.82rem">फ़ाइल डाउनलोड होगी — उसे वेबसाइट के फ़ोल्डर में डालें, तब सबको नया सामान दिखेगा। इस फ़ोन पर दुकान में बदलाव अभी से दिखते हैं। · Upload the downloaded file to the website so everyone sees the changes.</span></section>';
    // sale
    html += '<section class="ocard"><div class="row" style="justify-content:space-between"><span>' + bi('सेल मोड', 'Sale mode', '1.15rem') + '</span><span style="padding:.25rem .6rem;border-radius:.6rem;background:' + (sale.active ? 'var(--terra)' : 'var(--sf2)') + ';color:' + (sale.active ? 'var(--on-terra)' : 'var(--ink)') + ';font-weight:700;font-size:.82rem;text-align:center;line-height:1.15">' + (sale.active ? 'चालू है<br>Running' : 'अभी बंद<br>Off now') + '</span></div>' +
      (sale.active ? '<div class="okbanner" style="margin:0"><span class="tic">' + ic('check', 18, 'style="stroke-width:3"') + '</span><span><b>सेल चालू: ' + (sale.cat === 'all' ? 'सब सामान' : catById(sale.cat).hi) + ' पर ' + sale.pct + '% छूट</b><span style="display:block;font-size:.8rem">Sale is live in the shop</span></span></div>' : '') +
      '<div><span class="en" style="margin-bottom:.35rem">किस पर? · Which category?</span><div class="zchips"><button class="z" data-act="scat" data-v="all" aria-pressed="' + (A.saleCat === 'all') + '">सब · All</button>' + CATS.map(c => '<button class="z" data-act="scat" data-v="' + c.id + '" aria-pressed="' + (A.saleCat === c.id) + '">' + c.hi + '</button>').join('') + '</div></div>' +
      '<div><span class="en" style="margin-bottom:.35rem">कितनी छूट? · How much off?</span><div class="row">' + [10, 20, 30].map(p => '<button class="pchip" data-act="spct" data-v="' + p + '" aria-pressed="' + (A.salePct === p) + '">' + p + '%</button>').join('') +
      '<label class="prefix" style="height:3rem;flex:1"><span class="sr">अपनी छूट</span><input id="spctin" inputmode="numeric" placeholder="अपना" value="' + ([10, 20, 30].indexOf(A.salePct) < 0 ? A.salePct : '') + '"><span style="background:transparent">%</span></label></div></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem"><button class="btn" style="background:var(--terra);color:var(--on-terra);border:0;min-height:3.5rem" data-act="salestart">' + bi(sale.active ? 'सेल बदलें' : 'सेल शुरू करें', sale.active ? 'Update sale' : 'Start sale', '1rem').replace('class="en"', 'class="en on"') + '</button>' +
      '<button class="btn" style="min-height:3.5rem" data-act="saleend"' + (sale.active ? '' : ' disabled') + '>' + bi('सेल बंद करें', 'End sale', '1rem') + '</button></div></section>';
    // festival
    html += '<section class="ocard"><span>' + bi('त्योहार और बैनर', 'Festival & banner', '1.15rem') + '</span><div class="ftiles">' +
      FESTIVALS.map(f => '<button data-act="fest" data-v="' + f.id + '" aria-pressed="' + (A.fest.id === f.id) + '">' + bi(f.hi, f.en, '.95rem') + '</button>').join('') + '</div>' +
      '<div><label for="t_ft" class="lab">' + bi('बैनर पर क्या लिखें', 'Banner text (Hindi)', '.95rem') + '</label><input id="t_ft" class="fld" value="' + esc(A.fest.text) + '"></div>' +
      '<div><label for="t_fte" class="lab"><span class="en" style="font-size:.85rem">नीचे छोटी अंग्रेज़ी लाइन · Small English line</span></label><input id="t_fte" class="fld" style="height:3rem;font-size:1rem" value="' + esc(A.fest.textEn) + '"></div>' +
      '<div><span class="en" style="margin-bottom:.35rem">रंग · Colour</span><div class="row">' + ['#b4562f', '#4f7a68', '#7a1f2b', '#c98a12', '#b5367a'].map(c => '<button class="swatch" data-act="fcol" data-v="' + c + '" aria-pressed="' + (A.fest.color === c) + '" aria-label="रंग ' + c + '" style="background:' + c + '"></button>').join('') + '</div></div>' +
      '<div class="banner" style="margin:0;--fest:' + esc(A.fest.color) + '" id="fprev">' + ic('diya', 40, 'style="stroke-width:1.6"') + '<span><span class="hi">' + esc(A.fest.text || '—') + '</span><span class="en">' + esc(A.fest.textEn) + '</span></span></div>' +
      '<span class="en" style="margin-top:-.4rem">ग्राहक को ऐसा दिखेगा · Customers see it like this</span>' +
      '<button class="btn block" style="border:2px solid var(--sage)" data-act="festsave">' + bi(A.fest.id === 'none' ? 'बैनर हटाएँ' : 'बैनर सेव करें', A.fest.id === 'none' ? 'Hide banner' : 'Save banner', '1rem') + '</button></section>';
    // shop settings
    const e = A.serr || {};
    const fe = k => e[k] ? '<span class="ferr">' + e[k][0] + '<span class="en">' + e[k][1] + '</span></span>' : '';
    html += '<section class="ocard"><span>' + bi('दुकान की जानकारी', 'Shop settings', '1.15rem') + '</span>' +
      '<div><label for="s_wa" class="lab">' + bi('WhatsApp नंबर (ऑर्डर यहाँ आएँगे)', 'WhatsApp number — orders arrive here', '.95rem') + '</label><div class="prefix' + (e.wa ? ' bad' : '') + '"><span>+91</span><input id="s_wa" inputmode="numeric" maxlength="10" value="' + esc(String(st.whatsapp || '').replace(/^91(?=\d{10}$)/, '')) + '"></div>' + fe('wa') + '</div>' +
      '<div><label for="s_ph" class="lab">' + bi('कॉल वाला नंबर', 'Phone for calls', '.95rem') + '</label><div class="prefix' + (e.ph ? ' bad' : '') + '"><span>+91</span><input id="s_ph" inputmode="numeric" maxlength="10" value="' + esc(String(st.phone || '').replace(/^\+?91(?=\d{10}$)/, '')) + '"></div>' + fe('ph') + '</div>' +
      '<div><label for="s_ad" class="lab">' + bi('दुकान का पता', 'Shop address', '.95rem') + '</label><textarea id="s_ad" class="fld" rows="2">' + esc(st.address) + '</textarea></div>' +
      '<div><label for="s_hr" class="lab">' + bi('दुकान का समय', 'Shop hours', '.95rem') + '</label><input id="s_hr" class="fld" value="' + esc(st.hours) + '"></div>' +
      '<div><label for="s_rz" class="lab">' + bi('Razorpay / UPI भुगतान लिंक', 'Payment link (optional)', '.95rem') + '</label><input id="s_rz" class="fld' + (e.rz ? ' bad' : '') + '" inputmode="url" placeholder="https://rzp.io/…" value="' + esc(st.razorpay) + '">' + fe('rz') + '</div>' +
      '<div><label for="s_ig" class="lab">' + bi('Instagram लिंक', 'Instagram link (optional, small in footer)', '.95rem') + '</label><input id="s_ig" class="fld' + (e.ig ? ' bad' : '') + '" inputmode="url" placeholder="https://instagram.com/…" value="' + esc(st.instagram) + '">' + fe('ig') + '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem"><div><label for="s_fee" class="lab">' + bi('डिलीवरी फ़ीस', 'Delivery fee', '.95rem') + '</label><div class="prefix"><span>₹</span><input id="s_fee" inputmode="numeric" value="' + esc(st.deliveryFee) + '"></div></div>' +
      '<div><label for="s_free" class="lab">' + bi('इससे ऊपर मुफ़्त', 'Free delivery above', '.95rem') + '</label><div class="prefix"><span>₹</span><input id="s_free" inputmode="numeric" value="' + esc(st.freeAbove) + '"></div></div></div>' +
      '<div><label for="s_pin" class="lab">' + bi('पैनल का PIN (4 अंक)', 'Panel PIN (4 digits)', '.95rem') + '</label><input id="s_pin" class="fld' + (e.pin ? ' bad' : '') + '" style="max-width:9rem;letter-spacing:.3em" inputmode="numeric" maxlength="4" value="' + esc(st.pin) + '">' + fe('pin') + '</div>' +
      '<button class="btn block" style="border:2px solid var(--sage)" data-act="ssave">' + bi('जानकारी सेव करें', 'Save settings', '1rem') + '</button></section>';
    // import
    const imp = A.importResult;
    html += '<section class="ocard"><span>' + bi('Excel / CSV से सामान डालें', 'Import items from Excel / CSV', '1.15rem') + '</span>' +
      '<span class="en" style="font-size:.82rem">Excel में “Save as → CSV” करें। कॉलम: नाम, दाम, MRP, कैटेगरी, टाइप, साइज़, कलेक्शन, स्टॉक · Columns: name, price, mrp, category, type, sizes, collections, stock</span>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem"><button class="btn" style="min-height:4rem;flex-direction:column;gap:.1rem;border:2px solid var(--sage)" data-act="csv">' + ic('upload', 22, 'style="color:var(--sage-d)"') + bi('फ़ाइल चुनें', 'Choose file', '.95rem') + '</button>' +
      '<button class="btn" style="min-height:4rem;flex-direction:column;gap:.1rem" data-act="csvsample">' + ic('download', 22, 'style="color:var(--sage-d)"') + bi('नमूना फ़ाइल', 'Sample file', '.95rem') + '</button></div>' +
      (imp ? (imp.added ? '<div class="okbanner" style="margin:0"><span class="tic">' + ic('check', 18, 'style="stroke-width:3"') + '</span><span><b>' + imp.added + ' सामान जुड़ गए ✓</b><span style="display:block;font-size:.8rem">' + imp.added + ' items added</span></span></div>' : '') +
        (imp.skipped.length ? '<div class="note warn" style="margin:0">' + ic('info', 22) + '<span style="font-size:.9rem;font-weight:600">' + imp.skipped.length + ' लाइनों में नाम या दाम नहीं था, उन्हें छोड़ दिया — लाइन ' + imp.skipped.slice(0, 12).join(', ') + (imp.skipped.length > 12 ? ' …' : '') + '। Excel में भरकर दोबारा डालें।<span class="en" style="color:inherit">Rows without a name or price were skipped.</span></span></div>' : '') +
        (imp.error ? '<div class="errbanner" style="margin:0"><span class="tic">' + ic('alert', 18, 'style="stroke-width:3"') + '</span><span><b>' + imp.error[0] + '</b><span style="display:block;font-size:.8rem">' + imp.error[1] + '</span></span></div>' : '') : '') + '</section>';
    // backup
    html += '<section class="ocard"><span>' + bi('बैकअप', 'Backup', '1.15rem') + '</span><span class="en" style="font-size:.82rem">पिछला बैकअप · Last backup: ' + esc(ls.get('pd_last_backup', '—')) + '</span>' +
      '<button class="btn block" style="border:2px solid var(--sage)" data-act="backup">' + ic('download', 22, 'style="color:var(--sage-d)"') + '<span>' + bi('बैकअप डाउनलोड करें', 'Download backup', '1rem') + '</span></button>' +
      '<button class="btn block" data-act="restore">' + ic('upload', 22) + '<span>' + bi('बैकअप से वापस लाएँ', 'Restore from a backup file', '1rem') + '</span></button></section>';
    // display
    html += '<section class="ocard"><span>' + bi('दिखावट', 'Display', '1.15rem') + '</span><div class="row" style="flex-wrap:wrap">' +
      '<button class="pill-btn" data-act="tbig" aria-pressed="' + ls.get('pd_big', false) + '">' + ic('text', 20) + '<span>' + bi('बड़े अक्षर', 'Larger text', '.85rem') + '</span></button>' +
      '<button class="pill-btn" data-act="ttheme">' + ic('moon', 20) + '<span>' + bi(PD.isDark() ? 'दिन वाला रंग' : 'रात वाला रंग', PD.isDark() ? 'Light mode' : 'Dark mode', '.85rem') + '</span></button>' +
      '<button class="pill-btn" data-act="lock">' + ic('lock', 20) + '<span>' + bi('पैनल बंद करें', 'Lock panel', '.85rem') + '</span></button></div></section><div style="height:2rem"></div>';
    app.innerHTML = html;
  }
  function publish() {
    const st = Object.assign({}, A.settings); delete st.pin;
    download('items.json', JSON.stringify({ publishedAt: new Date().toISOString(), settings: st, items: A.items }));
    ls.set('pd_dirty', 0);
    A.flash = { hi: 'items.json डाउनलोड हो गई ✓', en: 'Now upload it to the website folder (replace the old items.json)' };
    viewTools(); window.scrollTo(0, 0);
  }
  function parseCSV(text) {
    const rows = []; let row = [], cell = '', q = false;
    text = text.replace(/^﻿/, '');
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === ',' || ch === ';' || ch === '\t') { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(r => r.some(c => c.trim()));
  }
  async function importCSV(file) {
    try {
      const rows = parseCSV(await file.text());
      if (rows.length < 2) throw new Error('empty');
      const head = rows[0].map(h => PD.norm(h));
      const col = names => head.findIndex(h => names.some(n => h === PD.norm(n) || h.indexOf(PD.norm(n)) === 0));
      const ix = { name: col(['नाम', 'name', 'item']), nameEn: col(['english', 'अंग्रेजी']), price: col(['दाम', 'price', 'rate', 'कीमत']), mrp: col(['mrp', 'एमआरपी', 'छपा']), cat: col(['कैटेगरी', 'category', 'विभाग']), type: col(['टाइप', 'type']), sizes: col(['साइज', 'size']), colls: col(['कलेक्शन', 'collection']), stock: col(['स्टॉक', 'stock']), color: col(['रंग', 'color', 'colour']) };
      if (ix.name < 0 || ix.price < 0) { A.importResult = { added: 0, skipped: [], error: ['फ़ाइल में “नाम” और “दाम” वाले कॉलम नहीं मिले', 'The file needs “name” and “price” columns — use the sample file'] }; viewTools(); return; }
      const v = PD.parseQuery(''); void v;
      const added = [], skipped = []; const now = Date.now();
      rows.slice(1).forEach((r, k) => {
        const g = i => (i >= 0 && r[i] != null ? String(r[i]).trim() : '');
        const name = g(ix.name); const price = parseFloat(g(ix.price).replace(/[^\d.]/g, ''));
        if (!name || !(price > 0)) { skipped.push(k + 2); return; }
        const pq = PD.parseQuery([g(ix.cat), g(ix.type), name, g(ix.color)].join(' '));
        const type = pq.types[0] || ''; const T = typeById(type);
        const cat = (pq.cats[0]) || (T && T.cat) || 'men';
        const st = PD.norm(g(ix.stock));
        added.push({ id: PD.uid(), createdAt: now + k, updatedAt: now + k, name, nameEn: g(ix.nameEn), price: Math.round(price), mrp: Math.round(parseFloat(g(ix.mrp).replace(/[^\d.]/g, ''))) || 0,
          cat, type: T && T.cat === cat ? type : '', typeName: '', sizes: g(ix.sizes).split(/[\s|/,]+/).filter(Boolean).map(s => /free|फ्री/i.test(s) ? 'Free' : s.toUpperCase()),
          colls: COLLS.filter(c => c.id !== 'new' && PD.norm(g(ix.colls)).indexOf(PD.norm(c.hi)) >= 0 || PD.norm(g(ix.colls)).indexOf(c.id) >= 0).map(c => c.id).filter(c => c !== 'new'),
          inStock: !(st && /^(no|n|0|नही|नहीं|ख़त्म|खत्म|false)/.test(st)), isNew: true, photos: [], colorId: pq.colors[0] || '' });
      });
      A.items = added.concat(A.items); if (added.length) await persist();
      A.importResult = { added: added.length, skipped, error: null };
    } catch (e) {
      A.importResult = { added: 0, skipped: [], error: ['यह फ़ाइल खुल नहीं पाई', 'Couldn’t open this file. In Excel use “Save as → CSV”, then choose it again.'] };
    }
    viewTools();
  }

  /* ---------- routing ---------- */
  function curView() { const h = location.hash || '#/items'; if (h.indexOf('#/tools') === 0) return 'tools'; if (h.indexOf('#/items') === 0 || h === '#/') return 'items'; return 'form'; }
  function route() {
    clearUndoIfLeaving();
    if (!sessionStorage.getItem('pd_unlocked')) { viewPin(); return; }
    const h = location.hash || '#/items'; const p = h.slice(2).split('/');
    $('#bulk').innerHTML = '';
    if (p[0] === 'add') {
      if (A.mode !== 'add' || !A.draft) { A.draft = blankDraft(); A.justSaved = null; }
      A.mode = 'add'; A.err = {}; A.kp = 'price'; A.typeNew = false; $('#nav').innerHTML = ''; viewForm();
    } else if (p[0] === 'edit') {
      const it = byId(p[1]); if (!it) { location.hash = '#/items'; return; }
      A.mode = 'edit'; A.editId = it.id; A.draft = draftFrom(it, true); A.err = {}; A.confirmDel = false; A.kp = 'price'; A.justSaved = null; $('#nav').innerHTML = ''; viewForm();
    } else if (p[0] === 'similar') {
      const it = byId(p[1]); A.mode = 'add'; A.draft = it ? draftFrom(it, false) : blankDraft(); A.err = {}; A.justSaved = null; A.kp = 'price';
      history.replaceState(null, '', '#/add'); $('#nav').innerHTML = ''; viewForm();
      toast('info', 'पिछले जैसा भरा है — बस फ़ोटो और नाम बदलें', 'Filled like the earlier item — change photo and name');
    } else if (p[0] === 'multi') { $('#nav').innerHTML = ''; viewMulti(); }
    else if (p[0] === 'tools') {
      A.saleCat = A.settings.sale.cat || 'all'; A.salePct = A.settings.sale.pct || 20; A.fest = Object.assign({}, A.settings.festival); if (!A.fest.active) A.fest.id = 'none'; A.serr = null;
      nav('tools'); viewTools();
    } else { A.mode = 'add'; A.draft = null; nav('items'); viewItems(); }
    if (!A.keepScroll) window.scrollTo(0, 0); A.keepScroll = false;
  }
  function clearUndoIfLeaving() { /* undo bar stays across views for its 10 seconds */ }

  /* ---------- events ---------- */
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const k = b.dataset.act; const d = A.draft;
    switch (k) {
      case 'pk': pinKey(b.dataset.k); break;
      case 'forgot':
        if (confirm('PIN फिर से 1234 कर दें? (PIN सिर्फ़ पैनल छुपाता है)\nReset the PIN to 1234?')) { A.settings.pin = '1234'; await persist(false); A.pinBad = false; A.pin = ''; toast('ok', 'PIN अब 1234 है ✓', 'PIN reset to 1234 — change it in Tools'); viewPin(); }
        break;
      case 'lock': sessionStorage.removeItem('pd_unlocked'); A.sel.clear(); route(); break;
      case 'fstat': { const f = A.filt; const kk = b.dataset.k; if (kk === 'all') A.filt = { q: '', cat: 'all', out: false, nophoto: false, recent: false }; else { const on = !f[kk]; f.out = f.nophoto = f.recent = false; f[kk] = on; } A.show = 40; viewItems(); break; }
      case 'fcat': A.filt.cat = b.dataset.v; A.show = 40; keepScroll(viewItems); break;
      case 'fout': A.filt.out = !A.filt.out; A.show = 40; keepScroll(viewItems); break;
      case 'fno': A.filt.nophoto = !A.filt.nophoto; A.show = 40; keepScroll(viewItems); break;
      case 'imore': A.show += 40; keepScroll(viewItems); break;
      case 'stock': { const it = byId(b.dataset.id); it.inStock = !it.inStock; it.updatedAt = Date.now(); await persist(); b.setAttribute('aria-checked', it.inStock); b.querySelector('.lb').innerHTML = it.inStock ? 'स्टॉक में<br>In stock' : 'ख़त्म<br>Sold out'; toast('ok', it.inStock ? 'स्टॉक में ✓' : 'स्टॉक ख़त्म ✓', it.name, 2200); break; }
      case 'edit': location.hash = '#/edit/' + b.dataset.id; break;
      case 'similar': location.hash = '#/similar/' + b.dataset.id; break;
      case 'share': {
        const it = byId(b.dataset.id); const url = shopUrl(it.id); const text = it.name + ' — ' + fmt(PD.salePrice(it, A.settings)) + ' · ' + A.settings.shopName;
        if (navigator.share) { try { await navigator.share({ title: it.name, text, url }); } catch (err) { /* cancelled */ } }
        else window.open('https://wa.me/?text=' + encodeURIComponent(text + '\n' + url), '_blank', 'noopener');
        break;
      }
      case 'bclear': A.sel.clear(); A.bulk = null; keepScroll(viewItems); break;
      case 'bulk': {
        const kk = b.dataset.k;
        if (kk === 'out' || kk === 'in') { A.bulk = kk; await bulkApply(kk); break; }
        A.bulk = A.bulk === kk ? null : kk; renderBulk(); break;
      }
      case 'bdir': A.bulkDir = +b.dataset.v; renderBulk(); break;
      case 'bpct': A.bulkPct = +b.dataset.v; renderBulk(); break;
      case 'bcat': A.bulkCat = b.dataset.v; renderBulk(); break;
      case 'btype': A.bulkType = b.dataset.v; renderBulk(); break;
      case 'bcollmode': A.bulkCollMode = b.dataset.v; renderBulk(); break;
      case 'bapply': await bulkApply(b.dataset.k); break;
      // form
      case 'cam': { const i = $('#camIn'); i.value = ''; i.click(); break; }
      case 'gal': { const i = $('#galIn'); i.value = ''; i.click(); break; }
      case 'rmph': d.photos.splice(+b.dataset.i, 1); if (!d.photos.length) { d.colorId = ''; d.rgb = null; d.hash = ''; } keepScroll(viewForm); break;
      case 'mainph': { const i = +b.dataset.i; const [p] = d.photos.splice(i, 1); d.photos.unshift(p); try { const sig = await PD.analyseImage(p); d.colorId = sig.colorId; d.rgb = sig.rgb; d.hash = sig.hash; } catch (err) { /* keep */ } keepScroll(viewForm); break; }
      case 'kp': {
        const key = b.dataset.k; const f = A.kp; let v = String(d[f] || '');
        if (key === 'del') v = v.slice(0, -1); else if (v.length < 6) v = (v === '0' ? '' : v) + key;
        d[f] = v.replace(/^0+(?=\d)/, ''); const inp = $('#f_' + f); if (inp) inp.value = d[f];
        if (f === 'price' && A.err.price && +d.price > 0) { delete A.err.price; keepScroll(viewForm); } else updateOff();
        break;
      }
      case 'fcatpick': if (d.cat !== b.dataset.v) { d.cat = b.dataset.v; d.type = ''; d.typeName = ''; } delete A.err.cat; keepScroll(viewForm); break;
      case 'ftype': d.type = b.dataset.v; d.typeName = ''; A.typeNew = false; keepScroll(viewForm); break;
      case 'ftypenew': A.typeNew = true; d.type = ''; keepScroll(viewForm); const ti = document.querySelector('[data-f="typeName"]'); if (ti) ti.focus(); break;
      case 'fsize': { const s = b.dataset.v; const i = d.sizes.indexOf(s); if (i >= 0) d.sizes.splice(i, 1); else d.sizes.push(s); b.setAttribute('aria-pressed', i < 0); break; }
      case 'ftog': d[b.dataset.k] = !d[b.dataset.k]; b.setAttribute('aria-checked', d[b.dataset.k]); break;
      case 'save': await saveDraft(false); break;
      case 'savesim': await saveDraft(true); break;
      case 'delask': A.confirmDel = true; keepScroll(viewForm); break;
      case 'delno': A.confirmDel = false; keepScroll(viewForm); break;
      case 'delyes': {
        const it = byId(A.editId); const idx = A.items.indexOf(it);
        A.items.splice(idx, 1); await persist(); location.hash = '#/items';
        undoBar('“' + it.name + '” हटाया', 'Item deleted', async () => { A.items.splice(idx, 0, it); await persist(); if (curView() === 'items') keepScroll(viewItems); toast('ok', 'वापस आ गया ✓', 'Item restored'); });
        break;
      }
      // multi
      case 'mcat': A.multi.cat = b.dataset.v; A.multi.type = ''; keepScroll(viewMulti); break;
      case 'mtype': A.multi.type = b.dataset.v; keepScroll(viewMulti); break;
      case 'msize': { const s = b.dataset.v; const arr = A.multi.sizes; const i = arr.indexOf(s); if (i >= 0) arr.splice(i, 1); else arr.push(s); b.setAttribute('aria-pressed', i < 0); break; }
      case 'mrm': A.multi.rows.splice(+b.dataset.i, 1); if (!A.multi.rows.length) { A.multi = null; location.hash = '#/add'; } else keepScroll(viewMulti); break;
      case 'msave': await multiSave(); break;
      // tools
      case 'publish': publish(); break;
      case 'scat': A.saleCat = b.dataset.v; keepScroll(viewTools); break;
      case 'spct': A.salePct = +b.dataset.v; keepScroll(viewTools); break;
      case 'salestart': {
        const own = parseInt(($('#spctin') || {}).value, 10); if (own > 0 && own < 91) A.salePct = own;
        A.settings.sale = { active: true, cat: A.saleCat, pct: A.salePct }; await persist();
        A.flash = { hi: 'सेल शुरू हो गई ✓', en: (A.saleCat === 'all' ? 'All items' : catById(A.saleCat).en) + ': ' + A.salePct + '% off is live' }; keepScroll(viewTools); window.scrollTo(0, 0); break;
      }
      case 'saleend': A.settings.sale.active = false; await persist(); A.flash = { hi: 'सेल बंद हो गई ✓', en: 'Sale ended — normal prices are back' }; viewTools(); window.scrollTo(0, 0); break;
      case 'fest': {
        A.fest.text = $('#t_ft').value; A.fest.textEn = $('#t_fte').value;
        const f = FESTIVALS.find(x => x.id === b.dataset.v); A.fest.id = f.id;
        if (f.color) A.fest.color = f.color;
        if (f.id !== 'none' && (!A.fest.text || /ऑफ़र/.test(A.fest.text))) { A.fest.text = f.hi + ' ऑफ़र · 20% तक छूट'; A.fest.textEn = f.en + ' offer · up to 20% off'; }
        keepScroll(viewTools); break;
      }
      case 'fcol': A.fest.text = $('#t_ft').value; A.fest.textEn = $('#t_fte').value; A.fest.color = b.dataset.v; keepScroll(viewTools); break;
      case 'festsave': {
        A.fest.text = $('#t_ft').value.trim(); A.fest.textEn = $('#t_fte').value.trim();
        if (A.fest.id !== 'none' && !A.fest.text) { toast('err', 'बैनर पर कुछ लिखें', 'Write the banner text first'); break; }
        A.settings.festival = { active: A.fest.id !== 'none', id: A.fest.id, text: A.fest.text, textEn: A.fest.textEn, color: A.fest.color }; await persist();
        A.flash = { hi: A.fest.id === 'none' ? 'बैनर हटा दिया ✓' : 'बैनर सेव हो गया ✓', en: A.fest.id === 'none' ? 'Banner hidden' : 'Banner saved' }; viewTools(); window.scrollTo(0, 0); break;
      }
      case 'ssave': {
        const val = id => ($(id).value || '').trim(); const digits = id => val(id).replace(/\D/g, '');
        const err = {}; const wa = digits('#s_wa'); const ph = digits('#s_ph'); const rz = val('#s_rz'); const ig = val('#s_ig'); const pin = digits('#s_pin');
        if (wa && wa.length !== 10) err.wa = ['नंबर में 10 अंक होने चाहिए — अभी ' + wa.length + ' हैं', 'Number needs 10 digits — it has ' + wa.length];
        if (ph && ph.length !== 10) err.ph = ['नंबर में 10 अंक होने चाहिए — अभी ' + ph.length + ' हैं', 'Number needs 10 digits — it has ' + ph.length];
        if (rz && !/^https:\/\//.test(rz)) err.rz = ['लिंक https:// से शुरू होना चाहिए — पूरा लिंक Razorpay से कॉपी करें', 'Link should start with https:// — copy the full link'];
        if (ig && !/^https:\/\//.test(ig)) err.ig = ['लिंक https:// से शुरू होना चाहिए', 'Link should start with https://'];
        if (pin.length !== 4) err.pin = ['PIN 4 अंक का होना चाहिए', 'PIN needs exactly 4 digits'];
        const st = A.settings;
        st.address = val('#s_ad'); st.hours = val('#s_hr'); st.deliveryFee = +digits('#s_fee') || 0; st.freeAbove = +digits('#s_free') || 0;
        if (!err.wa) st.whatsapp = wa; if (!err.ph) st.phone = ph; if (!err.rz) st.razorpay = rz; if (!err.ig) st.instagram = ig; if (!err.pin) st.pin = pin;
        await persist(); A.serr = Object.keys(err).length ? err : null;
        if (A.serr) { keepScroll(viewTools); toast('err', 'कुछ जानकारी ठीक करनी है', 'Please fix the red boxes — the rest is saved'); }
        else { A.flash = { hi: 'सेव हो गया ✓', en: 'Shop settings saved' }; viewTools(); window.scrollTo(0, 0); }
        break;
      }
      case 'csv': { const i = $('#csvIn'); i.value = ''; i.click(); break; }
      case 'csvsample': download('pooja-items-sample.csv', '﻿नाम,दाम,MRP,कैटेगरी,टाइप,साइज़,कलेक्शन,स्टॉक\nनीली सूती कमीज़,499,799,पुरुष,कमीज़,M L XL,दिवाली,हाँ\nलाल बनारसी साड़ी,1899,2600,साड़ी,बनारसी,Free,दिवाली छठ पूजा,हाँ\nबच्चों का स्वेटर,449,650,बच्चे,स्वेटर,3-5 6-8,सर्दी,नहीं\n', 'text/csv'); break;
      case 'backup': {
        download('pooja-backup-' + today() + '.json', JSON.stringify({ backupAt: new Date().toISOString(), settings: A.settings, items: A.items }));
        ls.set('pd_last_backup', new Date().toLocaleString('hi-IN')); A.flash = { hi: 'बैकअप डाउनलोड हो गया ✓', en: 'Keep this file safe (e.g. send it to yourself on WhatsApp)' }; viewTools(); window.scrollTo(0, 0); break;
      }
      case 'restore': { const i = $('#restoreIn'); i.value = ''; i.click(); break; }
      case 'tbig': { const on = PD.toggleBig(); b.setAttribute('aria-pressed', on); break; }
      case 'ttheme': PD.toggleTheme(); keepScroll(viewTools); break;
    }
  });
  document.addEventListener('change', async e => {
    const t = e.target;
    if (t.dataset.sel) { if (t.checked) A.sel.add(t.dataset.sel); else A.sel.delete(t.dataset.sel); t.closest('.orow').classList.toggle('sel', t.checked); renderBulk(); padForBulk(); }
    else if (t.id === 'selall') { filtered().forEach(i => { if (t.checked) A.sel.add(i.id); else A.sel.delete(i.id); }); keepScroll(viewItems); }
    else if (t.dataset.bcoll) { const c = t.dataset.bcoll; A.bulkColls = A.bulkColls.filter(x => x !== c); if (t.checked) A.bulkColls.push(c); renderBulk(); }
    else if (t.dataset.fcoll) { const d = A.draft; const c = t.dataset.fcoll; d.colls = d.colls.filter(x => x !== c); if (t.checked) d.colls.push(c); }
    else if (t.id === 'camIn' && t.files.length) addPhotos([...t.files]);
    else if (t.id === 'galIn' && t.files.length) { const files = [...t.files]; if (files.length > 1 && A.mode === 'add' && !A.draft.photos.length) chooseGalleryMode(files); else addPhotos(files); }
    else if (t.id === 'csvIn' && t.files[0]) importCSV(t.files[0]);
    else if (t.id === 'restoreIn' && t.files[0]) {
      try {
        const data = JSON.parse(await t.files[0].text());
        if (!Array.isArray(data.items)) throw new Error('bad');
        if (!confirm('इस बैकअप से ' + data.items.length + ' सामान वापस लाएँ? अभी वाला सामान बदल जाएगा।\nRestore ' + data.items.length + ' items? Current items will be replaced.')) return;
        A.items = data.items; A.settings = PD.mergeSettings(Object.assign({}, A.settings, data.settings || {})); await persist();
        A.flash = { hi: data.items.length + ' सामान वापस आ गए ✓', en: 'Backup restored' }; viewTools(); window.scrollTo(0, 0);
      } catch (err) { toast('err', 'यह बैकअप फ़ाइल नहीं खुली', 'This is not a backup file from this panel', 5000); }
    }
  });
  function padForBulk() { const sp = app.lastElementChild; if (sp && sp.tagName === 'DIV' && !sp.className) sp.style.height = A.sel.size ? '22rem' : '1rem'; }
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'iq') { A.filt.q = t.value; A.show = 40; const list = filtered(); $('#olist').innerHTML = list.length ? list.slice(0, A.show).map(row).join('') : '<div class="empty">' + bi('कुछ नहीं मिला', 'No items match', '1.05rem') + '</div>'; return; }
    if (t.dataset.f && A.draft) {
      let v = t.value; if (t.dataset.f === 'price' || t.dataset.f === 'mrp') { v = v.replace(/\D/g, ''); t.value = v; }
      A.draft[t.dataset.f] = v; if (t.dataset.f === 'price' || t.dataset.f === 'mrp') updateOff();
      return;
    }
    if (t.dataset.m && A.multi) { A.multi.rows[+t.dataset.i][t.dataset.m] = t.dataset.m === 'price' ? t.value.replace(/\D/g, '') : t.value; if (t.dataset.m === 'price') t.value = A.multi.rows[+t.dataset.i].price; return; }
    if (t.id === 't_ft' || t.id === 't_fte') { const pv = $('#fprev'); if (pv) { pv.querySelector('.hi').textContent = $('#t_ft').value || '—'; pv.querySelector('.en').textContent = $('#t_fte').value; } }
  });
  document.addEventListener('focusin', e => {
    const kp = e.target.dataset && e.target.dataset.kp;
    if (kp && A.draft) { A.kp = kp; document.querySelectorAll('.pricebox').forEach(x => x.classList.remove('active')); e.target.closest('.pricebox').classList.add('active'); }
  });
  document.addEventListener('submit', e => { e.preventDefault(); });
  window.addEventListener('hashchange', route);

  load().then(route).catch(() => { app.innerHTML = '<div class="errbanner" style="margin-top:2rem">इस फ़ोन में पैनल नहीं खुल पाया। Chrome में खोलें। · Could not open the panel here — please use Chrome.</div>'; });
})();
