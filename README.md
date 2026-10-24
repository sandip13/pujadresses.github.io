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

- Voice search has two languages, chosen in the voice sheet and remembered: **Hindi / Bhojpuri** (hi-IN) and **English** (en-IN, also good for Hinglish).
  It uses the phone's built-in speech recognition (Chrome on Android; not inside WhatsApp's in-app browser), keeps the recogniser's best guesses and picks the one the shop understands best.
  English number words ("five hundred", "one thousand five hundred") and English words written in Hindi script ("ब्लू शर्ट अंडर 500") are understood.
  The owner panel has a mic next to the item name, in either language.
- The Hindi recogniser understands most Bhojpuri words;
  the search then maps words such as कमीज/शर्टवा, करिया/उज्जर/हरियर, लइकी, मेहरारू, “पाँच सौ के भीतर” to item types, colours, categories and price limits.
- Photo search compares the colour (and, for items the owner photographed, the picture itself) to find the same or similar items.

## Orders: form → WhatsApp → UPI payment → tracking

No server is needed; every step travels as a WhatsApp message with a link.

1. **Customer** opens the **order form** (home page button, or `#/order`), picks items, sizes and quantities, writes the address and taps **Send order on WhatsApp**.
   The message has an order number (e.g. `PD-2410-4821`) and, at the end, a link for the shop owner.
2. **Owner** taps that link (or pastes the whole message in **Orders → Add order**). The order appears under **Orders** with the next step.
3. For UPI orders the owner taps **Send payment link**. The customer gets a link that opens a page with a **Pay with UPI app** button
   (PhonePe / Google Pay / Paytm open with the amount filled in), the UPI ID to copy, and a QR code. An optional Razorpay link can be added per order.
4. Owner marks **Payment received → Packed → Out for delivery (who, phone, when) → Delivered**. Each tap opens WhatsApp with an update and a tracking link.
5. The customer's tracking page shows a step-by-step timeline; **My orders** on their phone lists all their orders.
   Cash-on-delivery and pay-at-shop orders skip the payment step; pickup orders end with “Ready at shop → Picked up”.

Set **Tools → Shop settings → UPI ID** first. A business/merchant UPI ID works best: some apps block payment links to personal UPI IDs.
Orders live on the owner's phone (included in **Backup**).

## Develop

Any static file server works, for example `python3 -m http.server`. `tools/make-seed.js` regenerates the demo catalogue.
