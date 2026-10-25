# Royal Apparel — Commerce & Back-Office Demo

A portfolio demo of the system **Rashed Al-Balah** built as Design & Web Team Lead for The Royal Apparel, Inc. (Dec 2024 – present): a storefront, an admin panel, an accounting module and a purchasing module, all working from one shared data model.

> **Demo mode.** All products, customers, suppliers and amounts are fictional sample data. Nothing here reflects the client's real customers or financials. Changes you make are kept in your browser only and can be reset at any time.

## What you can try

| Module | Screens | Try this |
|---|---|---|
| Storefront | Catalog, category filter, cart, checkout | Add items and place a demo order |
| Admin panel | Dashboard, orders, products & stock | Find your new order, edit a price or stock level |
| Accounting | Profit & loss, general ledger, CSV export | See your order land in revenue and cost of goods sold |
| Purchasing | Purchase orders, suppliers | Auto-create a PO for low-stock items, then approve and receive it to restock |

Every module reads and writes the same data, so an action in one shows up in the others.

## Tech

Plain HTML, CSS and JavaScript. No build step, no backend, no dependencies. Responsive down to phone width, with light and dark mode.

```
index.html        app entry and demo banner
assets/data.js    seeded sample data generator (BRAND settings at the top)
assets/app.js     router and all four modules
assets/style.css  design tokens and layout
```

## Run locally

Open `index.html` in a browser, or serve the folder: `npx serve .`

## Publish on GitHub Pages

1. Create a repository (for example `royal-apparel-demo`) and upload these files to the root.
2. Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
3. The demo goes live at `https://mralbalah.github.io/royal-apparel-demo/`.

## Unbranded version

To present this without the client's name, edit `window.BRAND` at the top of `assets/data.js`.

---

Built by [Rashed Al-Balah](https://github.com/mralbalah) · Full-Stack Developer & Digital Growth Lead · Remote · Worldwide
