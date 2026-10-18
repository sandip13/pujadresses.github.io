# Pooja Dresses & Vastravatika — website

A simple, fast shop website for a family clothing and saree store, plus an owner panel.
No server, no database and no monthly cost: it is just files, so it can be hosted free on GitHub Pages or Netlify.

| Page | Who | What |
|---|---|---|
| `index.html` | Customers | Shop: categories, collections, filters, voice search (Hindi/Bhojpuri), photo search, cart, order on WhatsApp |
| `admin.html` | Shop owner | Owner panel: PIN, items list, bulk actions, add by photo, multi-photo add, edit/delete with undo, sale mode, festival banner, shop settings, CSV import, backup, publish |
| `items.json` | — | The published catalogue and shop settings that customers see |

## How the owner updates the shop

1. Open `admin.html` on the owner's phone (Chrome). The first PIN is **1234**; change it in **Tools → Shop settings**.
2. Add or change items. Everything is saved on that phone immediately, and the shop on the same phone already shows the changes (with a yellow “unpublished changes” strip).
3. When ready, tap **Tools → बदलाव पब्लिश करें / Publish changes**. This downloads `items.json`.
4. Upload that `items.json` to the website (replace the old one). Now every customer sees the new items.

Photos are compressed on the phone (about 40–80 KB each) and stored inside `items.json`.
This is fine for a few hundred items with photos. For thousands of photos, the next step is a small backend or image storage.

**Important:** the owner's items live in that phone's browser storage until published. Use **Tools → Backup** regularly
(for example, send the backup file to yourself on WhatsApp).

## First things to set (Tools → Shop settings)

- WhatsApp number (orders and questions go here)
- Phone number for the Call button
- Shop address and hours
- Razorpay / UPI payment link (optional; shown after a UPI order)
- Delivery fee and free-delivery limit
- Instagram link (optional; small link in the footer)

## Voice and photo search

- Voice search uses the phone's built-in Hindi speech recognition (Chrome on Android). It understands most Bhojpuri words;
  the search then maps words such as कमीज/शर्टवा, करिया/उज्जर/हरियर, लइकी, मेहरारू, “पाँच सौ के भीतर” to item types, colours, categories and price limits.
- Photo search compares the colour (and, for items the owner photographed, the picture itself) to find the same or similar items.

## Develop

Any static file server works, for example `python3 -m http.server`. `tools/make-seed.js` regenerates the demo catalogue.
