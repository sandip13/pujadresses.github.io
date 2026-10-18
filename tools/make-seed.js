// Generates the demo catalogue: items.json (published data) + assets/seed.js (offline fallback).
// Run: node tools/make-seed.js
const fs = require('fs');
const path = require('path');

const day = 86400000;
const now = Date.parse('2026-10-18T09:00:00+05:30');
// [name, nameEn, cat, type, colorId, price, mrp, sizes, colls, daysAgo, inStock]
const rows = [
  ['सूती चेक कमीज़', 'Cotton check shirt', 'men', 'shirt', 'blue', 499, 799, ['M', 'L', 'XL'], ['diwali'], 2, true],
  ['सफ़ेद फ़ॉर्मल कमीज़', 'White formal shirt', 'men', 'shirt', 'white', 549, 849, ['S', 'M', 'L', 'XL', 'XXL'], [], 20, true],
  ['आसमानी चेक कमीज़', 'Sky-blue check shirt', 'men', 'shirt', 'sky', 449, 699, ['S', 'M', 'L'], [], 9, true],
  ['गहरी नीली कमीज़', 'Navy formal shirt', 'men', 'shirt', 'navy', 479, 699, ['L', 'XL', 'XXL'], ['diwali'], 4, true],
  ['मैरून त्योहारी कमीज़', 'Maroon festive shirt', 'men', 'shirt', 'maroon', 649, 999, ['M', 'L', 'XL'], ['diwali', 'chhath'], 1, true],
  ['काली पोलो टी-शर्ट', 'Black polo T-shirt', 'men', 'tshirt', 'black', 349, 499, ['M', 'L', 'XL'], [], 15, true],
  ['हरी सूती टी-शर्ट', 'Green cotton T-shirt', 'men', 'tshirt', 'green', 299, 449, ['S', 'M', 'L'], [], 30, true],
  ['डेनिम जींस', 'Denim jeans', 'men', 'jeans', 'navy', 899, 1299, ['30', '32', '34', '36'], [], 12, true],
  ['काली स्ट्रेच जींस', 'Black stretch jeans', 'men', 'jeans', 'black', 999, 1499, ['28', '30', '32', '34'], [], 3, true],
  ['फ़ॉर्मल पैंट', 'Formal pant', 'men', 'pant', 'grey', 649, 999, ['30', '32', '34', '36'], [], 25, true],
  ['क्रीम लिनन कुर्ता', 'Cream linen kurta', 'men', 'kurta', 'cream', 749, 1099, ['M', 'L', 'XL'], ['diwali', 'chhath'], 6, true],
  ['चेक लुंगी', 'Check lungi', 'men', 'lungi', 'green', 199, 299, ['Free'], [], 40, true],
  ['ऊनी स्वेटर', 'Wool sweater', 'men', 'sweater', 'brown', 799, 1199, ['M', 'L', 'XL'], ['winter'], 2, true],
  ['पफ़र जैकेट', 'Puffer jacket', 'men', 'jacket', 'navy', 1499, 2199, ['M', 'L', 'XL'], ['winter'], 5, false],
  ['प्रिंटेड कुर्ती', 'Printed kurti', 'women', 'kurti', 'yellow', 599, 899, ['S', 'M', 'L', 'XL'], ['chhath'], 8, true],
  ['मैरून सूती कुर्ती', 'Maroon cotton kurti', 'women', 'kurti', 'maroon', 549, 799, ['M', 'L', 'XL'], ['diwali'], 3, true],
  ['लाल अनारकली कुर्ती', 'Red anarkali kurti', 'women', 'kurti', 'red', 799, 1199, ['M', 'L'], ['diwali'], 1, true],
  ['गुलाबी कुर्ती सेट', 'Pink kurti set', 'women', 'suit', 'pink', 899, 1299, ['S', 'M', 'L'], [], 18, true],
  ['काली लेगिंग्स', 'Black leggings', 'women', 'leggings', 'black', 249, 399, ['Free'], [], 22, true],
  ['लेडीज़ नीली जींस', 'Ladies blue jeans', 'women', 'ladiesjeans', 'blue', 799, 1199, ['28', '30', '32'], [], 10, true],
  ['सफ़ेद क्रॉप टॉप', 'White crop top', 'women', 'croptop', 'white', 349, 499, ['S', 'M', 'L'], [], 4, true],
  ['पीला दुपट्टा', 'Yellow dupatta', 'women', 'dupatta', 'yellow', 199, 299, ['Free'], ['chhath'], 7, true],
  ['ऊनी शॉल', 'Wool shawl', 'women', 'shawl', 'maroon', 699, 999, ['Free'], ['winter'], 2, true],
  ['गुलाबी फ़्रॉक', 'Pink frock', 'kids', 'frock', 'pink', 399, 599, ['3-5', '6-8'], ['diwali'], 3, true],
  ['पीली फ़्रॉक', 'Yellow party frock', 'kids', 'frock', 'yellow', 499, 699, ['3-5', '6-8', '9-12'], [], 14, true],
  ['बेबी सूट सेट', 'Baby suit set', 'kids', 'babysuit', 'sky', 349, 499, ['0-2'], [], 9, true],
  ['बच्चों का ऊनी स्वेटर', 'Kids wool sweater', 'kids', 'kidssweater', 'red', 449, 650, ['3-5', '6-8', '9-12'], ['winter'], 1, false],
  ['बच्चों की जींस', 'Kids jeans', 'kids', 'kidsjeans', 'blue', 399, 599, ['3-5', '6-8', '9-12'], [], 16, true],
  ['बच्चों की टी-शर्ट', 'Kids T-shirt', 'kids', 'kidstshirt', 'orange', 199, 299, ['3-5', '6-8'], [], 11, true],
  ['बनारसी सिल्क साड़ी', 'Banarasi silk saree', 'saree', 'banarasi', 'red', 1899, 2600, ['Free'], ['diwali'], 2, true],
  ['पीली सूती साड़ी', 'Yellow cotton saree', 'saree', 'cottonsaree', 'yellow', 699, 999, ['Free'], ['chhath'], 5, true],
  ['हरी शिफ़ॉन साड़ी', 'Green chiffon saree', 'saree', 'chiffon', 'green', 999, 1499, ['Free'], [], 19, true],
  ['गुलाबी जॉर्जेट साड़ी', 'Pink georgette saree', 'saree', 'georgette', 'pink', 1199, 1699, ['Free'], ['diwali'], 6, true],
  ['नारंगी छठ साड़ी', 'Orange Chhath saree', 'saree', 'cottonsaree', 'orange', 799, 1099, ['Free'], ['chhath'], 1, true],
  ['सुनहरा ब्लाउज़', 'Ready blouse', 'saree', 'blouse', 'maroon', 299, 449, ['S', 'M', 'L', 'XL'], [], 12, true],
  ['सूती पेटीकोट', 'Cotton petticoat', 'saree', 'petticoat', 'cream', 199, 299, ['Free'], [], 30, true],
  ['सूती बनियान', 'Cotton vest', 'inner', 'vest', 'white', 149, 199, ['M', 'L', 'XL', 'XXL'], [], 20, true],
  ['पुरुष अंडरवियर (3)', 'Men briefs pack of 3', 'inner', 'brief', 'grey', 299, 399, ['M', 'L', 'XL'], [], 25, true],
  ['सूती ब्रा', 'Cotton bra', 'inner', 'bra', 'pink', 249, 349, ['S', 'M', 'L'], [], 17, true],
  ['थर्मल इनर सेट', 'Thermal inner set', 'inner', 'thermal', 'grey', 599, 899, ['M', 'L', 'XL'], ['winter'], 3, true],
  ['चमड़े की बेल्ट', 'Leather belt', 'acc', 'belt', 'brown', 299, 450, ['Free'], [], 6, true],
  ['लेडीज़ पर्स', 'Ladies purse', 'acc', 'purse', 'maroon', 449, 699, ['Free'], ['diwali'], 9, true],
  ['ऊनी मोज़े (2 जोड़ी)', 'Wool socks, 2 pairs', 'acc', 'socks', 'grey', 149, 199, ['Free'], ['winter'], 4, true],
  ['ऊनी टोपी', 'Wool cap', 'acc', 'cap', 'navy', 199, 299, ['Free'], ['winter'], 2, true]
];

