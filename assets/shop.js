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
      '<a class="small-link" href="admin.html">दुकान वाले के लिए · Owner login</a></footer>';
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
    app.innerHTML = header() + promises() + banner() + searchBar() + tiles() + collChips() + filterChips() +
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
    if (said) html += '<div class="note terra"><span class="round mic" style="width:2.5rem;height:2.5rem">' + ic('mic', 20) + '</span><div><span class="en">आपने कहा · You said</span><span class="hi" style="font-size:1.2rem;margin-top:.1rem">“' + esc(said.q) + '”</span></div></div>';
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
  function viewCart() {
    const t = cartTotals(); const f = ls.get('pd_customer', {});
    let html = backHead('आपका थैला', t.lines.length ? t.lines.reduce((a, x) => a + x.c.qty, 0) + ' चीज़ें · items' : 'Your cart');
    if (!t.lines.length) {
      app.innerHTML = html + '<div class="empty">' + bi('थैला खाली है', 'Your cart is empty') + '<a class="btn primary" style="margin-top:.9rem" href="#/">' + bi('कपड़े देखें', 'Browse clothes') + '</a></div>' + footer();
      bbar('cart'); return;
    }
    html += '<div style="display:flex;flex-direction:column;gap:.6rem;padding:0 1rem">' + t.lines.map((x, i) => {
      const p = PD.salePrice(x.it, S.settings);
      return '<div class="citem"><img alt="" src="' + pic(x.it) + '"><div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:.35rem">' +
        '<div><span class="hi" style="font-size:1rem">' + esc(x.it.name) + '</span><span class="en">' + esc(x.it.nameEn || '') + (x.c.size ? ' · साइज़ / Size ' + esc(x.c.size) : '') + '</span></div>' +
        '<div class="row" style="justify-content:space-between"><span style="font-family:\'Baloo 2\';font-weight:700;font-size:1.25rem">' + fmt(p * x.c.qty) + '</span>' +
        '<div class="stepper"><button data-act="qty" data-i="' + i + '" data-d="-1" aria-label="एक कम, decrease">−</button><span>' + x.c.qty + '</span><button data-act="qty" data-i="' + i + '" data-d="1" aria-label="एक और, increase">+</button></div></div></div></div>';
    }).join('') + '</div>';
    const freeAbove = +S.settings.freeAbove || 0;
    html += '<div class="summary"><div class="r"><span>' + bi('सामान', 'Items', '.95rem') + '</span><b>' + fmt(t.sub) + '</b></div>' +
      '<div class="r"><span>' + bi('डिलीवरी', t.pickup ? 'Pick up at shop' : (freeAbove ? 'Free above ' + fmt(freeAbove) : 'Delivery'), '.95rem') + '</span><b style="color:' + (t.fee ? 'inherit' : 'var(--sage-d)') + '">' + (t.fee ? fmt(t.fee) : 'मुफ़्त · ₹0') + '</b></div>' +
      '<div style="height:1px;background:var(--line)"></div><div class="r"><span>' + bi('कुल', 'Total', '1.12rem') + '</span><span style="font-family:\'Baloo 2\';font-weight:800;font-size:1.6rem">' + fmt(t.total) + '</span></div></div>';
    const v = k => esc(f[k] || '');
    html += '<form data-form="order" novalidate style="display:flex;flex-direction:column;gap:.9rem;padding:1.4rem 1rem 0">' +
      '<fieldset style="border:0;margin:0;padding:0;display:flex;flex-direction:column;gap:.6rem"><legend style="padding:0;margin-bottom:.6rem">' + bi('सामान कैसे लेंगे?', 'How will you get it?', '1.2rem') + '</legend>' +
      '<label class="radio"><input type="radio" name="delivery" value="home"' + (f.delivery !== 'pickup' ? ' checked' : '') + '><span style="flex:1">' + bi('घर पर डिलीवरी', 'Home delivery · same day in town', '1rem') + '</span>' + ic('truck', 24, 'style="color:var(--ink2)"') + '</label>' +
      '<label class="radio"><input type="radio" name="delivery" value="pickup"' + (f.delivery === 'pickup' ? ' checked' : '') + '><span style="flex:1">' + bi('दुकान से ले जाएँगे', 'Pick up at shop · try it on', '1rem') + '</span>' + ic('shop', 24, 'style="color:var(--ink2)"') + '</label></fieldset>' +
      '<h2 style="margin:.4rem 0 0">' + bi('आपकी जानकारी', 'Your details', '1.2rem') + '</h2>' +
      '<div><label for="o_name" class="lab">' + bi('नाम', 'Name', '.95rem') + '</label><input id="o_name" name="name" class="fld" autocomplete="name" value="' + v('name') + '"></div>' +
      '<div><label for="o_mob" class="lab">' + bi('मोबाइल नंबर', 'Mobile number', '.95rem') + '</label><div class="prefix" id="mobbox"><span>+91</span><input id="o_mob" name="mobile" inputmode="numeric" maxlength="10" autocomplete="tel-national" value="' + v('mobile') + '"></div></div>' +
      '<div id="addrbox"><label for="o_addr" class="lab">' + bi('पूरा पता (गाँव / मोहल्ला, पास में क्या है)', 'Full address (village / area, nearby landmark)', '.95rem') + '</label><textarea id="o_addr" name="address" class="fld" rows="3" autocomplete="street-address">' + v('address') + '</textarea></div>' +
      '<div id="pinbox"><label for="o_pin" class="lab">' + bi('पिन कोड', 'PIN code', '.95rem') + '</label><input id="o_pin" name="pin" class="fld" style="max-width:12rem;letter-spacing:.15em" inputmode="numeric" maxlength="6" autocomplete="postal-code" value="' + v('pin') + '"></div>' +
      '<label class="check"><input type="checkbox" name="same" id="o_same"' + (f.same === false ? '' : ' checked') + '><span>' + bi('बिल का पता भी यही है', 'Billing address same as delivery', '.95rem') + '</span></label>' +
      '<div id="billbox"' + (f.same === false ? '' : ' hidden') + '><label for="o_bill" class="lab">' + bi('बिल का पता', 'Billing address', '.95rem') + '</label><textarea id="o_bill" name="bill" class="fld" rows="2">' + v('bill') + '</textarea></div>' +
      '<fieldset style="border:0;margin:.4rem 0 0;padding:0;display:flex;flex-direction:column;gap:.6rem"><legend style="padding:0;margin-bottom:.6rem">' + bi('पैसे कैसे देंगे?', 'How will you pay?', '1.2rem') + '</legend>' +
      payRadio('upi', 'UPI से', 'UPI · PhonePe, Google Pay, Paytm', f.pay, '<span style="font-weight:800;font-size:.82rem;border:1.5px solid currentColor;border-radius:.4rem;padding:.1rem .4rem;color:var(--sage-d)">UPI</span>') +
      payRadio('cod', 'सामान मिलने पर नकद', 'Cash on delivery', f.pay, ic('cash', 24, 'style="color:var(--ink2)"')) +
      payRadio('shop', 'दुकान पर आकर दें', 'Pay at the shop', f.pay, ic('shop', 24, 'style="color:var(--ink2)"')) + '</fieldset>' +
      '<button type="submit" class="btn primary big block" style="margin-top:.5rem;box-shadow:0 6px 18px rgba(79,122,104,.28)">' + ic('chat', 28) + '<span>' + bi('WhatsApp पर ऑर्डर भेजें', 'Send order on WhatsApp · ' + fmt(t.total), '1.25rem') + '</span></button>' +
      '<span class="en" style="text-align:center;font-size:.82rem">ऑर्डर सीधे दुकान के WhatsApp पर जाएगा · Goes straight to the shop</span></form>';
    app.innerHTML = html + footer();
    syncDeliveryUI();
    bbar('cart');
  }
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
  function viewDone() {
    const o = S.lastOrder;
    if (!o) return go('#/');
    let html = '<div style="padding:2rem 1rem 0;text-align:center;display:flex;flex-direction:column;align-items:center;gap:.75rem">' +
      '<span class="round" style="width:4.5rem;height:4.5rem;border-radius:2.25rem;background:var(--ok);color:var(--bg)">' + ic('check', 40, 'style="stroke-width:3"') + '</span>' +
      bi('ऑर्डर WhatsApp पर भेज दिया ✓', 'Order sent on WhatsApp', '1.5rem') +
      '<p class="muted" style="margin:0">दुकान वाले जल्दी जवाब देंगे। WhatsApp नहीं खुला? नीचे बटन दबाएँ।<br><span class="en">The shop will reply soon. WhatsApp didn’t open? Tap below.</span></p>' +
      '<a class="btn block" target="_blank" rel="noopener" href="' + o.link + '">' + ic('chat', 22) + bi('फिर से WhatsApp खोलें', 'Open WhatsApp again', '1rem') + '</a>';
    if (o.pay === 'upi' && S.settings.razorpay) html += '<a class="btn primary block" target="_blank" rel="noopener" href="' + esc(S.settings.razorpay) + '">' + bi('अभी UPI से ' + fmt(o.total) + ' भेजें', 'Pay ' + fmt(o.total) + ' by UPI now', '1.1rem') + '</a>';
    else if (o.pay === 'upi') html += '<div class="note sage" style="margin:0;text-align:left">' + ic('info', 22) + '<div>' + bi('दुकान वाले WhatsApp पर UPI नंबर भेजेंगे', 'The shop will send its UPI details on WhatsApp', '.95rem') + '</div></div>';
    html += '<a class="btn" href="#/">' + bi('और ख़रीदारी करें', 'Continue shopping', '.95rem') + '</a></div>';
    app.innerHTML = html + footer();
    bbar('');
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

  function submitOrder(form) {
    const val = n => (form[n] && form[n].value || '').trim();
    const data = { delivery: form.delivery.value, name: val('name'), mobile: val('mobile').replace(/\D/g, ''), address: val('address'), pin: val('pin').replace(/\D/g, ''), same: form.same.checked, bill: val('bill'), pay: form.pay.value };
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
    const payTxt = { upi: 'UPI', cod: 'सामान मिलने पर नकद (COD)', shop: 'दुकान पर' }[data.pay];
    const lines = t.lines.map((x, i) => (i + 1) + ') ' + x.it.name + (x.c.size ? ' (' + (x.c.size === 'Free' ? 'फ़्री साइज़' : x.c.size) + ')' : '') + ' × ' + x.c.qty + ' = ' + fmt(PD.salePrice(x.it, S.settings) * x.c.qty));
    const msg = ['नया ऑर्डर — ' + S.settings.shopName, '', ...lines, '', 'सामान: ' + fmt(t.sub), 'डिलीवरी: ' + (t.pickup ? 'दुकान से लेंगे' : (t.fee ? fmt(t.fee) : 'मुफ़्त')), 'कुल: ' + fmt(t.total), '',
      'नाम: ' + data.name, 'मोबाइल: +91 ' + data.mobile,
      ...(data.delivery === 'home' ? ['पता: ' + data.address, 'PIN: ' + data.pin] : []),
      'बिल का पता: ' + (data.same ? 'वही' : data.bill), 'भुगतान: ' + payTxt].join('\n');
    const link = PD.waLink(S.settings.whatsapp, msg);
    S.lastOrder = { link, total: t.total, pay: data.pay, at: Date.now() };
    ls.set('pd_last_order', S.lastOrder);
    S.cart = []; saveCart();
    window.open(link, '_blank', 'noopener');
    go('#/done');
  }

  /* voice search (Hindi recogniser understands most Bhojpuri words) */
  let rec = null;
  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast('err', 'इस फ़ोन में बोलकर खोज नहीं चलती', 'Voice search is not supported here — please type, or use Chrome', null, 5000); return; }
    const sc = document.createElement('div'); sc.className = 'scrim';
    sc.innerHTML = '<div class="sheet" role="dialog" aria-label="बोलकर खोजें"><span class="handle"></span><div class="listen"><span class="pulse">' + ic('mic', 44) + '</span>' +
      bi('बोलिए… जैसे “नीला कमीज देखाईं, पाँच सौ के भीतर”', 'Speak now — Hindi or Bhojpuri', '1.15rem') +
      '<span class="muted" id="heard" style="min-height:1.4rem"></span><button class="btn" data-act="stopvoice">' + bi('रोकें', 'Cancel', '.95rem') + '</button></div></div>';
    document.body.appendChild(sc);
    rec = new SR(); rec.lang = 'hi-IN'; rec.interimResults = true; rec.maxAlternatives = 1;
    let final = '';
    rec.onresult = e => { let txt = ''; for (let i = 0; i < e.results.length; i++) { txt += e.results[i][0].transcript; if (e.results[i].isFinal) final = txt; } const h = $('#heard'); if (h) h.textContent = txt; };
    rec.onerror = e => {
      sc.remove();
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') toast('err', 'माइक की इजाज़त नहीं मिली', 'Please allow the microphone and try again', null, 5000);
      else if (e.error === 'no-speech') toast('err', 'आवाज़ नहीं आई, फिर से बोलें', 'Didn’t hear anything — try again');
      else if (e.error !== 'aborted') toast('err', 'बोलकर खोज अभी नहीं चली', 'Voice search failed — please type instead');
    };
    rec.onend = () => {
      sc.remove();
      const h = $('#heard'); const q = (final || (h && h.textContent) || '').trim();
      if (q) { S.voice = { q }; S.show = 24; go('#/s/' + encodeURIComponent(q)); }
    };
    try { rec.start(); } catch (e) { sc.remove(); toast('err', 'बोलकर खोज अभी नहीं चली', 'Voice search failed'); }
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
        if (line.c.qty <= 0) { const removed = line.c; S.cart = S.cart.filter(c => c !== removed); saveCart(); viewCart(); const el = toast('info', 'थैले से हटाया', removed ? (byId(removed.id) || {}).name : '', '<button class="btn" style="min-height:2.75rem;padding:0 .7rem">वापस लाएँ</button>', 6000); el.querySelector('button').onclick = () => { removed.qty = 1; S.cart.push(removed); saveCart(); el.remove(); viewCart(); }; }
        else { saveCart(); viewCart(); }
        break;
      }
      case 'voice': startVoice(); break;
      case 'stopvoice': if (rec) rec.abort(); document.querySelector('.scrim') && document.querySelector('.scrim').remove(); break;
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
      case 'nophone': e.preventDefault(); toast('info', 'दुकान का फ़ोन नंबर अभी नहीं जुड़ा', 'Shop phone number not added yet — use WhatsApp'); break;
    }
  });
  document.addEventListener('submit', e => {
    const f = e.target;
    if (f.dataset.form === 'search') {
      e.preventDefault(); const q = f.q.value.trim(); if (!q) return;
      S.voice = null; S.show = 24; f.q.blur(); go('#/s/' + encodeURIComponent(q));
    } else if (f.dataset.form === 'order') { e.preventDefault(); submitOrder(f); }
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'photoInput') onPhoto(e.target.files[0]);
    if (e.target.name === 'delivery') { const f = ls.get('pd_customer', {}); f.delivery = e.target.value; ls.set('pd_customer', f); viewCart(); }
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
    else viewHome();
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('storage', e => { if (e.key === 'pd_cart') { S.cart = ls.get('pd_cart', []); route(); } });
  load().then(route);
})();
