/* Pooja Dresses & Vastravatika — shared core (shop + owner panel)
   Plain JS, no build step. Exposes window.PD */
(function () {
  'use strict';

  /* ---------- Catalogue vocabulary ---------- */
  const CATS = [
    { id: 'men', hi: 'पुरुष', en: 'Men', icon: 'shirt', tint: 'sage', words: ['पुरुष', 'मर्द', 'मरद', 'आदमी', 'जेंट्स', 'लड़का', 'लइका', 'men', 'mens', 'gents', 'male', 'man', 'boys', 'boy', 'मेन्स', 'मेंस', 'बॉयज'] },
    { id: 'women', hi: 'महिला', en: 'Women', icon: 'kurti', tint: 'terra', words: ['महिला', 'औरत', 'लेडीज', 'मेहरारू', 'जनाना', 'लड़की', 'लइकी', 'women', 'womens', 'ladies', 'lady', 'female', 'girls', 'girl', 'वूमेन', 'वीमेन', 'गर्ल्स'] },
    { id: 'kids', hi: 'बच्चे', en: 'Kids', icon: 'kids', tint: 'sage', words: ['बच्चे', 'बच्चा', 'बच्चन', 'बचवा', 'बबुआ', 'बेबी', 'kids', 'kid', 'baby', 'child', 'children', 'किड्स', 'बच्चों', 'बच्ची', 'बेटा', 'बेटी'] },
    { id: 'saree', hi: 'साड़ी', en: 'Sarees · Vastravatika', icon: 'saree', tint: 'terra', words: ['वस्त्रवाटिका', 'vastravatika'] },
    { id: 'inner', hi: 'इनरवियर', en: 'Innerwear', icon: 'vest', tint: 'sage', words: ['इनरवियर', 'अंडरगारमेंट', 'innerwear', 'undergarment'] },
    { id: 'acc', hi: 'एक्सेसरीज़', en: 'Accessories', icon: 'bag', tint: 'terra', words: ['एक्सेसरीज', 'accessories', 'accessory'] }
  ];

  const TYPES = [
    { id: 'shirt', cat: 'men', hi: 'कमीज़', en: 'Shirt', shape: 'shirt', words: ['कमीज', 'कमीज़', 'शर्ट', 'सर्ट', 'shirt', 'shirts', 'kameez', 'kamij'] },
    { id: 'tshirt', cat: 'men', hi: 'टी-शर्ट', en: 'T-shirt', shape: 'tshirt', words: ['टीशर्ट', 'टी-शर्ट', 'टी शर्ट', 'टी', 'tshirt', 't-shirt', 't shirt', 'tee', 'tees', 'polo', 'पोलो'] },
    { id: 'jeans', cat: 'men', hi: 'जींस', en: 'Jeans', shape: 'pant', words: ['जींस', 'जीन्स', 'जीन', 'jeans', 'jean', 'denim', 'डेनिम'] },
    { id: 'pant', cat: 'men', hi: 'पैंट', en: 'Pant', shape: 'pant', words: ['पैंट', 'पेंट', 'पतलून', 'फुलपैंट', 'ट्राउजर', 'pant', 'pants', 'trouser', 'trousers', 'formal pant'] },
    { id: 'kurta', cat: 'men', hi: 'कुर्ता', en: 'Kurta', shape: 'kurti', words: ['कुर्ता', 'कुरता', 'kurta'] },
    { id: 'lungi', cat: 'men', hi: 'लुंगी', en: 'Lungi', shape: 'shawl', words: ['लुंगी', 'लुंगि', 'lungi'] },
    { id: 'jacket', cat: 'men', hi: 'जैकेट', en: 'Jacket', shape: 'jacket', words: ['जैकेट', 'जाकेट', 'jacket'] },
    { id: 'sweater', cat: 'men', hi: 'स्वेटर', en: 'Sweater', shape: 'tshirt', words: ['स्वेटर', 'सुइटर', 'ऊनी', 'sweater', 'sweaters', 'woollen', 'woolen', 'pullover'] },
    { id: 'kurti', cat: 'women', hi: 'कुर्ती', en: 'Kurti', shape: 'kurti', words: ['कुर्ती', 'कुरती', 'kurti'] },
    { id: 'leggings', cat: 'women', hi: 'लेगिंग्स', en: 'Leggings', shape: 'pant', words: ['लेगिंग', 'लेगिंग्स', 'लेगी', 'leggings', 'legging'] },
    { id: 'ladiesjeans', cat: 'women', hi: 'लेडीज़ जींस', en: 'Ladies jeans', shape: 'pant', words: ['लेडीज जींस', 'ladies jeans'] },
    { id: 'croptop', cat: 'women', hi: 'क्रॉप टॉप', en: 'Crop top', shape: 'tshirt', words: ['क्रॉप', 'टॉप', 'crop', 'top'] },
    { id: 'suit', cat: 'women', hi: 'सूट सेट', en: 'Suit set', shape: 'kurti', words: ['सूट', 'सलवार', 'suit', 'salwar'] },
    { id: 'dupatta', cat: 'women', hi: 'दुपट्टा', en: 'Dupatta', shape: 'shawl', words: ['दुपट्टा', 'चुन्नी', 'dupatta', 'chunni'] },
    { id: 'shawl', cat: 'women', hi: 'शॉल', en: 'Shawl', shape: 'shawl', words: ['शॉल', 'साल', 'shawl'] },
    { id: 'frock', cat: 'kids', hi: 'फ़्रॉक', en: 'Frock', shape: 'frock', words: ['फ्रॉक', 'फ्राक', 'फराक', 'frock', 'dress'] },
    { id: 'babysuit', cat: 'kids', hi: 'बेबी सूट', en: 'Baby suit', shape: 'tshirt', words: ['बेबी सूट', 'baby suit', 'romper'] },
    { id: 'kidsjeans', cat: 'kids', hi: 'बच्चों की जींस', en: 'Kids jeans', shape: 'pant', words: [] },
    { id: 'kidssweater', cat: 'kids', hi: 'बच्चों का स्वेटर', en: 'Kids sweater', shape: 'tshirt', words: [] },
    { id: 'kidstshirt', cat: 'kids', hi: 'बच्चों की टी-शर्ट', en: 'Kids T-shirt', shape: 'tshirt', words: [] },
    { id: 'banarasi', cat: 'saree', hi: 'बनारसी साड़ी', en: 'Banarasi saree', shape: 'saree', words: ['बनारसी', 'banarasi', 'banarsi'] },
    { id: 'cottonsaree', cat: 'saree', hi: 'सूती साड़ी', en: 'Cotton saree', shape: 'saree', words: ['सूती साड़ी', 'cotton saree'] },
    { id: 'chiffon', cat: 'saree', hi: 'शिफ़ॉन साड़ी', en: 'Chiffon saree', shape: 'saree', words: ['शिफॉन', 'chiffon'] },
    { id: 'georgette', cat: 'saree', hi: 'जॉर्जेट साड़ी', en: 'Georgette saree', shape: 'saree', words: ['जॉर्जेट', 'georgette'] },
    { id: 'blouse', cat: 'saree', hi: 'ब्लाउज़', en: 'Blouse', shape: 'tshirt', words: ['ब्लाउज', 'blouse'] },
    { id: 'petticoat', cat: 'saree', hi: 'पेटीकोट', en: 'Petticoat', shape: 'frock', words: ['पेटीकोट', 'साया', 'petticoat'] },
    { id: 'vest', cat: 'inner', hi: 'बनियान', en: 'Vest', shape: 'vest', words: ['बनियान', 'बनियाइन', 'गंजी', 'baniyan', 'banian', 'vest', 'ganji', 'ganjee'] },
    { id: 'brief', cat: 'inner', hi: 'अंडरवियर', en: 'Underwear', shape: 'brief', words: ['अंडरवियर', 'चड्डी', 'जांघिया', 'underwear', 'brief', 'briefs'] },
    { id: 'bra', cat: 'inner', hi: 'ब्रा', en: 'Bra', shape: 'brief', words: ['ब्रा', 'bra'] },
    { id: 'panty', cat: 'inner', hi: 'पैंटी', en: 'Panty', shape: 'brief', words: ['पैंटी', 'panty', 'panties'] },
    { id: 'thermal', cat: 'inner', hi: 'थर्मल', en: 'Thermal', shape: 'vest', words: ['थर्मल', 'इनर', 'thermal', 'warmer'] },
    { id: 'belt', cat: 'acc', hi: 'बेल्ट', en: 'Belt', shape: 'belt', words: ['बेल्ट', 'पेटी', 'belt'] },
    { id: 'purse', cat: 'acc', hi: 'पर्स', en: 'Purse', shape: 'bag', words: ['पर्स', 'बटुआ', 'थैली', 'purse', 'wallet', 'bag'] },
    { id: 'socks', cat: 'acc', hi: 'मोज़े', en: 'Socks', shape: 'socks', words: ['मोजा', 'मोजे', 'मोज़े', 'socks', 'sock'] },
    { id: 'cap', cat: 'acc', hi: 'टोपी', en: 'Cap', shape: 'cap', words: ['टोपी', 'कैप', 'cap', 'topi'] },
    { id: 'hanky', cat: 'acc', hi: 'रूमाल', en: 'Handkerchief', shape: 'shawl', words: ['रूमाल', 'रुमाल', 'hanky', 'handkerchief'] }
  ];
  // words that mean the category "saree" generally
  const SAREE_WORDS = ['साड़ी', 'साडी', 'सारी', 'सारी', 'saree', 'sarees', 'sari', 'saris', 'sadi'];

  // cross suggestions: "goes with"
  const GOES_WITH = {
    shirt: ['pant', 'jeans', 'belt', 'vest'], tshirt: ['jeans', 'cap', 'socks'], jeans: ['tshirt', 'shirt', 'belt'],
    pant: ['shirt', 'belt', 'socks'], kurta: ['pant', 'shawl'], lungi: ['vest', 'shirt'], jacket: ['jeans', 'thermal'],
    sweater: ['thermal', 'cap'], kurti: ['leggings', 'dupatta'], leggings: ['kurti', 'dupatta'], ladiesjeans: ['croptop', 'kurti'],
    croptop: ['ladiesjeans'], suit: ['dupatta'], dupatta: ['kurti', 'suit'], shawl: ['suit', 'kurti'], frock: ['kidssweater', 'socks'],
    babysuit: ['kidssweater', 'socks'], kidsjeans: ['kidstshirt'], kidstshirt: ['kidsjeans'], kidssweater: ['kidsjeans', 'cap'],
    banarasi: ['blouse', 'petticoat'], cottonsaree: ['blouse', 'petticoat'], chiffon: ['blouse', 'petticoat'], georgette: ['blouse', 'petticoat'],
    blouse: ['petticoat', 'banarasi'], petticoat: ['blouse'], vest: ['brief'], brief: ['vest'], bra: ['panty'], panty: ['bra'],
    thermal: ['sweater', 'socks'], belt: ['jeans', 'pant'], purse: ['kurti'], socks: ['shirt'], cap: ['tshirt'], hanky: ['shirt']
  };

  const COLLS = [
    { id: 'new', hi: 'नया माल', en: 'New Arrivals', icon: 'star' },
    { id: 'winter', hi: 'सर्दी', en: 'Winter', icon: 'snow' },
    { id: 'diwali', hi: 'दिवाली', en: 'Diwali', icon: 'diya' },
    { id: 'chhath', hi: 'छठ पूजा', en: 'Chhath Puja', icon: 'sun' }
  ];

  const COLORS = [
    { id: 'red', hi: 'लाल', en: 'Red', hex: '#c0392b', words: ['लाल', 'ललका', 'रेड', 'red', 'lal', 'laal'] },
    { id: 'maroon', hi: 'मैरून', en: 'Maroon', hex: '#7a1f2b', words: ['मैरून', 'मरून', 'कत्थई', 'maroon'] },
    { id: 'pink', hi: 'गुलाबी', en: 'Pink', hex: '#d96c98', words: ['गुलाबी', 'पिंक', 'pink', 'gulabi'] },
    { id: 'orange', hi: 'नारंगी', en: 'Orange', hex: '#e07b28', words: ['नारंगी', 'केसरिया', 'भगवा', 'ऑरेंज', 'ओरेंज', 'orange', 'saffron'] },
    { id: 'yellow', hi: 'पीला', en: 'Yellow', hex: '#e2b51f', words: ['पीला', 'पीली', 'पियर', 'पियरी', 'येलो', 'yellow', 'peela', 'pila'] },
    { id: 'green', hi: 'हरा', en: 'Green', hex: '#3f8a4f', words: ['हरा', 'हरी', 'हरियर', 'ग्रीन', 'green', 'hara'] },
    { id: 'blue', hi: 'नीला', en: 'Blue', hex: '#2f5d9a', words: ['नीला', 'नीली', 'नीलका', 'ब्लू', 'blue', 'neela', 'nila'] },
    { id: 'sky', hi: 'आसमानी', en: 'Sky blue', hex: '#79aee0', words: ['आसमानी', 'स्काई', 'sky', 'skyblue'] },
    { id: 'navy', hi: 'गहरा नीला', en: 'Navy', hex: '#1f2f55', words: ['नेवी', 'navy'] },
    { id: 'purple', hi: 'बैंगनी', en: 'Purple', hex: '#6d3f8e', words: ['बैंगनी', 'जामुनी', 'पर्पल', 'purple', 'violet'] },
    { id: 'brown', hi: 'भूरा', en: 'Brown', hex: '#7b5233', words: ['भूरा', 'भूरी', 'ब्राउन', 'brown'] },
    { id: 'black', hi: 'काला', en: 'Black', hex: '#262626', words: ['काला', 'काली', 'करिया', 'ब्लैक', 'black', 'kala', 'kaala'] },
    { id: 'white', hi: 'सफ़ेद', en: 'White', hex: '#f1efe8', words: ['सफेद', 'सफ़ेद', 'उज्जर', 'व्हाइट', 'वाइट', 'white', 'safed'] },
    { id: 'grey', hi: 'स्लेटी', en: 'Grey', hex: '#8a8d90', words: ['स्लेटी', 'ग्रे', 'grey', 'gray', 'silver'] },
    { id: 'cream', hi: 'क्रीम', en: 'Cream', hex: '#e8dcc0', words: ['क्रीम', 'cream', 'beige'] }
  ];

  const SIZE_GROUPS = [
    { id: 'cloth', hi: 'कपड़े', en: 'Clothing', sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
    { id: 'waist', hi: 'कमर', en: 'Waist', sizes: ['28', '30', '32', '34', '36'] },
    { id: 'kids', hi: 'बच्चे (उम्र)', en: 'Kids (age)', sizes: ['0-2', '3-5', '6-8', '9-12'] },
    { id: 'free', hi: 'फ़्री साइज़', en: 'Free size', sizes: ['Free'] }
  ];

  const DEFAULT_SETTINGS = {
    shopName: 'पूजा ड्रेसेस', shopNameEn: 'Pooja Dresses & Vastravatika',
    whatsapp: '', phone: '', address: '', hours: 'सुबह 9 – रात 9 · 9 am – 9 pm',
    instagram: '', razorpay: '', deliveryFee: 40, freeAbove: 999, pin: '1234',
    festival: { active: true, id: 'diwali', text: 'दिवाली ऑफ़र · 20% तक छूट', textEn: 'Diwali offer · up to 20% off, till Diwali', color: '#b4562f' },
    sale: { active: false, cat: 'all', pct: 20 }
  };

  const FESTIVALS = [
    { id: 'none', hi: 'कोई नहीं', en: 'None' }, { id: 'diwali', hi: 'दिवाली', en: 'Diwali', color: '#b4562f' },
    { id: 'chhath', hi: 'छठ पूजा', en: 'Chhath', color: '#c98a12' }, { id: 'winter', hi: 'सर्दी', en: 'Winter', color: '#4f7a68' },
    { id: 'holi', hi: 'होली', en: 'Holi', color: '#b5367a' }, { id: 'wedding', hi: 'शादी', en: 'Wedding', color: '#7a1f2b' }
  ];

  const catById = id => CATS.find(c => c.id === id);
  const typeById = id => TYPES.find(t => t.id === id);
  const colorById = id => COLORS.find(c => c.id === id);
  const collById = id => COLLS.find(c => c.id === id);

  /* ---------- Icons (stroke SVG paths, 24px grid) ---------- */
  const ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    mic: '<path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    gallery: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    chat: '<path d="M4 20l1.4-4.2A8 8 0 1 1 8.2 18.6z"/><path d="M9.5 9.5c.3 2.2 2.3 4.4 5 5"/>',
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    cart: '<path d="M3 4h2l2.4 11h11l2-8H6.2"/><circle cx="9" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/>',
    text: '<path d="M3 18L8 6l5 12M5 14h6"/><path d="M17 9v8M13 13h8"/>',
    truck: '<path d="M2 6h11v10H2zM13 10h4l3 3v3h-7"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    tape: '<path d="M3 15l12-12 6 6-12 12z"/><path d="M7 11l2 2M10 8l2 2M13 5l2 2"/>',
    shirt: '<path d="M8 3l4 2 4-2 5 4-3 3-2-1v12H8V9l-2 1-3-3z"/>',
    kurti: '<path d="M9 3h6l1 4 3 14H5L8 7z"/><path d="M10 3l2 3 2-3"/>',
    kids: '<path d="M8 6l4 1.5L16 6l4 3-2 2.5-1.5-1V19h-9v-8.5L6 11.5 4 9z"/><circle cx="12" cy="13" r="1.6"/>',
    saree: '<circle cx="12" cy="4" r="2"/><path d="M9 8h6l3 13H6z"/><path d="M15 8L9 21"/>',
    vest: '<path d="M8 3v3a4 4 0 0 0 8 0V3M8 3L6 4v4l-1 13h14L18 8V4l-2-1"/>',
    bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    star: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
    snow: '<path d="M12 2v20M4 7l16 10M20 7L4 17"/>',
    diya: '<path d="M3 14c2 4 16 4 18 0z"/><path d="M12 11c-1.5-1.5-1.5-3.5 0-6 1.5 2.5 1.5 4.5 0 6z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    right: '<path d="M9 5l7 7-7 7"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    hanger: '<path d="M12 7a2 2 0 1 1 2-2"/><path d="M12 7v2L3 16h18l-9-7"/>',
    tools: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 16v4h16v-4"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
    percent: '<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
    folder: '<path d="M3 6h6l2 2h10v11H3z"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
    boxoff: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M4 4l16 16"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
    backspace: '<path d="M9 5h11v14H9l-6-7z"/><path d="M12 9l5 6M17 9l-5 6"/>',
    cash: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
    shop: '<path d="M3 9l2-5h14l2 5M4 9v11h16V9M3 9h18"/><path d="M10 20v-5h4v5"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>',
    filter: '<path d="M4 5h16l-6 8v6l-4-2v-4z"/>'
  };
  function ic(name, size, extra) {
    const s = size || 24;
    return '<svg class="ic" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" aria-hidden="true"' + (extra ? ' ' + extra : '') + '>' + (ICONS[name] || '') + '</svg>';
  }

  /* ---------- Garment placeholder pictures (used until real photos are added) ---------- */
  const SHAPES = {
    shirt: '<path d="M30 20 L42 14 Q50 22 58 14 L70 20 L86 34 L76 46 L70 42 L70 104 L30 104 L30 42 L24 46 L14 34 Z"/><path class="ln" d="M50 22 L50 104 M44 15 L50 26 L56 15"/>',
    tshirt: '<path d="M32 18 L42 14 Q50 22 58 14 L68 18 L86 30 L78 44 L68 38 L68 104 L32 104 L32 38 L22 44 L14 30 Z"/>',
    pant: '<path d="M30 12 L70 12 L74 108 L56 108 L50 44 L44 108 L26 108 Z"/><path class="ln" d="M30 20 L70 20"/>',
    kurti: '<path d="M38 12 L44 10 Q50 18 56 10 L62 12 L74 26 L68 34 L64 30 L72 108 L28 108 L36 30 L32 34 L26 26 Z"/><path class="ln" d="M50 16 L50 40"/>',
    saree: '<path d="M44 10 Q50 6 56 10 L60 30 Q74 60 76 108 L24 108 Q28 60 40 30 Z"/><path class="pallu" d="M58 14 L30 108"/>',
    frock: '<path d="M40 14 L46 12 Q50 18 54 12 L60 14 L66 22 L60 30 L60 40 L82 104 L18 104 L40 40 L40 30 L34 22 Z"/><path class="ln" d="M40 40 L60 40"/>',
    vest: '<path d="M36 12 L42 12 Q44 34 50 34 Q56 34 58 12 L64 12 Q66 30 72 40 L72 106 L28 106 L28 40 Q34 30 36 12 Z"/>',
    brief: '<path d="M18 44 L82 44 L80 58 Q62 62 56 84 L44 84 Q38 62 20 58 Z"/>',
    belt: '<path d="M6 54 L94 54 L94 66 L6 66 Z"/><path class="ln" d="M62 50 L76 50 L76 70 L62 70 Z"/>',
    bag: '<path d="M22 44 L78 44 L72 104 L28 104 Z"/><path class="ln" d="M36 44 Q36 22 50 22 Q64 22 64 44"/>',
    cap: '<path d="M20 72 Q20 38 50 38 Q80 38 80 72 Z"/><path d="M50 72 L94 78 L82 86 L20 72 Z"/>',
    socks: '<path d="M38 12 L58 12 L58 70 L78 86 Q84 102 68 104 L40 92 Q34 88 38 80 Z"/>',
    jacket: '<path d="M30 20 L42 12 L58 12 L70 20 L86 36 L76 48 L70 44 L70 106 L30 106 L30 44 L24 48 L14 36 Z"/><path class="ln" d="M50 14 L50 106"/>',
    shawl: '<path d="M18 26 L82 26 L82 96 L18 96 Z"/><path class="ln" d="M18 40 L82 40 M18 82 L82 82 M24 96 L24 104 M34 96 L34 104 M44 96 L44 104 M56 96 L56 104 M66 96 L66 104 M76 96 L76 104"/>'
  };
  const picCache = {};
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    r = Math.round(Math.min(255, Math.max(0, r * f))); g = Math.round(Math.min(255, Math.max(0, g * f))); b = Math.round(Math.min(255, Math.max(0, b * f)));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  function placeholderPic(item) {
    const t = typeById(item.type) || {}; const shape = t.shape || 'tshirt';
    const col = (colorById(item.colorId) || {}).hex || item.hex || '#4f7a68';
    const key = shape + col;
    if (picCache[key]) return picCache[key];
    const light = parseInt(col.slice(1), 16) > 0xd0d0d0;
    const stroke = light ? '#9a9486' : shade(col, 0.6);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120">' +
      '<g fill="' + col + '" stroke="' + stroke + '" stroke-width="1.6" stroke-linejoin="round">' + SHAPES[shape].replace(/class="ln"/g, 'fill="none"').replace(/class="pallu"/g, 'fill="none" stroke="' + shade(col, light ? 0.8 : 1.35) + '" stroke-width="7"') + '</g></svg>';
    return (picCache[key] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  }
  const pic = item => (item.photos && item.photos[0]) || placeholderPic(item);

  /* ---------- Money / text helpers ---------- */
  const fmt = n => '₹' + Math.round(n).toLocaleString('en-IN');
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function salePrice(item, settings) {
    const s = settings && settings.sale;
    if (s && s.active && (s.cat === 'all' || s.cat === item.cat) && s.pct > 0) return Math.round(item.price * (1 - s.pct / 100));
    return item.price;
  }
  function priceInfo(item, settings) {
    const now = salePrice(item, settings);
    const mrp = Math.max(item.mrp || 0, item.price);
    const off = mrp > now ? Math.round((1 - now / mrp) * 100) : 0;
    return { now, mrp: mrp > now ? mrp : 0, off };
  }
  const uid = () => 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /* ---------- Search: Hindi / Bhojpuri / Hinglish query understanding ---------- */
  const HI_DIGITS = { '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' };
  function norm(s) {
    return String(s || '').toLowerCase()
      .replace(/[०-९]/g, d => HI_DIGITS[d])
      .replace(/(\d),(?=\d)/g, '$1')
      .replace(/़/g, '')            // nukta
      .replace(/ँ/g, 'ं')      // chandrabindu -> anusvara
      .replace(/[​-‍]/g, '')
      .replace(/[.,!?;:()"'“”‘’|।]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }
  const NUM_WORDS = { 'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'पाँच': 5, 'छह': 6, 'छः': 6, 'छे': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10, 'डेढ': 1.5, 'ढाई': 2.5, 'ग्यारह': 11, 'बारह': 12, 'तेरह': 13, 'चौदह': 14, 'पंद्रह': 15, 'सोलह': 16, 'सत्रह': 17, 'अठारह': 18, 'उन्नीस': 19, 'बीस': 20, 'पच्चीस': 25 };
  const EN_NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 'h', thousand: 'k', 'हंड्रेड': 'h', 'थाउजेंड': 'k', 'फाइव': 5, 'टू': 2, 'वन': 1, 'थ्री': 3 };
  const MULT = { 'सौ': 100, 'सै': 100, 'हजार': 1000, 'हज़ार': 1000, 'hazar': 1000, 'hajar': 1000, 'sau': 100 };
  const PRICE_WORDS = ['तक', 'भीतर', 'भितरी', 'अंदर', 'नीचे', 'कम', 'तले', 'under', 'below', 'within', 'upto', 'less', 'रुपया', 'रुपये', 'रुपए', 'रूपया', 'rs', '₹', 'than', 'cheaper', 'max', 'अंडर', 'बिलो', 'लेस', 'मैक्स', 'tak', 'tk', 'neeche', 'niche', 'andar', 'bhitar', 'kam', 'se'];
  const STOP = ['देखाईं', 'देखाई', 'देखाव', 'दिखाओ', 'दिखाइए', 'दिखाइये', 'दिखा', 'देखा', 'चाहीं', 'चाही', 'चाहिए', 'चाहिये', 'चाहिएं', 'हमरा', 'हमके', 'हमको', 'मुझे', 'मेरे', 'खातिर', 'लिए', 'लिये', 'के', 'का', 'की', 'को', 'में', 'से', 'वाला', 'वाली', 'वाले', 'कुछ', 'और', 'एगो', 'एक', 'गो', 'बा', 'है', 'हैं', 'ना', 'जी', 'please', 'show', 'me', 'for', 'the', 'a', 'want', 'of', 'in', 'rupees', 'rupee', 'ka', 'ki', 'ke', 'wala', 'wali', 'dikhao', 'i', 'need', 'some', 'any', 'and', 'with', 'please', 'plz', 'sir', 'bhaiya', 'भैया', 'भइया', 'जरा', 'तनी', 'दीं', 'दिखाईं', 'देखावल', 'चाहत', 'बानी', 'हम', 'हमनी', 'मेरा', 'मेरी', 'दिखाना', 'दिखाओ'];

  let VOCAB = null;
  function buildVocab() {
    const v = { type: {}, cat: {}, color: {} };
    TYPES.forEach(t => [t.hi, t.en].concat(t.words).forEach(w => { if (w) v.type[norm(w)] = t.id; }));
    CATS.forEach(c => [c.hi, c.en].concat(c.words).forEach(w => { if (w) v.cat[norm(w)] = c.id; }));
    SAREE_WORDS.forEach(w => { v.cat[norm(w)] = 'saree'; });
    COLORS.forEach(c => [c.hi, c.en].concat(c.words).forEach(w => { if (w) v.color[norm(w)] = c.id; }));
    return (VOCAB = v);
  }

  function parseQuery(raw) {
    const v = VOCAB || buildVocab();
    const q = norm(raw);
    const toks = q.split(' ').filter(Boolean);
    const out = { raw: raw, types: [], cats: [], colors: [], maxPrice: null, text: [] };
    const used = new Array(toks.length).fill(false);
    // two-word phrases first (e.g. "लेडीज जींस", "बेबी सूट")
    for (let i = 0; i < toks.length - 1; i++) {
      const ph = toks[i] + ' ' + toks[i + 1];
      if (v.type[ph]) { out.types.push(v.type[ph]); used[i] = used[i + 1] = true; }
    }
    // numbers: digits or Hindi number words with सौ/हजार
    for (let i = 0; i < toks.length; i++) {
      if (used[i]) continue;
      const t = toks[i];
      let val = null, span = 1;
      const m = t.match(/^₹?(\d{2,6})$/);
      if (EN_NUM[t] != null) {
        let total = 0, cur = 0, j = i;
        while (j < toks.length && EN_NUM[toks[j]] != null && !used[j]) {
          const n = EN_NUM[toks[j]];
          if (n === 'h') cur = (cur || 1) * 100; else if (n === 'k') { total += (cur || 1) * 1000; cur = 0; } else cur += n;
          j++;
        }
        val = total + cur; span = j - i;
      } else if (m) {
        val = +m[1];
        if (toks[i + 1] && MULT[toks[i + 1]]) { val *= MULT[toks[i + 1]]; span = 2; }
      } else if (NUM_WORDS[t] != null && toks[i + 1] && MULT[toks[i + 1]]) {
        val = NUM_WORDS[t] * MULT[toks[i + 1]]; span = 2;
      } else if (MULT[t] && (i === 0 || NUM_WORDS[toks[i - 1]] == null)) {
        val = MULT[t];
      }
      if (val != null && val >= 50) {
        out.maxPrice = val;
        for (let k = 0; k < span; k++) used[i + k] = true;
      }
    }
    toks.forEach((t, i) => {
      if (used[i]) return;
      if (PRICE_WORDS.indexOf(t) >= 0 || STOP.indexOf(t) >= 0) { used[i] = true; return; }
      if (v.type[t]) { out.types.push(v.type[t]); used[i] = true; return; }
      if (v.color[t]) { out.colors.push(v.color[t]); used[i] = true; return; }
      if (v.cat[t]) { out.cats.push(v.cat[t]); used[i] = true; return; }
      // loose match: prefix of a known type word (e.g. "कमीजवा", "शर्टवा" in Bhojpuri)
      const key = Object.keys(v.type).find(w => w.length >= 3 && (t.indexOf(w) === 0 || (t.length >= 4 && w.indexOf(t) === 0)));
      if (key) { out.types.push(v.type[key]); used[i] = true; return; }
      const ckey = Object.keys(v.color).find(w => w.length >= 3 && t.indexOf(w) === 0);
      if (ckey) { out.colors.push(v.color[ckey]); used[i] = true; return; }
      if (t.length > 1) out.text.push(t);
    });
    out.types = [...new Set(out.types)]; out.cats = [...new Set(out.cats)]; out.colors = [...new Set(out.colors)];
    return out;
  }

  function itemText(it) {
    const t = typeById(it.type) || {}; const c = catById(it.cat) || {}; const col = colorById(it.colorId) || {};
    return norm([it.name, it.nameEn, t.hi, t.en, c.hi, c.en, col.hi, col.en, (it.tags || []).join(' ')].join(' '));
  }

  const COLOR_FAMILY = { blue: ['blue', 'sky', 'navy'], red: ['red', 'maroon'], white: ['white', 'cream'], green: ['green'], yellow: ['yellow', 'orange'] };
  function runSearch(items, pq, settings) {
    const cols = [].concat(...pq.colors.map(c => COLOR_FAMILY[c] || [c]));
    const tryMatch = (useText, useColor, usePrice) => items.filter(it => {
      if (pq.types.length && pq.types.indexOf(it.type) < 0) return false;
      if (!pq.types.length && pq.cats.length && pq.cats.indexOf(it.cat) < 0) return false;
      if (useColor && cols.length && cols.indexOf(it.colorId) < 0) return false;
      if (usePrice && pq.maxPrice && salePrice(it, settings) > pq.maxPrice) return false;
      if (useText && pq.text.length) {
        const txt = itemText(it);
        if (!pq.text.some(w => txt.indexOf(w) >= 0)) return false;
      }
      return true;
    });
    const hasStruct = pq.types.length || pq.cats.length || pq.colors.length || pq.maxPrice;
    if (!hasStruct && !pq.text.length) return { items: [], relaxed: false };
    let res = tryMatch(true, true, true);
    if (res.length) return { items: sortForColor(res, pq.colors), relaxed: false };
    if (hasStruct) {
      res = tryMatch(false, true, true); if (res.length) return { items: sortForColor(res, pq.colors), relaxed: false };
      res = tryMatch(false, false, true); if (res.length) return { items: sortForSearch(res), relaxed: 'color' };
      res = tryMatch(false, false, false); if (res.length) return { items: sortForSearch(res), relaxed: 'price' };
    }
    return { items: [], relaxed: false };
  }
  function sortForColor(list, colors) { const s = sortForSearch(list); if (!colors.length) return s; return s.filter(i => colors.indexOf(i.colorId) >= 0).concat(s.filter(i => colors.indexOf(i.colorId) < 0)); }
  function sortForSearch(list) { return list.slice().sort((a, b) => (b.inStock - a.inStock) || (a.price - b.price)); }

  function goesWith(items, base, n) {
    const want = GOES_WITH[base.type] || [];
    const pool = items.filter(it => it.id !== base.id && it.inStock && want.indexOf(it.type) >= 0);
    pool.sort((a, b) => want.indexOf(a.type) - want.indexOf(b.type));
    const seen = {}; const out = [];
    pool.forEach(it => { if (!seen[it.type]) { seen[it.type] = 1; out.push(it); } });
    pool.forEach(it => { if (out.indexOf(it) < 0) out.push(it); });
    return out.slice(0, n || 6);
  }

  /* ---------- Photo analysis: dominant colour + average hash ---------- */
  function loadImage(src) {
    return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
  }
  function fileToDataURL(file) {
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
  }
  async function compressPhoto(file, max, q) {
    const src = await fileToDataURL(file);
    const im = await loadImage(src);
    const m = max || 640; const scale = Math.min(1, m / Math.max(im.width, im.height));
    const w = Math.round(im.width * scale), h = Math.round(im.height * scale);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(im, 0, 0, w, h);
    return c.toDataURL('image/jpeg', q || 0.72);
  }
  async function analyseImage(src) {
    const im = typeof src === 'string' ? await loadImage(src) : src;
    // dominant colour from centre 60%
    const c = document.createElement('canvas'); const S = 48; c.width = S; c.height = S;
    const x = c.getContext('2d', { willReadFrequently: true });
    const sw = im.width * 0.6, sh = im.height * 0.6;
    x.drawImage(im, im.width * 0.2, im.height * 0.2, sw, sh, 0, 0, S, S);
    const d = x.getImageData(0, 0, S, S).data;
    const bins = {};
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const k = (r >> 5) + ',' + (g >> 5) + ',' + (b >> 5);
      const e = bins[k] || (bins[k] = { n: 0, r: 0, g: 0, b: 0 }); e.n++; e.r += r; e.g += g; e.b += b;
    }
    // ignore near-background (very light / very low saturation light) bins when something else is strong
    const arr = Object.values(bins).map(e => ({ n: e.n, r: e.r / e.n, g: e.g / e.n, b: e.b / e.n }));
    arr.sort((a, b) => b.n - a.n);
    let pick = arr[0];
    for (const e of arr.slice(0, 4)) { const lum = (e.r + e.g + e.b) / 3; const sat = Math.max(e.r, e.g, e.b) - Math.min(e.r, e.g, e.b); if (!(lum > 225 && sat < 25) && e.n > arr[0].n * 0.35) { pick = e; break; } }
    const rgb = [Math.round(pick.r), Math.round(pick.g), Math.round(pick.b)];
    // 8x8 average hash of whole picture
    const h = document.createElement('canvas'); h.width = 8; h.height = 8;
    const hx = h.getContext('2d', { willReadFrequently: true }); hx.drawImage(im, 0, 0, 8, 8);
    const hd = hx.getImageData(0, 0, 8, 8).data; const g = [];
    for (let i = 0; i < hd.length; i += 4) g.push((hd[i] + hd[i + 1] + hd[i + 2]) / 3);
    const avg = g.reduce((a, b) => a + b, 0) / 64;
    const hash = g.map(v => (v > avg ? '1' : '0')).join('');
    return { rgb, hash, colorId: nearestColor(rgb).id };
  }
  function hexToRgb(hex) { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function colorDist(a, b) { const rm = (a[0] + b[0]) / 2; const dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2]; return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db); }
  function nearestColor(rgb) { let best = COLORS[0], bd = 1e9; COLORS.forEach(c => { const d = colorDist(rgb, hexToRgb(c.hex)); if (d < bd) { bd = d; best = c; } }); return best; }
  function hamming(a, b) { if (!a || !b || a.length !== b.length) return 99; let n = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++; return n; }
  function photoMatch(items, sig) {
    const exact = items.filter(it => it.hash && hamming(it.hash, sig.hash) <= 5);
    const scored = items.map(it => {
      const rgb = it.rgb || hexToRgb((colorById(it.colorId) || COLORS[0]).hex);
      return { it, d: colorDist(rgb, sig.rgb) };
    }).filter(s => exact.indexOf(s.it) < 0).sort((a, b) => a.d - b.d);
    return { exact, similar: scored.slice(0, 12).map(s => s.it) };
  }

  /* ---------- Storage: IndexedDB key-value (owner data lives on the owner's phone) ---------- */
  let dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      if (!('indexedDB' in window)) return rej(new Error('no idb'));
      const r = indexedDB.open('pooja-dresses', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function kvGet(k) {
    try { const d = await db(); return await new Promise((res, rej) => { const t = d.transaction('kv').objectStore('kv').get(k); t.onsuccess = () => res(t.result); t.onerror = () => rej(t.error); }); }
    catch (e) { try { const s = localStorage.getItem('pd_' + k); return s ? JSON.parse(s) : undefined; } catch (_) { return undefined; } }
  }
  async function kvSet(k, v) {
    try { const d = await db(); return await new Promise((res, rej) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = () => res(true); t.onerror = () => rej(t.error); }); }
    catch (e) { try { localStorage.setItem('pd_' + k, JSON.stringify(v)); return true; } catch (_) { return false; } }
  }
  async function kvDel(k) { try { const d = await db(); const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').delete(k); } catch (e) { /* ignore */ } }
  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };

  // Published catalogue: items.json next to the page; falls back to bundled seed.
  async function loadPublished() {
    try {
      const r = await fetch('items.json?v=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) throw new Error(r.status);
      return await r.json();
    } catch (e) { return window.PD_SEED || { settings: {}, items: [] }; }
  }
  function mergeSettings(s) {
    const out = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    if (s) Object.keys(s).forEach(k => { out[k] = (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k])) ? Object.assign({}, out[k], s[k]) : s[k]; });
    return out;
  }

  /* ---------- Theme & text size (shared by both pages) ---------- */
  function applyPrefs() {
    const theme = ls.get('pd_theme', 'auto'); const big = ls.get('pd_big', false);
    const root = document.documentElement;
    if (theme === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', theme);
    root.classList.toggle('big', !!big);
  }
  function isDark() {
    const t = document.documentElement.getAttribute('data-theme');
    if (t) return t === 'dark';
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function toggleTheme() { ls.set('pd_theme', isDark() ? 'light' : 'dark'); applyPrefs(); }
  function toggleBig() { ls.set('pd_big', !ls.get('pd_big', false)); applyPrefs(); return ls.get('pd_big', false); }

  function waLink(number, text) {
    const n = String(number || '').replace(/\D/g, '');
    const full = n.length === 10 ? '91' + n : n;
    return 'https://wa.me/' + full + '?text=' + encodeURIComponent(text || '');
  }

  /* ---------- Voice: Hindi/Bhojpuri (hi-IN) and English (en-IN) ---------- */
  const VOICE_LANGS = [
    { id: 'hi-IN', hi: 'हिंदी / भोजपुरी', en: 'Hindi / Bhojpuri', example: 'नीला कमीज देखाईं, पाँच सौ के भीतर' },
    { id: 'en-IN', hi: 'अंग्रेज़ी', en: 'English', example: 'blue shirt under 500' }
  ];
  const voiceSupported = () => !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const voiceLang = () => { const l = ls.get('pd_vlang', 'hi-IN'); return VOICE_LANGS.some(v => v.id === l) ? l : 'hi-IN'; };
  const setVoiceLang = l => ls.set('pd_vlang', l);
  function scoreQuery(text) {
    const q = parseQuery(text);
    return q.types.length * 3 + q.colors.length * 2 + q.cats.length * 2 + (q.maxPrice ? 2 : 0) - q.text.length * 0.5;
  }
  // Listen once. opts: { lang, onInterim(text), onFinal(text, alternatives), onError(code), onEnd() }
  function listen(opts) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { opts.onError && opts.onError('unsupported'); return null; }
    const rec = new SR();
    rec.lang = opts.lang || voiceLang(); rec.interimResults = true; rec.maxAlternatives = 4; rec.continuous = false;
    let alts = [], interim = '', done = false;
    rec.onresult = e => {
      let txt = '';
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i]; txt += r[0].transcript;
        if (r.isFinal) { alts = []; for (let k = 0; k < r.length; k++) alts.push(r[k].transcript.trim()); }
      }
      interim = txt.trim(); opts.onInterim && opts.onInterim(interim);
    };
    rec.onerror = e => { done = true; opts.onError && opts.onError(e.error); };
    rec.onend = () => {
      if (!done) {
        const list = alts.length ? alts : (interim ? [interim] : []);
        if (list.length) {
          // pick the alternative the shop understands best (first one wins ties)
          let best = list[0], bs = opts.score ? -1e9 : 0;
          if (opts.score) list.forEach(a => { const sc = opts.score(a); if (sc > bs) { bs = sc; best = a; } });
          opts.onFinal && opts.onFinal(best, list);
        } else opts.onError && opts.onError('no-speech');
      }
      opts.onEnd && opts.onEnd();
    };
    try { rec.start(); } catch (err) { opts.onError && opts.onError('start'); return null; }
    return rec;
  }
  function voiceErrorText(code) {
    return {
      'unsupported': ['इस ब्राउज़र में बोलकर खोज नहीं चलती', 'Voice search needs Chrome. In WhatsApp, tap ⋮ → Open in Chrome'],
      'not-allowed': ['माइक की इजाज़त नहीं मिली', 'Allow the microphone: tap the lock icon near the address → Microphone → Allow'],
      'service-not-allowed': ['माइक की इजाज़त नहीं मिली', 'Allow the microphone in browser settings'],
      'no-speech': ['आवाज़ नहीं आई — फिर से बोलें', 'Didn’t hear anything — tap the mic and speak again'],
      'audio-capture': ['माइक नहीं मिला', 'No microphone found on this device'],
      'network': ['इंटरनेट धीमा है — फिर से कोशिश करें', 'Voice needs internet — check the connection and try again'],
      'language-not-supported': ['यह भाषा इस फ़ोन में नहीं है', 'This language isn’t available here — try the other one']
    }[code] || ['बोलकर खोज अभी नहीं चली', 'Voice didn’t work — please type instead'];
  }

  window.PD = {
    VOICE_LANGS, voiceSupported, voiceLang, setVoiceLang, listen, voiceErrorText, scoreQuery,
    CATS, TYPES, COLLS, COLORS, SIZE_GROUPS, FESTIVALS, GOES_WITH, DEFAULT_SETTINGS,
    catById, typeById, colorById, collById, ic, pic, placeholderPic, fmt, esc, salePrice, priceInfo, uid,
    norm, parseQuery, runSearch, goesWith, compressPhoto, analyseImage, photoMatch, nearestColor, hexToRgb, fileToDataURL, loadImage,
    kvGet, kvSet, kvDel, ls, loadPublished, mergeSettings, applyPrefs, toggleTheme, toggleBig, isDark, waLink
  };
  applyPrefs();
})();
