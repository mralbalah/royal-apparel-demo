// Sample data only. Every product, customer, supplier and amount here is fictional.
// Change BRAND to "Apparel Co." (or similar) to publish an unbranded version.
window.BRAND = { name: "Royal Apparel", legal: "The Royal Apparel, Inc.", tagline: "Everyday essentials, made to last." };

(function () {
  let seed = 42;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const int = (lo, hi) => Math.floor(lo + rnd() * (hi - lo + 1));
  const day = (offset) => { const d = new Date("2026-10-20"); d.setDate(d.getDate() - offset); return d.toISOString().slice(0, 10); };

  const products = [
    ["Heritage Crew Tee", "Tops", 28, "#1f2a44"], ["Oversized Pocket Tee", "Tops", 32, "#c8b89a"],
    ["Classic Oxford Shirt", "Tops", 58, "#dfe6ee"], ["Merino Knit Polo", "Tops", 64, "#3c5a4a"],
    ["Fleece Pullover Hoodie", "Outerwear", 72, "#5a5a5a"], ["Quilted Field Jacket", "Outerwear", 148, "#4b4a3a"],
    ["Coach Windbreaker", "Outerwear", 96, "#7a1f2b"], ["Straight Selvedge Denim", "Bottoms", 110, "#2a3550"],
    ["Relaxed Chino", "Bottoms", 68, "#b9a383"], ["Fleece Jogger", "Bottoms", 54, "#3a3a3a"],
    ["Canvas Tote", "Accessories", 24, "#e8e0cf"], ["Wool Beanie", "Accessories", 22, "#7a1f2b"],
  ].map(([name, cat, price, color], i) => ({
    id: "P" + (1001 + i), sku: "RA-" + cat.slice(0, 3).toUpperCase() + "-" + (100 + i),
    name, category: cat, price, cost: Math.round(price * (0.32 + rnd() * 0.12)), color,
    stock: int(4, 180), reorder: 25, sizes: cat === "Accessories" ? ["One size"] : ["XS", "S", "M", "L", "XL"],
  }));

  const first = ["Ava", "Liam", "Noah", "Mia", "Ethan", "Zoe", "Lucas", "Ella", "Mason", "Chloe", "Owen", "Grace"];
  const last = ["Carter", "Nguyen", "Brooks", "Patel", "Rivera", "Kim", "Foster", "Lopez", "Reed", "Hayes"];
  const states = ["CA", "NY", "TX", "FL", "WA", "IL", "GA", "CO", "MA", "AZ"];
  const statuses = ["Paid", "Paid", "Shipped", "Shipped", "Delivered", "Delivered", "Delivered", "Pending", "Refunded"];

  const orders = Array.from({ length: 220 }, (_, i) => {
    const lines = Array.from({ length: int(1, 3) }, () => { const p = pick(products); return { id: p.id, qty: int(1, 3), price: p.price }; });
    const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0);
    return {
      id: "RA-" + (24800 + i), date: day(Math.floor(i * 0.4)), customer: pick(first) + " " + pick(last),
      state: pick(states), channel: pick(["Web", "Web", "Web", "Wholesale", "Pop-up"]), status: pick(statuses),
      lines, subtotal, shipping: subtotal > 100 ? 0 : 8, tax: Math.round(subtotal * 0.07 * 100) / 100,
    };
  }).map((o) => ({ ...o, total: Math.round((o.subtotal + o.shipping + o.tax) * 100) / 100 }));

  const suppliers = [
    { id: "S01", name: "Northwind Textiles", category: "Fabric", terms: "Net 30", lead: 21, rating: 4.7 },
    { id: "S02", name: "Bluefield Cut & Sew", category: "Manufacturing", terms: "Net 45", lead: 35, rating: 4.5 },
    { id: "S03", name: "Harbor Trims Co.", category: "Trims & labels", terms: "Net 15", lead: 10, rating: 4.8 },
    { id: "S04", name: "Summit Packaging", category: "Packaging", terms: "Net 30", lead: 14, rating: 4.2 },
    { id: "S05", name: "Atlas Freight", category: "Logistics", terms: "Due on receipt", lead: 5, rating: 4.4 },
  ];
  const poStatus = ["Draft", "Pending approval", "Approved", "Ordered", "Received", "Received", "Closed"];
  const purchaseOrders = Array.from({ length: 18 }, (_, i) => {
    const s = pick(suppliers);
    const items = Array.from({ length: int(1, 3) }, () => { const p = pick(products); const q = int(50, 400); return { sku: p.sku, name: p.name, qty: q, unit: p.cost }; });
    return { id: "PO-" + (3100 + i), date: day(i * 4), supplier: s.id, status: pick(poStatus), items, total: items.reduce((t, x) => t + x.qty * x.unit, 0), expected: day(i * 4 - s.lead) };
  });

  // Ledger built from orders + POs + fixed monthly costs, so every report adds up.
  const ledger = [];
  orders.filter((o) => o.status !== "Refunded").forEach((o) => ledger.push({ date: o.date, ref: o.id, account: "Sales revenue", type: "income", amount: o.subtotal }));
  orders.filter((o) => o.status === "Refunded").forEach((o) => ledger.push({ date: o.date, ref: o.id, account: "Refunds", type: "expense", amount: o.subtotal }));
  orders.filter((o) => o.status !== "Refunded").forEach((o) => ledger.push({ date: o.date, ref: o.id, account: "Cost of goods sold", type: "expense", amount: o.lines.reduce((s, l) => s + l.qty * products.find((p) => p.id === l.id).cost, 0) }));
  // Received stock is an inventory asset, not a P&L expense; it reaches the P&L as cost of goods sold.
  purchaseOrders.filter((p) => ["Received", "Closed"].includes(p.status)).forEach((p) => ledger.push({ date: p.date, ref: p.id, account: "Inventory", type: "asset", amount: p.total }));
  ["2026-08-01", "2026-09-01", "2026-10-01"].forEach((d) => {
    ledger.push({ date: d, ref: "RENT", account: "Warehouse rent", type: "expense", amount: 1800 });
    ledger.push({ date: d, ref: "ADS", account: "Marketing", type: "expense", amount: int(700, 1200) });
    ledger.push({ date: d, ref: "SAAS", account: "Software & hosting", type: "expense", amount: 310 });
  });
  ledger.sort((a, b) => b.date.localeCompare(a.date));

  window.DEMO = { products, orders, suppliers, purchaseOrders, ledger };
})();
