/* Pooja Dresses — customer shop */
(function () {
  'use strict';
  const { ic, esc, fmt, pic, priceInfo, catById, typeById, colorById, collById, CATS, TYPES, COLLS, ls } = PD;
  const $ = s => document.querySelector(s);
  const app = $('#app');

  const S = {
    settings: PD.mergeSettings({}), items: [], local: false,
    cart: ls.get('pd_cart', []),
    filt: { sort: 'new', max: null, stock: false }, coll: null,
    show: 24, voice: null, photo: null, pickSize: null, lastOrder: ls.get('pd_last_order', null)
  };

  /* ---------- data ---------- */
  async function load() {
    const pub = await PD.loadPublished();
    let items = pub.items || [], settings = pub.settings || {};
    S.local = false;
    if (ls.get('pd_preview', true)) {
      const li = await PD.kvGet('items'); const lsets = await PD.kvGet('settings');
      if (Array.isArray(li) && PD.ls.get('pd_owner_used', false)) { items = li; if (lsets) settings = lsets; S.local = true; }
    }
    S.items = items; S.settings = PD.mergeSettings(settings);
    renderPreviewBar();
  }
  function renderPreviewBar() {
    const el = $('#preview');
    el.innerHTML = S.local ? '<div class="preview-bar"><span>आप इस फ़ोन पर अपने बदलाव देख रहे हैं · Showing your unpublished changes</span><button data-act="live">असली देखें · Live</button></div>' : '';
  }
  const byId = id => S.items.find(i => i.id === id);
  const visible = () => S.items.filter(i => !i.hidden);

  /* ---------- small UI parts ---------- */
  function bi(hi, en, hs) { return '<span class="hi"' + (hs ? ' style="font-size:' + hs + '"' : '') + '>' + hi + '</span><span class="en">' + en + '</span>'; }
  function header() {
    const big = ls.get('pd_big', false);
    return '<header class="top"><a class="brand" href="#/"><span class="logo">पू</span><span>' +
      '<span class="hi" style="font-size:1.12rem;font-weight:700">' + esc(S.settings.shopName) + '</span><span class="en">' + esc(S.settings.shopNameEn) + '</span></span></a>' +
      '<button class="pill-btn" data-act="big" aria-pressed="' + big + '">' + ic('text', 22) + '<span>' + bi('बड़े अक्षर', 'Larger text', '.88rem') + '</span></button></header>';
  }
  function promises() {
    const p = (icon, hi, en) => '<div><span class="p1">' + ic(icon, 18) + '<span class="hi">' + hi + '</span></span><span class="en">' + en + '</span></div>';
    return '<div class="promises">' + p('truck', 'आज ही डिलीवरी', 'Same-day in town') + p('tape', 'मुफ़्त फिटिंग', 'Free fitting') + p('chat', 'WhatsApp ऑर्डर', 'Order on WhatsApp') + '</div>';
  }
  function banner() {
    const f = S.settings.festival || {};
    if (!f.active || f.id === 'none' || !f.text) return '';
    const target = collById(f.id) ? '#/col/' + f.id : '#/';
    let lights = ''; for (let i = 0; i < 9; i++) lights += '<i></i>';
    return '<a class="banner" href="' + target + '" style="--fest:' + esc(f.color || '#b4562f') + '"><span class="lights" aria-hidden="true">' + lights + '</span>' +
      ic('diya', 50, 'stroke-width="1.6"') + '<span style="flex:1;padding-top:.4rem"><span class="hi">' + esc(f.text) + '</span><span class="en">' + esc(f.textEn || '') + '</span></span>' + ic('right', 24) + '</a>';
  }
  function searchBar(val) {
    return '<form class="search" role="search" data-form="search"><span class="muted" aria-hidden="true">' + ic('search', 22) + '</span>' +
      '<label for="q" class="sr">खोजें / Search</label><input id="q" name="q" type="search" enterkeyhint="search" autocomplete="off" value="' + esc(val || '') + '" placeholder="क्या चाहिए? बोलकर बताइए · Search or speak">' +
      '<button type="button" class="round cam" data-act="photo" aria-label="फ़ोटो से खोजें, Search by photo">' + ic('camera', 22) + '</button>' +
      '<button type="button" class="round mic" data-act="voice" aria-label="बोलकर खोजें, Voice search">' + ic('mic', 22) + '</button></form>';
  }
  function tiles() {
    return '<div class="tiles">' + CATS.map(c => '<a class="tile" href="#/c/' + c.id + '"><span class="bub ' + c.tint + '">' + ic(c.icon, 22) + '</span>' + bi(c.hi, c.en) + '</a>').join('') + '</div>';
  }
  function collChips() {
    return '<div class="chips" role="group" aria-label="कलेक्शन / Collections">' + COLLS.map(c =>
      '<button class="coll" data-act="coll" data-id="' + c.id + '" aria-pressed="' + (S.coll === c.id) + '">' + ic(c.icon, 20) + '<span style="text-align:left">' + bi(c.hi, c.en) + '</span></button>').join('') + '</div>';
  }
  function filterChips() {
    const f = S.filt;
    const chip = (act, val, on, hi, en) => '<button class="fchip" data-act="' + act + '" data-v="' + val + '" aria-pressed="' + on + '">' + bi(hi, en) + '</button>';
    return '<div class="chips" role="group" aria-label="छाँटें / Filters">' +
      chip('sort', 'new', f.sort === 'new', 'सबसे नया', 'Newest') + chip('sort', 'cheap', f.sort === 'cheap', 'सस्ता पहले', 'Cheapest first') +
      chip('max', '500', f.max === 500, '₹500 तक', 'Under ₹500') + chip('max', '1000', f.max === 1000, '₹1000 तक', 'Under ₹1000') +
      chip('max', '2000', f.max === 2000, '₹2000 तक', 'Under ₹2000') + chip('stock', '1', f.stock, 'स्टॉक में', 'In stock') + '</div>';
  }
  function card(it, small) {
    const p = priceInfo(it, S.settings);
    return '<a class="card' + (it.inStock ? '' : ' out') + '" href="#/p/' + it.id + '"><div class="ph"><img loading="lazy" alt="' + esc(it.name) + '" src="' + pic(it) + '">' +
      (it.isNew ? '<span class="tagnew">नया · NEW</span>' : '') + (it.inStock ? '' : '<span class="tagout">स्टॉक ख़त्म · Sold out</span>') + '</div>' +
      '<div class="body"><div><span class="hi"' + (small ? ' style="font-size:.9rem"' : '') + '>' + esc(it.name) + '</span><span class="en">' + esc(it.nameEn || '') + '</span></div>' +
      '<div class="price"><span class="now">' + fmt(p.now) + '</span>' + (p.mrp ? '<span class="mrp">' + fmt(p.mrp) + '</span><span class="off">' + p.off + '% छूट</span>' : '') + '</div></div></a>';
  }
  function applyFilters(list) {
    const f = S.filt; let out = list.slice();
    if (f.max) out = out.filter(i => PD.salePrice(i, S.settings) <= f.max);
    if (f.stock) out = out.filter(i => i.inStock);
    if (f.sort === 'cheap') out.sort((a, b) => PD.salePrice(a, S.settings) - PD.salePrice(b, S.settings));
    else out.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return out;
  }
  function grid(list, emptyMsg) {
    if (!list.length) return '<div class="empty">' + (emptyMsg || bi('इसमें अभी कुछ नहीं है', 'Nothing here yet — try another filter')) + '</div>';
    const shown = list.slice(0, S.show);
    return '<div class="grid">' + shown.map(i => card(i)).join('') + '</div>' +
      (list.length > S.show ? '<div class="more"><button class="btn" data-act="more">' + bi('और दिखाएँ (' + (list.length - S.show) + ')', 'Show more') + '</button></div>' : '');
  }
  function footer() {
    const st = S.settings; const dark = PD.isDark();
    return '<footer class="foot"><span class="hi">' + esc(st.shopName) + ' &amp; वस्त्रवाटिका</span>' +
      '<span>' + esc(st.address || '[दुकान का पता / Shop address]') + ' · ' + esc(st.hours || '') + '</span>' +
      (st.phone ? '<a href="tel:' + esc(st.phone) + '">कॉल करें · ' + esc(st.phone) + '</a>' : '') +
      '<div class="row" style="flex-wrap:wrap;margin-top:.25rem"><button class="pill-btn" data-act="theme">' + ic('moon', 20) + '<span>' + bi(dark ? 'दिन वाला रंग' : 'रात वाला रंग', dark ? 'Light mode' : 'Dark mode', '.85rem') + '</span></button></div>' +
      (st.instagram ? '<a class="small-link" target="_blank" rel="noopener" href="' + esc(st.instagram) + '">Instagram पर देखें / Instagram</a>' : '') +
      '<a class="small-link" href="#/orders">मेरे ऑर्डर · My orders</a><a class="small-link" href="admin.html">दुकान वाले के लिए · Owner login</a></footer>';
  }
  function bbar(active) {
    const count = S.cart.reduce((a, c) => a + c.qty, 0);
    const st = S.settings;
    const wa = PD.waLink(st.whatsapp, 'नमस्ते, ' + st.shopName + ' — मुझे कपड़ों के बारे में पूछना है।');
    const a = (href, icon, hi, en, cur, cls, extra) => '<a href="' + href + '"' + (cls ? ' class="' + cls + '"' : '') + (cur ? ' aria-current="page"' : '') + (extra || '') + '><span class="icw">' + ic(icon, 24) + '</span><span class="hi">' + hi + '</span><span class="en">' + en + '</span></a>';
    $('#bbar').innerHTML = '<div class="bbar-in" style="display:contents">' +
      a(st.phone ? 'tel:' + st.phone : '#', 'phone', 'कॉल', 'Call', false, '', st.phone ? '' : ' data-act="nophone"') +
      a(wa, 'chat', 'व्हाट्सऐप', 'WhatsApp', false, 'wa', ' target="_blank" rel="noopener"') +
      a('#/', 'home', 'होम', 'Home', active === 'home') +
      a('#/cart', 'cart', 'थैला', 'Cart', active === 'cart', '', '').replace('</span><span class="hi">थैला', '</span>' + (count ? '<span class="badge">' + count + '</span>' : '') + '<span class="hi">थैला') + '</div>';
  }
  function backHead(title, en, extra) {
    return '<div class="row" style="padding:.6rem .75rem .25rem"><button class="round" style="background:transparent;color:var(--ink)" data-act="back" aria-label="वापस, Back">' + ic('back', 24) + '</button>' +
      '<h1 style="margin:0;flex:1">' + bi(title, en, '1.35rem') + '</h1>' + (extra || '') + '</div>';
  }

  /* ---------- views ---------- */
  function viewHome() {
    let list = visible();
    if (S.coll === 'new') list = list.filter(i => i.isNew); else if (S.coll) list = list.filter(i => (i.colls || []).indexOf(S.coll) >= 0);
    list = applyFilters(list);
    const c = S.coll && collById(S.coll);
    app.innerHTML = header() + promises() + banner() + searchBar() + '<div class="pad" style="padding-top:.6rem"><a class="btn block" style="justify-content:flex-start;border:1.5px solid var(--sage)" href="#/order">' + ic('list', 24, 'style="color:var(--sage-d)"') + '<span style="flex:1"><span class="hi" style="font-size:1rem">ऑर्डर फ़ॉर्म — सामान चुनें, पता लिखें</span><span class="en">Quick order form · order on WhatsApp</span></span>' + ic('right', 20) + '</a></div>' + tiles() + collChips() + filterChips() +
      (c ? '<div class="sec-t"><div>' + bi(c.hi + ' · ' + list.length, c.en) + '</div><button class="btn" style="min-height:2.75rem" data-act="coll" data-id="' + c.id + '">' + bi('सब दिखाएँ', 'Show all', '.85rem') + '</button></div>' : '') +
      '<div id="gridwrap">' + grid(list) + '</div>' + footer();
    bbar('home');
  }
  function viewCat(catId, typeId) {
    const c = catById(catId); if (!c) return go('#/');
    const inCat = visible().filter(i => i.cat === catId);
    const types = TYPES.filter(t => t.cat === catId && inCat.some(i => i.type === t.id));
    let list = typeId ? inCat.filter(i => i.type === typeId) : inCat;
    list = applyFilters(list);
    app.innerHTML = backHead(c.hi, c.en + ' · ' + inCat.length + ' items') + searchBar() +
      '<div class="chips" role="group" aria-label="टाइप / Type"><a class="coll" href="#/c/' + catId + '" aria-pressed="' + !typeId + '"><span>' + bi('सब', 'All') + '</span></a>' +
      types.map(t => '<a class="coll" href="#/c/' + catId + '/' + t.id + '" aria-pressed="' + (typeId === t.id) + '"><span>' + bi(t.hi, t.en) + '</span></a>').join('') + '</div>' +
      filterChips() + '<div id="gridwrap">' + grid(list) + '</div>' + footer();
    bbar('');
  }
  function viewSearch(q) {
    const pq = PD.parseQuery(q);
    const r = PD.runSearch(visible(), pq, S.settings);
    const list = r.items;
    const chips = [];
    pq.types.forEach(t => { const T = typeById(t); chips.push({ k: 'type', v: t, hi: T.hi, en: T.en }); });
    if (!pq.types.length) pq.cats.forEach(c => { const C = catById(c); chips.push({ k: 'cat', v: c, hi: C.hi, en: C.en }); });
    pq.colors.forEach(c => { const C = colorById(c); chips.push({ k: 'color', v: c, hi: C.hi, en: C.en, sw: C.hex }); });
    if (pq.maxPrice) chips.push({ k: 'max', v: pq.maxPrice, hi: fmt(pq.maxPrice) + ' तक', en: 'Under ' + fmt(pq.maxPrice) });
    const said = S.voice && S.voice.q === q ? S.voice : null;
    let html = backHead('खोज', 'Search') + searchBar(q);
    if (said) {
      const L = PD.VOICE_LANGS.find(v => v.id === said.lang) || PD.VOICE_LANGS[0];
      const others = list.length ? [] : (said.alts || []).filter(a => a && a !== said.q).slice(0, 2);
      html += '<div class="note terra"><button class="round mic" style="width:2.75rem;height:2.75rem" data-act="voice" aria-label="फिर से बोलें, speak again">' + ic('mic', 20) + '</button><div style="flex:1"><span class="en">आपने कहा · You said (' + L.en + ')</span><span class="hi" style="font-size:1.2rem;margin-top:.1rem">“' + esc(said.q) + '”</span>' +
        (others.length ? '<span class="en" style="margin-top:.35rem">यह तो नहीं कहा? · Did you mean:</span><div class="row" style="flex-wrap:wrap;margin-top:.25rem">' + others.map(o => '<a class="btn" style="min-height:2.75rem;padding:0 .7rem;font-size:.9rem" href="#/s/' + encodeURIComponent(o) + '">' + esc(o) + '</a>').join('') + '</div>' : '') + '</div></div>';
    }
    if (chips.length) html += '<div class="chips" style="flex-wrap:wrap">' + chips.map(c => '<button class="qchip" data-act="dropq" data-k="' + c.k + '" data-v="' + esc(c.v) + '">' + (c.sw ? '<span style="width:1rem;height:1rem;border-radius:.5rem;background:' + c.sw + ';border:1px solid var(--line)"></span>' : '') + '<span style="text-align:left">' + bi(c.hi, c.en, '.88rem') + '</span>' + ic('x', 18, 'role="img" aria-label="हटाएँ, remove"') + '</button>').join('') + '</div>';
    if (r.relaxed) html += '<div class="note warn">' + ic('info', 22) + '<div>' + bi(r.relaxed === 'color' ? 'इस रंग में नहीं मिला — बाकी रंग दिखा रहे हैं' : 'इस दाम में नहीं मिला — थोड़े महँगे दिखा रहे हैं', r.relaxed === 'color' ? 'Not in that colour — showing other colours' : 'Nothing at that price — showing a little above it', '.95rem') + '</div></div>';
    if (list.length) {
      html += '<div class="sec-t"><div>' + bi(list.length + ' मिले', list.length + ' found') + '</div></div><div id="gridwrap">' + grid(list) + '</div>';
      const also = PD.goesWith(visible(), list[0], 6);
      if (also.length) html += '<section class="band"><div class="pad" style="padding-bottom:.6rem">' + bi('इसके साथ जँचेगा', 'You may also like · goes with ' + ((typeById(list[0].type) || {}).en || '').toLowerCase(), '1.12rem') + '</div><div class="rail">' + also.map(i => card(i, true)).join('') + '</div></section>';
    } else {
      html += '<div class="empty">' + bi('कुछ नहीं मिला', 'Nothing found') + '<p style="margin:.6rem 0 0">दूसरे शब्द से खोजें, या दुकान से WhatsApp पर पूछें।<br><span class="en">Try other words, or ask the shop on WhatsApp.</span></p>' +
        '<a class="btn" style="margin-top:.75rem" target="_blank" rel="noopener" href="' + PD.waLink(S.settings.whatsapp, 'नमस्ते, क्या आपके पास यह है: ' + q) + '">' + ic('chat', 22) + bi('WhatsApp पर पूछें', 'Ask on WhatsApp', '.95rem') + '</a></div>';
    }
    app.innerHTML = html + footer();
    bbar('');
  }
  function viewProduct(id) {
    const it = byId(id);
    if (!it) { app.innerHTML = backHead('सामान नहीं मिला', 'Item not found') + '<div class="empty">' + bi('यह सामान अब दुकान में नहीं है', 'This item is no longer in the shop') + '</div>'; bbar(''); return; }
    const p = priceInfo(it, S.settings);
    const photos = (it.photos && it.photos.length) ? it.photos : [PD.placeholderPic(it)];
    const sizes = it.sizes || [];
    if (sizes.length === 1) S.pickSize = sizes[0];
    const t = typeById(it.type) || {}; const c = catById(it.cat) || {};
    const askText = 'नमस्ते, यह सामान के बारे में पूछना है: ' + it.name + ' (' + fmt(p.now) + ')' + (S.pickSize ? ', साइज़ ' + S.pickSize : '') + ' — ' + location.href;
    let html = backHead(c.hi || '', (c.en || '') + (t.en ? ' › ' + t.en : '')) +
      '<article class="pd"><div style="position:relative"><div class="gallery" id="gal">' + photos.map(s => '<img alt="' + esc(it.name) + '" src="' + s + '">').join('') + '</div>' +
      (it.isNew ? '<span class="tagnew" style="top:.9rem;left:.9rem;font-size:.82rem">नया · NEW</span>' : '') + '</div>' +
      (photos.length > 1 ? '<div class="dots" id="dots">' + photos.map((_, i) => '<i class="' + (i ? '' : 'on') + '"></i>').join('') + '</div>' : '') +
      '<div style="padding:.9rem 1rem 0;display:flex;flex-direction:column;gap:.85rem">' +
      '<div>' + bi(esc(it.name), esc(it.nameEn || ''), '1.35rem') + '</div>' +
      '<div class="price"><span class="now" style="font-size:1.8rem;font-weight:800">' + fmt(p.now) + '</span>' + (p.mrp ? '<span style="font-size:.95rem;color:var(--ink2)">MRP <s>' + fmt(p.mrp) + '</s></span><span class="offbadge">' + p.off + '% छूट · off</span>' : '') + '</div>';
    if (sizes.length) {
      html += '<fieldset style="border:0;margin:0;padding:0" id="sizebox"><legend style="padding:0;margin-bottom:.5rem">' + bi('साइज़ चुनें', 'Choose size', '.95rem') + '</legend><div class="sizes">' +
        sizes.map(s => '<button class="size" data-act="size" data-v="' + esc(s) + '" aria-pressed="' + (S.pickSize === s) + '"' + (it.inStock ? '' : ' disabled') + '>' + esc(s === 'Free' ? 'फ़्री' : s) + '</button>').join('') +
        '</div><span class="en" style="margin-top:.4rem">नाप नहीं पता? दुकान पर मुफ़्त फिटिंग · Not sure? Free fitting at shop</span></fieldset>';
    }
    html += it.inStock
      ? '<button class="btn primary block" data-act="add" data-id="' + it.id + '">' + ic('cart', 24) + '<span>' + bi('थैले में डालें', 'Add to cart', '1.12rem') + '</span></button>'
      : '<div class="note warn" style="margin:0">' + ic('info', 22) + '<div>' + bi('अभी स्टॉक ख़त्म है', 'Sold out right now — ask on WhatsApp when it comes back', '.95rem') + '</div></div>';
    html += '<a class="btn block" target="_blank" rel="noopener" href="' + PD.waLink(S.settings.whatsapp, askText) + '">' + ic('chat', 22, 'style="color:var(--sage-d)"') + '<span>' + bi('WhatsApp पर पूछें', 'Ask on WhatsApp', '1rem') + '</span></a>' +
      '<div class="row muted" style="font-size:.9rem;gap:.75rem;flex-wrap:wrap"><span class="row" style="gap:.3rem">' + ic('truck', 18) + 'शहर में आज ही डिलीवरी</span><span class="row" style="gap:.3rem">' + ic('shop', 18) + 'दुकान से भी ले सकते हैं</span></div>' +
      '</div></article>';
    const also = PD.goesWith(visible(), it, 6);
    if (also.length) html += '<section class="band"><div class="pad" style="padding-bottom:.6rem">' + bi('इसके साथ जँचेगा', 'You may also like', '1.12rem') + '</div><div class="rail">' + also.map(i => card(i, true)).join('') + '</div></section>';
    const same = visible().filter(i => i.id !== it.id && i.type === it.type && i.inStock).slice(0, 6);
    if (same.length) html += '<div class="sec-t"><div>' + bi('ऐसे और', 'More like this') + '</div></div><div class="rail" style="margin-top:.6rem">' + same.map(i => card(i, true)).join('') + '</div>';
    app.innerHTML = html + footer();
    const gal = $('#gal');
    if (gal && photos.length > 1) gal.addEventListener('scroll', () => { const i = Math.round(gal.scrollLeft / gal.clientWidth); document.querySelectorAll('#dots i').forEach((d, k) => d.classList.toggle('on', k === i)); }, { passive: true });
    bbar('');
  }

  function cartTotals() {
    const lines = S.cart.map(c => ({ c, it: byId(c.id) })).filter(x => x.it);
    const sub = lines.reduce((a, x) => a + PD.salePrice(x.it, S.settings) * x.c.qty, 0);
    const form = ls.get('pd_customer', {});
    const pickup = form.delivery === 'pickup';
    const fee = pickup || !sub ? 0 : (sub >= (+S.settings.freeAbove || Infinity) ? 0 : (+S.settings.deliveryFee || 0));
    return { lines, sub, fee, total: sub + fee, pickup };
  }
  function lineRows(t) {
    return '<div style="display:flex;flex-direction:column;gap:.6rem;padding:0 1rem">' + t.lines.map((x, i) => {
      const p = PD.salePrice(x.it, S.settings);
      return '<div class="citem"><img alt="" src="' + pic(x.it) + '"><div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:.35rem">' +
        '<div><span class="hi" style="font-size:1rem">' + esc(x.it.name) + '</span><span class="en">' + esc(x.it.nameEn || '') + (x.c.size ? ' · साइज़ / Size ' + esc(x.c.size === 'Free' ? 'फ़्री' : x.c.size) : '') + '</span></div>' +
        '<div class="row" style="justify-content:space-between"><span style="font-family:\'Baloo 2\';font-weight:700;font-size:1.25rem">' + fmt(p * x.c.qty) + '</span>' +
        '<div class="stepper"><button data-act="qty" data-i="' + i + '" data-d="-1" aria-label="एक कम, decrease">−</button><span>' + x.c.qty + '</span><button data-act="qty" data-i="' + i + '" data-d="1" aria-label="एक और, increase">+</button></div></div></div></div>';
    }).join('') + '</div>';
  }
  function detailsForm(t, f) {
    const freeAbove = +S.settings.freeAbove || 0;
    const v = k => esc(f[k] || '');
    return '<div class="summary"><div class="r"><span>' + bi('सामान', 'Items', '.95rem') + '</span><b>' + fmt(t.sub) + '</b></div>' +
      '<div class="r"><span>' + bi('डिलीवरी', t.pickup ? 'Pick up at shop' : (freeAbove ? 'Free above ' + fmt(freeAbove) : 'Delivery'), '.95rem') + '</span><b style="color:' + (t.fee ? 'inherit' : 'var(--sage-d)') + '">' + (t.fee ? fmt(t.fee) : 'मुफ़्त · ₹0') + '</b></div>' +
      '<div style="height:1px;background:var(--line)"></div><div class="r"><span>' + bi('कुल', 'Total', '1.12rem') + '</span><span style="font-family:\'Baloo 2\';font-weight:800;font-size:1.6rem">' + fmt(t.total) + '</span></div></div>' +
      '<form data-form="order" novalidate style="display:flex;flex-direction:column;gap:.9rem;padding:1.4rem 1rem 0">' +
      '<fieldset style="border:0;margin:0;padding:0;display:flex;flex-direction:column;gap:.6rem"><legend style="padding:0;margin-bottom:.6rem">' + bi('सामान कैसे लेंगे?', 'How will you get it?', '1.2rem') + '</legend>' +
      '<label class="radio"><input type="radio" name="delivery" value="home"' + (f.delivery !== 'pickup' ? ' checked' : '') + '><span style="flex:1">' + bi('घर पर डिलीवरी', 'Home delivery · same day in town', '1rem') + '</span>' + ic('truck', 24, 'style="color:var(--ink2)"') + '</label>' +
      '<label class="radio"><input type="radio" name="delivery" value="pickup"' + (f.delivery === 'pickup' ? ' checked' : '') + '><span style="flex:1">' + bi('दुकान से ले जाएँगे', 'Pick up at shop · try it on', '1rem') + '</span>' + ic('shop', 24, 'style="color:var(--ink2)"') + '</label></fieldset>' +
      '<h2 style="margin:.4rem 0 0">' + bi('आपकी जानकारी', 'Your details', '1.2rem') + '</h2>' +
      '<div><label for="o_name" class="lab">' + bi('नाम', 'Name', '.95rem') + '</label><input id="o_name" name="name" class="fld" autocomplete="name" value="' + v('name') + '"></div>' +
      '<div><label for="o_mob" class="lab">' + bi('मोबाइल नंबर (WhatsApp वाला)', 'Mobile number (on WhatsApp)', '.95rem') + '</label><div class="prefix" id="mobbox"><span>+91</span><input id="o_mob" name="mobile" inputmode="numeric" maxlength="10" autocomplete="tel-national" value="' + v('mobile') + '"></div></div>' +
      '<div id="addrbox"><label for="o_addr" class="lab">' + bi('पूरा पता (गाँव / मोहल्ला, पास में क्या है)', 'Full address (village / area, nearby landmark)', '.95rem') + '</label><textarea id="o_addr" name="address" class="fld" rows="3" autocomplete="street-address">' + v('address') + '</textarea></div>' +
      '<div id="pinbox"><label for="o_pin" class="lab">' + bi('पिन कोड', 'PIN code', '.95rem') + '</label><input id="o_pin" name="pin" class="fld" style="max-width:12rem;letter-spacing:.15em" inputmode="numeric" maxlength="6" autocomplete="postal-code" value="' + v('pin') + '"></div>' +
      '<label class="check"><input type="checkbox" name="same" id="o_same"' + (f.same === false ? '' : ' checked') + '><span>' + bi('बिल का पता भी यही है', 'Billing address same as delivery', '.95rem') + '</span></label>' +
      '<div id="billbox"' + (f.same === false ? '' : ' hidden') + '><label for="o_bill" class="lab">' + bi('बिल का पता', 'Billing address', '.95rem') + '</label><textarea id="o_bill" name="bill" class="fld" rows="2">' + v('bill') + '</textarea></div>' +
      '<div><label for="o_note" class="lab">' + bi('कुछ और बताना है? (चाहें तो)', 'Anything else? (optional) — colour, time to deliver…', '.95rem') + '</label><input id="o_note" name="note" class="fld" value="' + v('note') + '"></div>' +
      '<fieldset style="border:0;margin:.4rem 0 0;padding:0;display:flex;flex-direction:column;gap:.6rem"><legend style="padding:0;margin-bottom:.6rem">' + bi('पैसे कैसे देंगे?', 'How will you pay?', '1.2rem') + '</legend>' +
      payRadio('upi', 'UPI से (दुकान लिंक भेजेगी)', 'UPI · shop sends a payment link on WhatsApp', f.pay, '<span style="font-weight:800;font-size:.82rem;border:1.5px solid currentColor;border-radius:.4rem;padding:.1rem .4rem;color:var(--sage-d)">UPI</span>') +
      payRadio('cod', 'सामान मिलने पर नकद', 'Cash on delivery', f.pay, ic('cash', 24, 'style="color:var(--ink2)"')) +
      payRadio('shop', 'दुकान पर आकर दें', 'Pay at the shop', f.pay, ic('shop', 24, 'style="color:var(--ink2)"')) + '</fieldset>' +
      '<button type="submit" class="btn primary big block" style="margin-top:.5rem;box-shadow:0 6px 18px rgba(79,122,104,.28)">' + ic('chat', 28) + '<span>' + bi('WhatsApp पर ऑर्डर भेजें', 'Send order on WhatsApp · ' + fmt(t.total), '1.25rem') + '</span></button>' +
      '<span class="en" style="text-align:center;font-size:.82rem">ऑर्डर नंबर के साथ सीधे दुकान के WhatsApp पर जाएगा · Goes to the shop with an order number</span></form>';
  }
  function viewCart() {
    const t = cartTotals(); const f = ls.get('pd_customer', {});
    let html = backHead('आपका थैला', t.lines.length ? t.lines.reduce((a, x) => a + x.c.qty, 0) + ' चीज़ें · items' : 'Your cart');
    if (!t.lines.length) {
      app.innerHTML = html + '<div class="empty">' + bi('थैला खाली है', 'Your cart is empty') +
        '<div style="display:flex;flex-direction:column;gap:.6rem;margin-top:.9rem"><a class="btn primary" href="#/order">' + ic('list', 22) + '<span>' + bi('ऑर्डर फ़ॉर्म भरें', 'Fill the order form', '1rem') + '</span></a><a class="btn" href="#/">' + bi('कपड़े देखें', 'Browse clothes') + '</a></div></div>' + footer();
      bbar('cart'); return;
    }
    html += lineRows(t) + '<div class="pad" style="padding-top:.6rem"><a class="btn block" href="#/order">' + ic('plus', 22) + '<span>' + bi('और सामान चुनें', 'Choose more items', '.95rem') + '</span></a></div>' + detailsForm(t, f);
    app.innerHTML = html + footer();
    syncDeliveryUI();
    bbar('cart');
  }
  /* quick order form: choose products right here, then address */
  S.of = { q: '', cat: 'all', size: {}, show: 20 };
  function pickerList() {
    const q = PD.norm(S.of.q);
    let list = visible().filter(i => i.inStock && (S.of.cat === 'all' || i.cat === S.of.cat));
    if (q) {
      const pq = PD.parseQuery(S.of.q); const r = PD.runSearch(list, pq, S.settings);
      list = r.items.length ? r.items : list.filter(i => PD.norm(i.name + ' ' + (i.nameEn || '')).indexOf(q) >= 0);
    } else list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (!list.length) return '<div class="empty">' + bi('कुछ नहीं मिला', 'Nothing found — try another word', '1rem') + '</div>';
    return list.slice(0, S.of.show).map(it => {
      const p = PD.priceInfo(it, S.settings); const sizes = it.sizes || [];
      const picked = S.of.size[it.id] || (sizes.length === 1 ? sizes[0] : '');
      const inCart = S.cart.filter(c => c.id === it.id).reduce((a, c) => a + c.qty, 0);
      return '<div class="citem" style="flex-direction:column;gap:.55rem"><div class="row" style="gap:.75rem;align-items:flex-start"><img alt="" loading="lazy" src="' + pic(it) + '" style="width:4.25rem;height:5rem">' +
        '<div style="flex:1;min-width:0"><span class="hi" style="font-size:1rem">' + esc(it.name) + '</span><span class="en">' + esc(it.nameEn || '') + '</span>' +
        '<div class="price" style="margin-top:.2rem"><span class="now" style="font-size:1.15rem">' + fmt(p.now) + '</span>' + (p.mrp ? '<span class="mrp">' + fmt(p.mrp) + '</span>' : '') + '</div></div>' +
        (inCart ? '<span style="background:var(--sage-t);color:var(--sage-d);font-weight:700;font-size:.8rem;padding:.2rem .5rem;border-radius:.5rem;white-space:nowrap">थैले में ' + inCart + '</span>' : '') + '</div>' +
        (sizes.length > 1 ? '<div class="row" style="flex-wrap:wrap;gap:.4rem" role="group" aria-label="साइज़ · size">' + sizes.map(s => '<button class="size" style="min-width:3rem;min-height:2.9rem;padding:0 .6rem" data-act="ofsize" data-id="' + it.id + '" data-v="' + esc(s) + '" aria-pressed="' + (picked === s) + '">' + esc(s === 'Free' ? 'फ़्री' : s) + '</button>').join('') + '</div>' : '') +
        '<button class="btn primary block" style="min-height:3rem" data-act="ofadd" data-id="' + it.id + '">' + ic('plus', 22) + '<span>' + bi(inCart ? 'एक और जोड़ें' : 'ऑर्डर में जोड़ें', inCart ? 'Add one more' : 'Add to order', '.98rem') + '</span></button></div>';
    }).join('');
  }
  function viewOrder() {
    const t = cartTotals(); const f = ls.get('pd_customer', {});
    let html = backHead('ऑर्डर फ़ॉर्म', 'Order form · choose items, then your address') +
      '<section><div class="pad" style="padding-top:.25rem">' + bi('1. सामान चुनें', 'Choose what you want', '1.2rem') + '</div>' +
      '<form class="search" data-form="ofsearch" role="search"><span class="muted" aria-hidden="true">' + ic('search', 22) + '</span><label for="ofq" class="sr">सामान खोजें</label>' +
      '<input id="ofq" type="search" autocomplete="off" value="' + esc(S.of.q) + '" placeholder="जैसे: नीली कमीज़ · e.g. kurti"><button type="button" class="round mic" data-act="ofvoice" aria-label="बोलकर खोजें, voice">' + ic('mic', 22) + '</button></form>' +
      '<div class="chips" role="group" aria-label="कैटेगरी"><button class="fchip" data-act="ofcat" data-v="all" aria-pressed="' + (S.of.cat === 'all') + '">' + bi('सब', 'All') + '</button>' +
      CATS.map(c => '<button class="fchip" data-act="ofcat" data-v="' + c.id + '" aria-pressed="' + (S.of.cat === c.id) + '">' + bi(c.hi, c.en.split(' ·')[0]) + '</button>').join('') + '</div>' +
      '<div id="oflist" style="display:flex;flex-direction:column;gap:.6rem;padding:.75rem 1rem 0;max-height:34rem;overflow:auto">' + pickerList() + '</div></section>';
    html += '<section style="margin-top:1.25rem;padding-top:1rem;border-top:1px solid var(--line)"><div class="pad" style="padding-bottom:.6rem">' + bi('2. आपका ऑर्डर', t.lines.length ? 'Your order' : 'Your order — nothing chosen yet', '1.2rem') + '</div>' +
      (t.lines.length ? lineRows(t) : '<div class="empty" style="margin-top:0">' + bi('ऊपर से सामान चुनें', 'Choose items above', '1rem') + '</div>') + '</section>';
    if (t.lines.length) html += '<div class="pad" style="padding-top:1rem">' + bi('3. पता और भुगतान', 'Address and payment', '1.2rem') + '</div>' + detailsForm(t, f);
    app.innerHTML = html + footer();
    syncDeliveryUI();
    bbar('');
  }
  const isOrderPage = () => (location.hash || '').indexOf('#/order') === 0;
  function refreshOrder() { const y = window.scrollY; if (isOrderPage()) viewOrder(); else viewCart(); window.scrollTo(0, y); }

  function payRadio(v, hi, en, cur, right) {
    return '<label class="radio"><input type="radio" name="pay" value="' + v + '"' + ((cur || 'upi') === v ? ' checked' : '') + '><span style="flex:1">' + bi(hi, en, '1rem') + '</span>' + right + '</label>';
  }
  function syncDeliveryUI() {
    const form = document.querySelector('[data-form="order"]'); if (!form) return;
    const pickup = form.delivery.value === 'pickup';
    $('#addrbox').hidden = pickup; $('#pinbox').hidden = pickup;
  }
  function viewPhoto() {
    const r = S.photo;
    if (!r) return go('#/');
    const col = colorById(r.sig.colorId);
    let html = backHead('फ़ोटो से खोज', 'Photo search') +
      '<div class="row" style="padding:.25rem 1rem 0;align-items:flex-start;gap:.9rem"><img alt="आपकी फ़ोटो / your photo" src="' + r.src + '" style="width:6.5rem;height:8rem;object-fit:cover;border-radius:1rem;border:3px solid var(--sf);box-shadow:var(--shadow)">' +
      '<div style="flex:1;display:flex;flex-direction:column;gap:.5rem">' + bi('आपकी फ़ोटो में', 'We see in your photo', '1rem') +
      '<span class="row" style="padding:.25rem .6rem;border-radius:.6rem;background:var(--sage-t);font-weight:600;align-self:flex-start"><span style="width:.8rem;height:.8rem;border-radius:.4rem;background:' + col.hex + ';border:1px solid var(--line)"></span>' + col.hi + ' <span class="en" style="display:inline">' + col.en + '</span></span>' +
      '<button class="pill-btn" style="align-self:flex-start" data-act="photo">' + ic('camera', 20) + '<span>' + bi('दूसरी फ़ोटो', 'Retake photo', '.88rem') + '</span></button></div></div>';
    if (r.exact.length) {
      html += '<div class="note sage">' + ic('check', 24, 'style="color:var(--sage-d)"') + '<div>' + bi('यही सामान मिल गया!', 'Found this exact item', '1.05rem') + '</div></div><div class="grid">' + r.exact.map(i => card(i)).join('') + '</div>';
      html += '<div class="sec-t"><div>' + bi('और मिलते-जुलते', 'More similar items') + '</div></div>';
    } else {
      html += '<div class="note terra" role="status">' + ic('search', 24, 'style="color:var(--terra-d)"') + '<div>' + bi('बिल्कुल ऐसा नहीं मिला', 'No exact match — showing similar items', '1.05rem') + '</div></div>' +
        '<div class="sec-t"><div>' + bi('मिलते-जुलते कपड़े', 'Similar items') + '</div></div>';
    }
    html += '<div class="grid">' + r.similar.slice(0, 8).map(i => card(i)).join('') + '</div>' +
      '<a class="btn block" style="margin:1.1rem 1rem 0;width:auto" target="_blank" rel="noopener" href="' + PD.waLink(S.settings.whatsapp, 'नमस्ते, मैं एक फ़ोटो भेज रहा/रही हूँ — क्या आपके पास ऐसा कपड़ा है?') + '">' + ic('chat', 22, 'style="color:var(--sage-d)"') + '<span>' + bi('दुकान में और भी है — यही फ़ोटो WhatsApp पर भेजें', 'More in the shop — send this photo on WhatsApp', '.95rem') + '</span></a>';
    app.innerHTML = html + footer();
    bbar('');
  }
  function myOrders() { return ls.get('pd_orders', {}); }
  function saveMyOrder(o) { const all = myOrders(); const old = all[o.id]; if (!old || (o.h || []).length >= (old.h || []).length) { all[o.id] = Object.assign({}, old || {}, o); ls.set('pd_orders', all); } return all[o.id]; }
  function viewDone() {
    const o = S.lastOrder;
    if (!o) return go('#/');
    const mine = myOrders()[o.id];
    let html = '<div style="padding:2rem 1rem 0;text-align:center;display:flex;flex-direction:column;align-items:center;gap:.75rem">' +
      '<span class="round" style="width:4.5rem;height:4.5rem;border-radius:2.25rem;background:var(--ok);color:var(--bg)">' + ic('check', 40, 'style="stroke-width:3"') + '</span>' +
      bi('ऑर्डर WhatsApp पर भेज दिया ✓', 'Order sent on WhatsApp', '1.5rem') +
      (o.id ? '<div style="padding:.6rem 1.1rem;border-radius:1rem;background:var(--sf2)"><span class="en">ऑर्डर नंबर · Order number</span><span style="font-family:\'Baloo 2\';font-weight:800;font-size:1.6rem;letter-spacing:.04em">' + esc(o.id) + '</span></div>' : '') +
      '<p class="muted" style="margin:0">WhatsApp में भेजें (Send) दबाना न भूलें। WhatsApp नहीं खुला? नीचे बटन दबाएँ।<br><span class="en">Remember to press Send in WhatsApp. Didn’t open? Tap below.</span></p>' +
      '<a class="btn block" target="_blank" rel="noopener" href="' + o.link + '">' + ic('chat', 22) + bi('फिर से WhatsApp खोलें', 'Open WhatsApp again', '1rem') + '</a></div>';
    html += '<section class="note sage" style="flex-direction:column;gap:.5rem;margin-top:1.25rem">' + bi('आगे क्या होगा?', 'What happens next', '1.1rem') +
      '<ol style="margin:0;padding-left:1.2rem;display:flex;flex-direction:column;gap:.35rem;font-size:.95rem">' +
      '<li>दुकान WhatsApp पर ऑर्डर पक्का करेगी <span class="en" style="display:inline">· the shop confirms on WhatsApp</span></li>' +
      (o.pay === 'upi' ? '<li>दुकान UPI भुगतान लिंक भेजेगी — उसे दबाकर पैसे भेजें <span class="en" style="display:inline">· tap the payment link the shop sends</span></li>' : '') +
      '<li>हर कदम पर ट्रैकिंग लिंक आएगा — पैक, रास्ते में, पहुँच गया <span class="en" style="display:inline">· tracking link at every step</span></li></ol></section>';
    html += '<div class="pad" style="display:flex;flex-direction:column;gap:.6rem;padding-top:1rem">' + (mine ? '<a class="btn primary block" href="#/mo/' + esc(o.id) + '">' + ic('truckgo', 22) + '<span>' + bi('ऑर्डर की स्थिति देखें', 'See order status', '1rem') + '</span></a>' : '') +
      '<a class="btn block" href="#/">' + bi('और ख़रीदारी करें', 'Continue shopping', '.95rem') + '</a></div>';
    app.innerHTML = html + footer();
    bbar('');
  }
  let qrLib = null;
  function loadQR() {
    if (window.qrcode) return Promise.resolve(window.qrcode);
    if (qrLib) return qrLib;
    qrLib = new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'; sc.onload = () => res(window.qrcode); sc.onerror = rej; document.head.appendChild(sc); });
    return qrLib;
  }
  function trackHtml(o) {
    const flow = PD.orderFlow(o.py, o.d);
    const cancelled = o.st === 'cancel';
    const cur = flow.indexOf(o.st);
    const when = st => { const e = (o.h || []).filter(x => x[0] === st).pop(); return e ? PD.timeAgo(e[1]) : ''; };
    const amt = o.amt || o.tot;
    const step = PD.ORDER_STEPS[o.st] || PD.ORDER_STEPS.new;
    let html = backHead('ऑर्डर ' + esc(o.id), 'Order status · ' + (o.n ? esc(o.n) : ''));
    html += '<div class="note ' + (cancelled ? 'warn' : o.st === 'done' || o.st === 'picked' ? 'sage' : 'terra') + '" role="status"><span class="round" style="width:2.75rem;height:2.75rem;background:' + (cancelled ? 'var(--warn)' : 'var(--sage)') + ';color:var(--bg)">' + ic(cancelled ? 'x' : o.st === 'out' ? 'truckgo' : 'check', 22, 'style="stroke-width:2.6"') + '</span>' +
      '<div><span class="en">अभी की स्थिति · Current status</span>' + bi(step.hi, step.en, '1.3rem') + '</div></div>';
    if (o.st === 'pay') {
      html += '<section class="ocard-c"><div>' + bi('भुगतान करें', 'Pay now', '1.2rem') + '</div><span style="font-family:\'Baloo 2\';font-weight:800;font-size:2.2rem;line-height:1">' + fmt(amt) + '</span>' +
        (o.pa ? '<a class="btn primary big block" href="' + esc(PD.upiLink(o.pa, o.pn || S.settings.shopNameEn, amt, 'Order ' + o.id)) + '">' + ic('rupee', 26) + '<span>' + bi('UPI ऐप से ' + fmt(amt) + ' भेजें', 'Pay with PhonePe / Google Pay / Paytm', '1.15rem') + '</span></a>' +
          '<div class="row" style="justify-content:space-between;gap:.5rem;padding:.6rem .8rem;border-radius:.9rem;background:var(--sf2)"><span><span class="en">UPI ID</span><b style="font-size:1.05rem;word-break:break-all">' + esc(o.pa) + '</b></span><button class="btn" style="min-height:2.9rem" data-act="copyupi" data-v="' + esc(o.pa) + '">' + bi('कॉपी', 'Copy', '.85rem') + '</button></div>' +
          '<div id="qr" style="display:flex;flex-direction:column;align-items:center;gap:.3rem"></div>' : '') +
        (o.rz ? '<a class="btn ' + (o.pa ? '' : 'primary big ') + 'block" target="_blank" rel="noopener" href="' + esc(o.rz) + '">' + bi('भुगतान लिंक खोलें', 'Open payment link (card / UPI / net banking)', '1rem') + '</a>' : '') +
        '<a class="btn block" target="_blank" rel="noopener" href="' + PD.waLink(S.settings.whatsapp, 'नमस्ते, मैंने ऑर्डर ' + o.id + ' का ' + fmt(amt) + ' भुगतान कर दिया है। स्क्रीनशॉट भेज रहा/रही हूँ।') + '">' + ic('chat', 22, 'style="color:var(--sage-d)"') + '<span>' + bi('भुगतान कर दिया? दुकान को बताएँ', 'Paid? Tell the shop (send the screenshot)', '.95rem') + '</span></a></section>';
    }
    if (o.st === 'out' && (o.dp || o.eta)) {
      html += '<section class="ocard-c">' + bi('डिलीवरी', 'Delivery', '1.1rem') + (o.eta ? '<span style="font-weight:700;font-size:1.1rem">' + esc(o.eta) + ' तक पहुँचेगा</span>' : '') +
        (o.dp && o.dp.n ? '<span>' + esc(o.dp.n) + ' सामान लेकर आ रहे हैं · is bringing your order</span>' : '') +
        (o.dp && o.dp.m ? '<a class="btn primary block" href="tel:+91' + esc(o.dp.m) + '">' + ic('phone', 22) + '<span>' + bi('डिलीवरी वाले को कॉल करें', 'Call delivery person', '1rem') + '</span></a>' : '') +
        (o.py === 'cod' ? '<span class="note warn" style="margin:0">' + fmt(amt) + ' नकद तैयार रखें · keep cash ready</span>' : '') + '</section>';
    }
    if (o.st === 'ready') html += '<section class="ocard-c">' + bi('दुकान से ले जाएँ', 'Collect from the shop', '1.1rem') + '<span>' + esc(S.settings.address || '[दुकान का पता]') + '</span><span class="en">' + esc(S.settings.hours || '') + '</span></section>';
    // timeline
    html += '<section class="pad" style="padding-top:1.1rem"><div style="margin-bottom:.6rem">' + bi('ऑर्डर कहाँ तक पहुँचा', 'Order progress', '1.1rem') + '</div><ol class="tline">' +
      flow.map((st, i) => {
        const S2 = PD.ORDER_STEPS[st]; const state = cancelled ? (when(st) ? 'done' : 'todo') : (i < cur ? 'done' : i === cur ? 'now' : 'todo');
        return '<li class="' + state + '"><span class="dot">' + (state === 'todo' ? '' : ic('check', 14, 'style="stroke-width:3.2"')) + '</span><span>' + bi(S2.hi, S2.en, '1rem') + (when(st) ? '<span class="en">' + when(st) + '</span>' : '') + '</span></li>';
      }).join('') + (cancelled ? '<li class="now cancel"><span class="dot">' + ic('x', 14, 'style="stroke-width:3.2"') + '</span><span>' + bi('रद्द हुआ', 'Cancelled', '1rem') + '<span class="en">' + when('cancel') + '</span></span></li>' : '') + '</ol></section>';
    // items
    html += '<section class="summary" style="margin-top:1.1rem">' + bi('सामान', 'Items', '1.05rem') +
      (o.l || []).map(x => '<div class="r"><span>' + esc(x[0]) + (x[1] ? ' <span class="en" style="display:inline">(' + esc(x[1] === 'Free' ? 'फ़्री' : x[1]) + ')</span>' : '') + ' × ' + x[2] + '</span><b>' + (x[3] ? fmt(x[3] * x[2]) : '') + '</b></div>').join('') +
      '<div style="height:1px;background:var(--line)"></div><div class="r"><span>' + bi('कुल', 'Total · ' + (PD.PAY_TXT[o.py] || {}).en, '1.05rem') + '</span><span style="font-family:\'Baloo 2\';font-weight:800;font-size:1.4rem">' + fmt(amt) + '</span></div></section>';
    html += '<div class="pad" style="display:flex;flex-direction:column;gap:.6rem;padding-top:1rem"><a class="btn block" target="_blank" rel="noopener" href="' + PD.waLink(S.settings.whatsapp, 'नमस्ते, मेरे ऑर्डर ' + o.id + ' के बारे में पूछना है।') + '">' + ic('chat', 22, 'style="color:var(--sage-d)"') + '<span>' + bi('इस ऑर्डर के बारे में पूछें', 'Ask about this order on WhatsApp', '.95rem') + '</span></a>' +
      '<a class="btn block" href="#/orders">' + ic('list', 22) + '<span>' + bi('मेरे सारे ऑर्डर', 'All my orders', '.95rem') + '</span></a></div>';
    return html;
  }
  function afterTrack(o) {
    const box = $('#qr');
    if (box && o.pa) loadQR().then(qrcode => {
      const qr = qrcode(0, 'M'); qr.addData(PD.upiLink(o.pa, o.pn || S.settings.shopNameEn, o.amt || o.tot, 'Order ' + o.id)); qr.make();
      box.innerHTML = '<div style="background:#fff;padding:.6rem;border-radius:.9rem;width:11rem;height:11rem">' + qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true }) + '</div><span class="en">दूसरे फ़ोन से स्कैन करके भी भुगतान कर सकते हैं · or scan from another phone</span>';
    }).catch(() => { /* QR is optional */ });
  }
  async function viewTrack(tok) {
    app.innerHTML = backHead('ऑर्डर', 'Loading…');
    let o;
    try { o = await PD.decodeToken(tok); } catch (e) {
      app.innerHTML = backHead('लिंक नहीं खुला', 'Link not readable') + '<div class="empty">' + bi('यह लिंक अधूरा लगता है', 'This link looks incomplete — open the full link from WhatsApp, or ask the shop', '1rem') + '</div>' + footer(); bbar(''); return;
    }
    o = saveMyOrder(o);
    app.innerHTML = trackHtml(o) + footer(); afterTrack(o); bbar('');
  }
  function viewMyOrder(id) {
    const o = myOrders()[id];
    if (!o) return go('#/orders');
    app.innerHTML = trackHtml(o) + footer(); afterTrack(o); bbar('');
  }
  function viewMyOrders() {
    const list = Object.values(myOrders()).sort((a, b) => (b.t || 0) - (a.t || 0));
    let html = backHead('मेरे ऑर्डर', 'My orders · on this phone');
    if (!list.length) html += '<div class="empty">' + bi('अभी कोई ऑर्डर नहीं', 'No orders yet', '1rem') + '<a class="btn primary" style="margin-top:.9rem" href="#/order">' + bi('ऑर्डर फ़ॉर्म भरें', 'Fill the order form', '1rem') + '</a></div>';
    else html += '<div style="display:flex;flex-direction:column;gap:.6rem;padding:0 1rem">' + list.map(o => {
      const st = PD.ORDER_STEPS[o.st] || PD.ORDER_STEPS.new;
      return '<a class="citem" style="text-decoration:none;color:var(--ink);align-items:center" href="#/mo/' + esc(o.id) + '"><div style="flex:1"><b style="font-size:1.05rem">' + esc(o.id) + '</b><span class="en">' + (o.t ? PD.timeAgo(o.t) : '') + ' · ' + (o.l || []).reduce((a, x) => a + x[2], 0) + ' items · ' + fmt(o.amt || o.tot) + '</span></div>' +
        '<span style="padding:.25rem .6rem;border-radius:.6rem;background:' + (o.st === 'pay' ? 'var(--terra-t)' : 'var(--sage-t)') + ';font-weight:700;font-size:.85rem;text-align:center;line-height:1.15">' + st.hi + '<span style="display:block;font-size:.72rem;font-weight:500">' + st.en + '</span></span></a>';
    }).join('') + '</div><p class="en pad" style="margin-top:.75rem">नई स्थिति दुकान के WhatsApp लिंक से आती है · Status updates arrive as links from the shop on WhatsApp</p>';
    app.innerHTML = html + footer(); bbar('');
  }

  /* ---------- actions ---------- */
  function toast(kind, hi, en, actionHtml, ms) {
    const box = $('#toasts'); const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.innerHTML = '<span class="tic">' + ic(kind === 'ok' ? 'check' : kind === 'err' ? 'alert' : 'info', 18, 'style="stroke-width:3"') + '</span><span style="flex:1"><b>' + hi + '</b><span class="sub">' + (en || '') + '</span></span>' + (actionHtml || '');
    while (box.children.length >= 2) box.firstChild.remove();
    box.appendChild(el);
    setTimeout(() => el.remove(), ms || 3500);
    return el;
  }
  function saveCart() { ls.set('pd_cart', S.cart); }
  function go(h) { if (location.hash === h) route(); else location.hash = h; }

  function addToCart(id) {
    const it = byId(id); if (!it) return;
    const sizes = it.sizes || [];
    if (sizes.length > 1 && !S.pickSize) {
      toast('err', 'पहले साइज़ चुनें', 'Please choose a size first');
      const sb = $('#sizebox'); if (sb) { sb.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      return;
    }
    const size = S.pickSize || sizes[0] || '';
    const ex = S.cart.find(c => c.id === id && c.size === size);
    if (ex) ex.qty++; else S.cart.push({ id, size, qty: 1 });
    saveCart(); bbar('');
    toast('ok', 'थैले में डाल दिया ✓', it.name + (size ? ' · ' + (size === 'Free' ? 'फ़्री साइज़' : size) : ''), '<a class="btn" style="min-height:2.75rem;padding:0 .7rem" href="#/cart">थैला देखें</a>');
  }

  async function submitOrder(form) {
    const val = n => (form[n] && form[n].value || '').trim();
    const data = { delivery: form.delivery.value, name: val('name'), mobile: val('mobile').replace(/\D/g, ''), address: val('address'), pin: val('pin').replace(/\D/g, ''), same: form.same.checked, bill: val('bill'), note: val('note'), pay: form.pay.value };
    ls.set('pd_customer', data);
    // friendly validation
    form.querySelectorAll('.ferr').forEach(e => e.remove()); form.querySelectorAll('.bad').forEach(e => e.classList.remove('bad'));
    const errs = [];
    const bad = (el, hi, en) => { el.classList.add('bad'); el.insertAdjacentHTML('afterend', '<span class="ferr">' + hi + '<span class="en">' + en + '</span></span>'); errs.push(el); };
    if (!data.name) bad(form.name, 'अपना नाम लिखें', 'Please write your name');
    if (data.mobile.length !== 10) bad($('#mobbox'), 'मोबाइल नंबर 10 अंक का होना चाहिए', 'Mobile number should have 10 digits');
    if (data.delivery === 'home') {
      if (data.address.length < 6) bad(form.address, 'पूरा पता लिखें, ताकि सामान सही जगह पहुँचे', 'Please write the full address');
      if (data.pin.length !== 6) bad(form.pin, 'पिन कोड 6 अंक का होता है', 'PIN code has 6 digits');
    }
    if (!data.same && !data.bill) bad(form.bill, 'बिल का पता लिखें', 'Please write the billing address');
    if (errs.length) { errs[0].scrollIntoView({ behavior: 'smooth', block: 'center' }); toast('err', 'थोड़ी जानकारी बाकी है', 'A few details are missing'); return; }
    const t = cartTotals();
    if (!t.lines.length) { toast('err', 'पहले सामान चुनें', 'Choose at least one item first'); return; }
    const id = PD.newOrderId(); const now = Date.now();
    const order = { id, t: now, c: { n: data.name, m: data.mobile, a: data.address, p: data.pin, b: data.same ? '' : data.bill, x: data.note || '' }, d: data.delivery, py: data.pay,
      l: t.lines.map(x => [x.it.id, x.c.size || '', x.c.qty, PD.salePrice(x.it, S.settings), x.it.name]), s: t.sub, f: t.fee, tot: t.total };
    const payTxt = { upi: 'UPI (लिंक भेजें)', cod: 'सामान मिलने पर नकद (COD)', shop: 'दुकान पर' }[data.pay];
    const lines = t.lines.map((x, i) => (i + 1) + ') ' + x.it.name + (x.c.size ? ' (' + (x.c.size === 'Free' ? 'फ़्री साइज़' : x.c.size) + ')' : '') + ' × ' + x.c.qty + ' = ' + fmt(PD.salePrice(x.it, S.settings) * x.c.qty));
    // remember on this phone so the customer can follow it
    saveMyOrder({ id, t: now, st: 'new', h: [['new', now]], n: data.name, l: order.l.map(x => [x[4], x[1], x[2], x[3]]), tot: t.total, py: data.pay, d: data.delivery });
    S.cart = []; saveCart();
    const link = await PD.openWhatsAppLater(async () => {
      const tok = await PD.encodeToken(order);
      const ownerLink = new URL('admin.html#/in/' + tok, location.href).href;
      const msg = ['नया ऑर्डर ' + id + ' — ' + S.settings.shopName, '', ...lines, '', 'सामान: ' + fmt(t.sub), 'डिलीवरी: ' + (t.pickup ? 'दुकान से लेंगे' : (t.fee ? fmt(t.fee) : 'मुफ़्त')), 'कुल: ' + fmt(t.total), '',
        'नाम: ' + data.name, 'मोबाइल: +91 ' + data.mobile,
        ...(data.delivery === 'home' ? ['पता: ' + data.address, 'PIN: ' + data.pin] : []),
        'बिल का पता: ' + (data.same ? 'वही' : data.bill), 'भुगतान: ' + payTxt, ...(data.note ? ['नोट: ' + data.note] : []), '',
        'दुकान के लिए — मालिक पैनल में खोलें:', ownerLink].join('\n');
      return PD.waLink(S.settings.whatsapp, msg);
    });
    S.lastOrder = { id, link, total: t.total, pay: data.pay, at: now };
    ls.set('pd_last_order', S.lastOrder);
    go('#/done');
  }

  /* voice search: Hindi / Bhojpuri (hi-IN) or English (en-IN) */
  let rec = null, voiceSheet = null;
  function closeVoice() { if (rec) { try { rec.abort(); } catch (e) { /* ignore */ } rec = null; } if (voiceSheet) { voiceSheet.remove(); voiceSheet = null; } }
  function voiceSheetHtml(lang, state, heard) {
    const L = PD.VOICE_LANGS.find(v => v.id === lang);
    const listening = state === 'listening';
    return '<div class="sheet" role="dialog" aria-modal="true" aria-label="बोलकर खोजें · Voice search"><span class="handle"></span>' +
      '<div class="seg" role="group" aria-label="भाषा · Language" style="display:grid;grid-template-columns:1fr 1fr;border-radius:1rem;overflow:hidden;border:1.5px solid var(--line)">' +
      PD.VOICE_LANGS.map(v => '<button data-act="vlang" data-v="' + v.id + '" aria-pressed="' + (v.id === lang) + '" style="min-height:3.5rem;border:0;background:' + (v.id === lang ? 'var(--sage)' : 'var(--sf)') + ';color:' + (v.id === lang ? 'var(--on-sage)' : 'var(--ink)') + ';line-height:1.15"><span style="display:block;font-weight:700;font-size:1rem">' + v.hi + '</span><span style="font-size:.75rem">' + v.en + '</span></button>').join('') + '</div>' +
      '<div class="listen">' +
      (listening ? '<span class="pulse">' + ic('mic', 44) + '</span>' : '<button class="round" data-act="vstart" style="width:6rem;height:6rem;border-radius:3rem;background:var(--terra);color:var(--on-terra)" aria-label="फिर से बोलें, speak again">' + ic('mic', 44) + '</button>') +
      (listening ? bi(lang === 'en-IN' ? 'Speak now…' : 'बोलिए…', lang === 'en-IN' ? 'बोलिए — अंग्रेज़ी में' : 'Speak now — Hindi or Bhojpuri', '1.25rem') : bi('माइक दबाकर बोलें', 'Tap the mic and speak', '1.15rem')) +
      '<span class="muted" style="font-size:.9rem">जैसे · e.g. “' + esc(L.example) + '”</span>' +
      '<span id="heard" style="min-height:1.6rem;font-weight:600;font-size:1.1rem">' + esc(heard || '') + '</span>' +
      '<button class="btn" data-act="stopvoice">' + bi('बंद करें', 'Close', '.95rem') + '</button></div></div>';
  }
  function startVoice(lang) {
    lang = lang || PD.voiceLang();
    if (!PD.voiceSupported()) { const t = PD.voiceErrorText('unsupported'); toast('err', t[0], t[1], null, 6000); return; }
    if (rec) { try { rec.abort(); } catch (e) { /* ignore */ } rec = null; }
    if (!voiceSheet) { voiceSheet = document.createElement('div'); voiceSheet.className = 'scrim'; voiceSheet.addEventListener('click', e => { if (e.target === voiceSheet) closeVoice(); }); document.body.appendChild(voiceSheet); }
    voiceSheet.innerHTML = voiceSheetHtml(lang, 'listening');
    const myRec = PD.listen({
      lang, score: PD.scoreQuery,
      onInterim: txt => { const h = $('#heard'); if (h) h.textContent = txt; },
      onFinal: (q, alts) => {
        if (rec !== myRec) return;
        rec = null; closeVoice();
        S.voice = { q, lang, alts }; S.show = 24; go('#/s/' + encodeURIComponent(q));
      },
      onError: code => {
        if (rec !== myRec || code === 'aborted') return;
        rec = null;
        const t = PD.voiceErrorText(code);
        if (code === 'no-speech' && voiceSheet) { voiceSheet.innerHTML = voiceSheetHtml(lang, 'idle'); const h = $('#heard'); if (h) { h.textContent = t[0]; h.style.color = 'var(--err)'; } return; }
        closeVoice(); toast('err', t[0], t[1], null, 6000);
      }
    });
    rec = myRec;
    if (!myRec) closeVoice();
  }

  async function onPhoto(file) {
    if (!file) return;
    const t = toast('info', 'फ़ोटो देख रहे हैं…', 'Looking at your photo…', null, 8000);
    try {
      const src = await PD.compressPhoto(file, 640, 0.75);
      const sig = await PD.analyseImage(src);
      const m = PD.photoMatch(visible(), sig);
      S.photo = { src, sig, exact: m.exact, similar: m.similar };
      t.remove(); go('#/photo'); if (location.hash === '#/photo') viewPhoto();
    } catch (e) { t.remove(); toast('err', 'यह फ़ोटो खुल नहीं पाई', 'Couldn’t read this photo — try another one'); }
  }

  /* ---------- events ---------- */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act;
    switch (act) {
      case 'big': { const on = PD.toggleBig(); b.setAttribute('aria-pressed', on); break; }
      case 'theme': PD.toggleTheme(); route(); break;
      case 'coll': S.coll = S.coll === b.dataset.id ? null : b.dataset.id; S.show = 24; if (location.hash.indexOf('#/col/') === 0) history.replaceState(null, '', '#/'); viewHome(); break;
      case 'sort': S.filt.sort = b.dataset.v; S.show = 24; route(); break;
      case 'max': { const v = +b.dataset.v; S.filt.max = S.filt.max === v ? null : v; S.show = 24; route(); break; }
      case 'stock': S.filt.stock = !S.filt.stock; S.show = 24; route(); break;
      case 'more': S.show += 24; route(); break;
      case 'back': if (history.length > 1) history.back(); else go('#/'); break;
      case 'size': S.pickSize = b.dataset.v; document.querySelectorAll('[data-act="size"]').forEach(x => x.setAttribute('aria-pressed', x === b)); break;
      case 'add': addToCart(b.dataset.id); break;
      case 'qty': {
        const i = +b.dataset.i; const line = cartTotals().lines[i]; if (!line) break;
        line.c.qty += +b.dataset.d;
        if (line.c.qty <= 0) { const removed = line.c; S.cart = S.cart.filter(c => c !== removed); saveCart(); refreshOrder(); bbar(''); const el = toast('info', 'हटाया', removed ? (byId(removed.id) || {}).name : '', '<button class="btn" style="min-height:2.75rem;padding:0 .7rem">वापस लाएँ</button>', 6000); el.querySelector('button').onclick = () => { removed.qty = 1; S.cart.push(removed); saveCart(); el.remove(); refreshOrder(); }; }
        else { saveCart(); refreshOrder(); }
        break;
      }
      case 'voice': startVoice(); break;
      case 'vlang': PD.setVoiceLang(b.dataset.v); startVoice(b.dataset.v); break;
      case 'vstart': startVoice(); break;
      case 'stopvoice': closeVoice(); break;
      case 'photo': { const inp = $('#photoInput'); inp.value = ''; inp.click(); break; }
      case 'dropq': {
        const pq = PD.parseQuery(decodeURIComponent(location.hash.slice(4)));
        const k = b.dataset.k, v = b.dataset.v;
        const parts = [];
        pq.types.forEach(t => { if (!(k === 'type' && v === t)) parts.push(typeById(t).hi); });
        if (!pq.types.length) pq.cats.forEach(c => { if (!(k === 'cat' && v === c)) parts.push(catById(c).hi); });
        pq.colors.forEach(c => { if (!(k === 'color' && v === c)) parts.push(colorById(c).hi); });
        if (pq.maxPrice && k !== 'max') parts.push(pq.maxPrice + ' तक');
        parts.push(...pq.text);
        const nq = parts.join(' ').trim();
        S.voice = null; go(nq ? '#/s/' + encodeURIComponent(nq) : '#/');
        break;
      }
      case 'live': ls.set('pd_preview', false); load().then(route); break;
      case 'ofcat': S.of.cat = b.dataset.v; S.of.show = 20; document.querySelectorAll('[data-act="ofcat"]').forEach(x => x.setAttribute('aria-pressed', x === b)); $('#oflist').innerHTML = pickerList(); break;
      case 'ofsize': S.of.size[b.dataset.id] = b.dataset.v; document.querySelectorAll('[data-act="ofsize"][data-id="' + b.dataset.id + '"]').forEach(x => x.setAttribute('aria-pressed', x === b)); break;
      case 'ofadd': {
        const it = byId(b.dataset.id); const sizes = it.sizes || []; const size = S.of.size[it.id] || (sizes.length === 1 ? sizes[0] : '');
        if (sizes.length > 1 && !size) { toast('err', 'पहले साइज़ चुनें', it.name + ' — please choose a size'); break; }
        const ex = S.cart.find(c => c.id === it.id && c.size === size); if (ex) ex.qty++; else S.cart.push({ id: it.id, size, qty: 1 });
        saveCart(); refreshOrder(); toast('ok', 'ऑर्डर में जोड़ा ✓', it.name + (size ? ' · ' + (size === 'Free' ? 'फ़्री' : size) : '') + ' — नीचे पता भरें');
        break;
      }
      case 'ofvoice': {
        if (!PD.voiceSupported()) { const tt = PD.voiceErrorText('unsupported'); toast('err', tt[0], tt[1], null, 6000); break; }
        const inp = $('#ofq'); inp.placeholder = 'बोलिए… · Speak now…';
        PD.listen({ score: PD.scoreQuery, onInterim: x => { inp.value = x; }, onFinal: x => { inp.value = x; S.of.q = x; $('#oflist').innerHTML = pickerList(); }, onError: c => { const tt = PD.voiceErrorText(c); toast('err', tt[0], tt[1]); } });
        break;
      }
      case 'copyupi': { const v = b.dataset.v; (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(() => toast('ok', 'UPI ID कॉपी हो गई ✓', v)).catch(() => toast('info', 'UPI ID: ' + v, 'Copy it by hand')); break; }
      case 'nophone': e.preventDefault(); toast('info', 'दुकान का फ़ोन नंबर अभी नहीं जुड़ा', 'Shop phone number not added yet — use WhatsApp'); break;
    }
  });
  document.addEventListener('submit', e => {
    const f = e.target;
    if (f.dataset.form === 'search') {
      e.preventDefault(); const q = f.q.value.trim(); if (!q) return;
      S.voice = null; S.show = 24; f.q.blur(); go('#/s/' + encodeURIComponent(q));
    } else if (f.dataset.form === 'order') { e.preventDefault(); submitOrder(f); }
    else if (f.dataset.form === 'ofsearch') { e.preventDefault(); S.of.q = f.querySelector('input').value; $('#oflist').innerHTML = pickerList(); f.querySelector('input').blur(); }
  });
  document.addEventListener('input', e => {
    if (e.target.id === 'ofq') { S.of.q = e.target.value; S.of.show = 20; $('#oflist').innerHTML = pickerList(); }
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'photoInput') onPhoto(e.target.files[0]);
    if (e.target.name === 'delivery') { const f = ls.get('pd_customer', {}); f.delivery = e.target.value; ls.set('pd_customer', f); refreshOrder(); }
    if (e.target.id === 'o_same') { $('#billbox').hidden = e.target.checked; }
  });

  /* ---------- router ---------- */
  let lastRoute = '';
  function route() {
    const h = location.hash || '#/';
    const parts = h.slice(2).split('/');
    if (h !== lastRoute) { if (!h.startsWith('#/p/')) S.pickSize = null; else if (lastRoute !== h) S.pickSize = null; window.scrollTo(0, 0); lastRoute = h; document.querySelectorAll('.toast.err').forEach(t => t.remove()); }
    if (parts[0] === 'c') viewCat(parts[1], parts[2]);
    else if (parts[0] === 'col') { S.coll = collById(parts[1]) ? parts[1] : null; viewHome(); }
    else if (parts[0] === 's') viewSearch(decodeURIComponent(parts.slice(1).join('/')));
    else if (parts[0] === 'p') viewProduct(parts[1]);
    else if (parts[0] === 'cart') viewCart();
    else if (parts[0] === 'photo') viewPhoto();
    else if (parts[0] === 'done') viewDone();
    else if (parts[0] === 'order') viewOrder();
    else if (parts[0] === 't') viewTrack(parts.slice(1).join('/'));
    else if (parts[0] === 'mo') viewMyOrder(decodeURIComponent(parts[1] || ''));
    else if (parts[0] === 'orders') viewMyOrders();
    else viewHome();
  }
  window.addEventListener('hashchange', () => { closeVoice(); route(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && voiceSheet) closeVoice(); });
  window.addEventListener('storage', e => { if (e.key === 'pd_cart') { S.cart = ls.get('pd_cart', []); route(); } });
  load().then(route);
})();