const items = rows.map((r, i) => ({
  id: 'd' + String(i + 1).padStart(3, '0'),
  name: r[0], nameEn: r[1], cat: r[2], type: r[3], colorId: r[4], price: r[5], mrp: r[6], sizes: r[7], colls: r[8],
  isNew: r[9] <= 7, inStock: r[10], photos: [], createdAt: now - r[9] * day
}));

const data = {
  publishedAt: new Date(now).toISOString(),
  settings: {
    shopName: 'पूजा ड्रेसेस', shopNameEn: 'Pooja Dresses & Vastravatika',
    whatsapp: '', phone: '', address: '', hours: 'सुबह 9 – रात 9 · 9 am – 9 pm', instagram: '', razorpay: '',
    deliveryFee: 40, freeAbove: 999, pin: '1234',
    festival: { active: true, id: 'diwali', text: 'दिवाली ऑफ़र · 20% तक छूट', textEn: 'Diwali offer · up to 20% off, till Diwali', color: '#b4562f' },
    sale: { active: false, cat: 'all', pct: 20 }
  },
  items
};
const root = path.join(__dirname, '..');
fs.writeFileSync(path.join(root, 'items.json'), JSON.stringify(data, null, 1));
fs.writeFileSync(path.join(root, 'assets', 'seed.js'), '/* offline fallback copy of items.json */\nwindow.PD_SEED = ' + JSON.stringify(data) + ';\n');
console.log('items:', items.length);
