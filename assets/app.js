// Royal Apparel demo: storefront, admin panel, accounting and purchasing on sample data.
// No backend. Changes are kept in this browser only (localStorage) and can be reset.
(function () {
  const KEY = "ra-demo-v2";
  const fresh = () => JSON.parse(JSON.stringify(window.DEMO));
  let db;
  try { db = JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch (e) { db = fresh(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} };
  let cart = [];

  const $ = (s) => document.querySelector(s);
  const usd = (n) => (n < 0 ? "-$" : "$") + Math.abs(Number(n)).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const usd2 = (n) => (n < 0 ? "-$" : "$") + Math.abs(Number(n)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const prod = (id) => db.products.find((p) => p.id === id);
  const supplier = (id) => db.suppliers.find((s) => s.id === id);
  const pill = (s) => {
    const cls = { Paid: "ok", Delivered: "ok", Received: "ok", Closed: "ok", Approved: "ok", Shipped: "warn", Pending: "warn", Ordered: "warn", "Pending approval": "warn", Draft: "", Refunded: "bad" }[s] || "";
    return `<span class="pill ${cls}">${s}</span>`;
  };
  const toast = (msg) => { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); setTimeout(() => t.classList.remove("on"), 1800); };
  const month = (d) => d.slice(0, 7);
  const monthName = (m) => new Date(m + "-01T00:00:00").toLocaleString("en-US", { month: "short" });

  /* ---------- Shell ---------- */
  const NAV = [
    ["Store", [["#/store", "🛍", "Storefront"]]],
    ["Admin panel", [["#/admin", "▦", "Dashboard"], ["#/admin/orders", "🧾", "Orders"], ["#/admin/products", "👕", "Products & stock"]]],
    ["Accounting", [["#/accounting", "📊", "Profit & loss"], ["#/accounting/ledger", "📒", "General ledger"]]],
    ["Purchasing", [["#/purchasing", "📦", "Purchase orders"], ["#/purchasing/suppliers", "🏭", "Suppliers"]]],
  ];
  function shell(body) {
    const here = location.hash || "#/admin";
    return `<div class="shell">
      <aside class="side" id="side">
        <div class="logo"><div class="crest">R</div>${BRAND.name}</div>
        ${NAV.map(([label, links]) => `<div class="nav-label">${label}</div><nav class="nav">${links.map(([h, i, t]) => `<a href="${h}" class="${here === h ? "on" : ""}">${i} ${t}</a>`).join("")}</nav>`).join("")}
        <div class="side-foot">
          <button class="btn" id="theme" style="width:100%;margin-bottom:8px">Toggle dark mode</button>
          <button class="btn" id="reset" style="width:100%">Reset demo data</button>
        </div>
      </aside>
      <main><button class="btn menu-btn" id="menu">☰ Menu</button>${body}</main>
    </div>`;
  }
  const head = (title, sub, actions = "") => `<div class="head"><div><h1>${title}</h1><p>${sub}</p></div><div>${actions}</div></div>`;

  /* ---------- Storefront ---------- */
  function store() {
    const cats = ["All", ...new Set(db.products.map((p) => p.category))];
    const count = cart.reduce((s, c) => s + c.qty, 0);
    return `<div class="store-nav"><div class="logo" style="margin:0"><div class="crest">R</div>${BRAND.name}</div>
        <div><a href="#/admin" class="btn">Admin panel</a> <button class="btn primary" id="cartBtn">Cart<span class="cart-count">${count}</span></button></div></div>
      <section class="hero"><h1>${BRAND.tagline}</h1><p>Premium cotton basics, outerwear and denim. Free US shipping over $100.</p></section>
      <div class="toolbar" style="padding:24px 32px 0">${cats.map((c) => `<button class="btn cat" data-c="${c}">${c}</button>`).join("")}</div>
      <div class="grid products" id="plist">${productCards("All")}</div>
      <aside class="drawer" id="drawer"></aside>`;
  }
  function productCards(cat) {
    return db.products.filter((p) => cat === "All" || p.category === cat).map((p) => `
      <div class="card prod"><div class="swatch" style="background:${p.color}">R</div>
        <div>${p.name}</div><div class="muted">${p.category}</div>
        <div class="row"><span class="price">${usd(p.price)}</span>
        ${p.stock > 0 ? `<button class="btn primary add" data-id="${p.id}">Add</button>` : `<span class="pill bad">Sold out</span>`}</div>
        ${p.stock < 10 && p.stock > 0 ? `<div class="muted" style="font-size:12px">Only ${p.stock} left</div>` : ""}
      </div>`).join("");
  }
  function drawer() {
    const sub = cart.reduce((s, c) => s + c.qty * prod(c.id).price, 0);
    const ship = sub > 100 || sub === 0 ? 0 : 8, tax = Math.round(sub * 7) / 100;
    $("#drawer").innerHTML = `<div class="row"><h3 style="margin:0">Your cart</h3><button class="btn" id="close">✕</button></div>
      ${cart.length ? cart.map((c) => `<div class="row"><span>${prod(c.id).name} × ${c.qty}</span><span>${usd(c.qty * prod(c.id).price)}</span></div>`).join("") : `<p class="muted">Your cart is empty.</p>`}
      <hr style="border:0;border-top:1px solid var(--line)">
      <div class="row muted"><span>Shipping</span><span>${usd2(ship)}</span></div>
      <div class="row muted"><span>Sales tax (7%)</span><span>${usd2(tax)}</span></div>
      <div class="row"><b>Total</b><b>${usd2(sub + ship + tax)}</b></div>
      <button class="btn primary" id="checkout" style="width:100%;margin-top:12px" ${cart.length ? "" : "disabled"}>Place demo order</button>
      <p class="muted" style="font-size:12px">Demo checkout. No payment is taken. The order appears in the admin panel and the ledger.</p>`;
    $("#close").onclick = () => $("#drawer").classList.remove("open");
    $("#checkout").onclick = () => {
      const lines = cart.map((c) => ({ id: c.id, qty: c.qty, price: prod(c.id).price }));
      const o = { id: "RA-" + (24800 + db.orders.length), date: new Date().toISOString().slice(0, 10), customer: "Demo Visitor", state: "NY", channel: "Web", status: "Paid", lines, subtotal: sub, shipping: ship, tax, total: Math.round((sub + ship + tax) * 100) / 100 };
      db.orders.unshift(o);
      lines.forEach((l) => (prod(l.id).stock -= l.qty));
      db.ledger.unshift({ date: o.date, ref: o.id, account: "Sales revenue", type: "income", amount: sub });
      db.ledger.unshift({ date: o.date, ref: o.id, account: "Cost of goods sold", type: "expense", amount: lines.reduce((s, l) => s + l.qty * prod(l.id).cost, 0) });
      cart = []; save(); render(); toast("Order " + o.id + " placed. See it under Admin → Orders.");
    };
  }
  function bindStore() {
    document.querySelectorAll(".cat").forEach((b) => (b.onclick = () => ($("#plist").innerHTML = productCards(b.dataset.c), bindAdd())));
    $("#cartBtn").onclick = () => { drawer(); $("#drawer").classList.add("open"); };
    bindAdd();
  }
  function bindAdd() {
    document.querySelectorAll(".add").forEach((b) => (b.onclick = () => {
      const c = cart.find((x) => x.id === b.dataset.id);
      c ? c.qty++ : cart.push({ id: b.dataset.id, qty: 1 });
      document.querySelector(".cart-count").textContent = cart.reduce((s, x) => s + x.qty, 0);
      toast(prod(b.dataset.id).name + " added to cart");
    }));
  }

  /* ---------- Admin ---------- */
  function dashboard() {
    const live = db.orders.filter((o) => o.status !== "Refunded");
    const rev = live.reduce((s, o) => s + o.subtotal, 0);
    const aov = rev / live.length;
    const low = db.products.filter((p) => p.stock < p.reorder);
    const byMonth = {};
    live.forEach((o) => (byMonth[month(o.date)] = (byMonth[month(o.date)] || 0) + o.subtotal));
    const months = Object.keys(byMonth).sort();
    const max = Math.max(...Object.values(byMonth));
    const top = {};
    live.forEach((o) => o.lines.forEach((l) => (top[l.id] = (top[l.id] || 0) + l.qty * l.price)));
    const topList = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const ch = {};
    live.forEach((o) => (ch[o.channel] = (ch[o.channel] || 0) + o.subtotal));
    return head("Dashboard", "Store performance across web, wholesale and pop-up channels.") + `
      <div class="grid k4">
        <div class="card kpi"><div class="l">Net sales</div><div class="v">${usd(rev)}</div><div class="d">Last 90 days</div></div>
        <div class="card kpi"><div class="l">Orders</div><div class="v">${live.length}</div><div class="d">${db.orders.length - live.length} refunded</div></div>
        <div class="card kpi"><div class="l">Average order</div><div class="v">${usd(aov)}</div><div class="d">Before tax & shipping</div></div>
        <div class="card kpi"><div class="l">Low-stock SKUs</div><div class="v">${low.length}</div><div class="d" style="color:var(--warn)">Below reorder point</div></div>
      </div>
      <div class="grid c2" style="margin-top:16px">
        <div class="card"><h3>Sales by month</h3><div class="bars" style="margin-bottom:24px">${months.map((m) => `<div style="height:${(byMonth[m] / max) * 100}%" title="${monthName(m)}: ${usd(byMonth[m])}"><span>${monthName(m)}</span></div>`).join("")}</div></div>
        <div class="card"><h3>Sales by channel</h3>${Object.entries(ch).map(([k, v]) => `<div class="row"><span>${k}</span><span>${usd(v)}</span></div><div class="meter"><i style="width:${(v / rev) * 100}%"></i></div>`).join("")}</div>
      </div>
      <div class="grid c2" style="margin-top:16px">
        <div class="card"><h3>Recent orders</h3>${orderTable(db.orders.slice(0, 6))}</div>
        <div class="card"><h3>Top products</h3>${topList.map(([id, v]) => `<div class="row"><span>${prod(id).name}</span><b>${usd(v)}</b></div>`).join("")}</div>
      </div>`;
  }
  function orderTable(list) {
    return `<div class="tbl"><table><tr><th>Order</th><th>Date</th><th>Customer</th><th>Channel</th><th>Status</th><th class="n">Total</th></tr>
      ${list.map((o) => `<tr><td><b>${o.id}</b></td><td>${o.date}</td><td>${o.customer}<div class="muted" style="font-size:12px">${o.state}</div></td><td>${o.channel}</td><td>${pill(o.status)}</td><td class="n">${usd2(o.total)}</td></tr>`).join("")}</table></div>`;
  }
  function orders() {
    return head("Orders", "Every order from the storefront, wholesale and pop-up events.") + `
      <div class="card"><div class="toolbar"><input id="q" placeholder="Search order or customer"><select id="st"><option value="">All statuses</option>${[...new Set(db.orders.map((o) => o.status))].map((s) => `<option>${s}</option>`).join("")}</select></div>
      <div id="otable">${orderTable(db.orders)}</div></div>`;
  }
  function bindOrders() {
    const f = () => { const q = $("#q").value.toLowerCase(), s = $("#st").value; $("#otable").innerHTML = orderTable(db.orders.filter((o) => (!s || o.status === s) && (o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q)))); };
    $("#q").oninput = f; $("#st").onchange = f;
  }
  function products() {
    return head("Products & stock", "Edit prices and stock. Changes show on the storefront right away.") + `
      <div class="card tbl"><table><tr><th>SKU</th><th>Product</th><th>Category</th><th class="n">Cost</th><th class="n">Price</th><th class="n">Margin</th><th class="n">Stock</th><th></th></tr>
      ${db.products.map((p) => `<tr><td class="muted">${p.sku}</td><td><b>${p.name}</b></td><td>${p.category}</td><td class="n">${usd(p.cost)}</td>
        <td class="n"><input type="number" value="${p.price}" data-id="${p.id}" data-f="price" style="width:80px;text-align:right"></td>
        <td class="n">${Math.round((1 - p.cost / p.price) * 100)}%</td>
        <td class="n"><input type="number" value="${p.stock}" data-id="${p.id}" data-f="stock" style="width:80px;text-align:right"></td>
        <td>${p.stock < p.reorder ? `<span class="pill warn">Reorder</span>` : `<span class="pill ok">OK</span>`}</td></tr>`).join("")}</table></div>`;
  }
  function bindProducts() {
    document.querySelectorAll("input[data-f]").forEach((i) => (i.onchange = () => { prod(i.dataset.id)[i.dataset.f] = Math.max(0, Number(i.value)); save(); render(); toast("Saved"); }));
  }

  /* ---------- Accounting ---------- */
  function pnl() {
    const months = [...new Set(db.ledger.map((l) => month(l.date)))].sort().slice(-3);
    const accounts = [...new Set(db.ledger.filter((l) => l.type !== "asset").map((l) => l.account))];
    const sum = (acc, m) => db.ledger.filter((l) => l.account === acc && month(l.date) === m).reduce((s, l) => s + l.amount, 0);
    const tot = (type, m) => db.ledger.filter((l) => l.type === type && month(l.date) === m).reduce((s, l) => s + l.amount, 0);
    const inc = accounts.filter((a) => db.ledger.find((l) => l.account === a).type === "income");
    const exp = accounts.filter((a) => !inc.includes(a));
    const all = (type) => months.reduce((s, m) => s + tot(type, m), 0);
    const net = all("income") - all("expense");
    const line = (a) => `<tr><td>${a}</td>${months.map((m) => `<td class="n">${usd(sum(a, m))}</td>`).join("")}<td class="n"><b>${usd(months.reduce((s, m) => s + sum(a, m), 0))}</b></td></tr>`;
    return head("Profit & loss", "Built automatically from orders, cost of goods sold and monthly operating costs.", `<button class="btn" id="csv">Export CSV</button>`) + `
      <div class="grid k4">
        <div class="card kpi"><div class="l">Revenue (3 mo)</div><div class="v">${usd(all("income"))}</div></div>
        <div class="card kpi"><div class="l">Expenses (3 mo)</div><div class="v">${usd(all("expense"))}</div></div>
        <div class="card kpi"><div class="l">Net profit</div><div class="v" style="color:${net >= 0 ? "var(--ok)" : "var(--bad)"}">${usd(net)}</div></div>
        <div class="card kpi"><div class="l">Net margin</div><div class="v">${Math.round((net / all("income")) * 100)}%</div></div>
      </div>
      <div class="card tbl" style="margin-top:16px"><table>
        <tr><th>Account</th>${months.map((m) => `<th class="n">${monthName(m)} 2026</th>`).join("")}<th class="n">Total</th></tr>
        <tr><td colspan="${months.length + 2}" class="muted"><b>Income</b></td></tr>${inc.map(line).join("")}
        <tr><td colspan="${months.length + 2}" class="muted"><b>Expenses</b></td></tr>${exp.map(line).join("")}
        <tr><td><b>Net profit</b></td>${months.map((m) => `<td class="n"><b>${usd(tot("income", m) - tot("expense", m))}</b></td>`).join("")}<td class="n"><b>${usd(net)}</b></td></tr>
      </table></div>`;
  }
  function ledger() {
    return head("General ledger", "Every posted transaction, newest first.", `<button class="btn" id="csv">Export CSV</button>`) + `
      <div class="card tbl"><table><tr><th>Date</th><th>Reference</th><th>Account</th><th class="n">Debit</th><th class="n">Credit</th></tr>
      ${db.ledger.slice(0, 120).map((l) => `<tr><td>${l.date}</td><td class="muted">${l.ref}</td><td>${l.account}</td><td class="n">${l.type !== "income" ? usd2(l.amount) : ""}</td><td class="n">${l.type === "income" ? usd2(l.amount) : ""}</td></tr>`).join("")}</table></div>`;
  }
  function bindCsv() {
    const b = $("#csv"); if (!b) return;
    b.onclick = () => {
      const rows = [["date", "ref", "account", "type", "amount"], ...db.ledger.map((l) => [l.date, l.ref, l.account, l.type, l.amount])];
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" }));
      a.download = "royal-apparel-demo-ledger.csv"; a.click();
    };
  }

  /* ---------- Purchasing ---------- */
  function pos() {
    const open = db.purchaseOrders.filter((p) => !["Received", "Closed"].includes(p.status));
    const low = db.products.filter((p) => p.stock < p.reorder);
    const next = { Draft: "Pending approval", "Pending approval": "Approved", Approved: "Ordered", Ordered: "Received", Received: "Closed" };
    return head("Purchase orders", "Raise, approve and receive stock from suppliers.", low.length ? `<button class="btn primary" id="auto">Auto-create PO for ${low.length} low-stock SKUs</button>` : "") + `
      <div class="grid k4">
        <div class="card kpi"><div class="l">Open POs</div><div class="v">${open.length}</div></div>
        <div class="card kpi"><div class="l">Open value</div><div class="v">${usd(open.reduce((s, p) => s + p.total, 0))}</div></div>
        <div class="card kpi"><div class="l">Awaiting approval</div><div class="v">${db.purchaseOrders.filter((p) => p.status === "Pending approval").length}</div></div>
        <div class="card kpi"><div class="l">Suppliers</div><div class="v">${db.suppliers.length}</div></div>
      </div>
      <div class="card tbl" style="margin-top:16px"><table><tr><th>PO</th><th>Date</th><th>Supplier</th><th>Items</th><th>Status</th><th class="n">Total</th><th></th></tr>
      ${db.purchaseOrders.map((p) => `<tr><td><b>${p.id}</b></td><td>${p.date}</td><td>${supplier(p.supplier).name}</td>
        <td class="muted">${p.items.map((i) => i.qty + " × " + i.name).join("<br>")}</td><td>${pill(p.status)}</td><td class="n">${usd(p.total)}</td>
        <td>${next[p.status] ? `<button class="btn adv" data-id="${p.id}">Mark ${next[p.status].toLowerCase()}</button>` : ""}</td></tr>`).join("")}</table></div>`;
  }
  function bindPos() {
    const next = { Draft: "Pending approval", "Pending approval": "Approved", Approved: "Ordered", Ordered: "Received", Received: "Closed" };
    document.querySelectorAll(".adv").forEach((b) => (b.onclick = () => {
      const p = db.purchaseOrders.find((x) => x.id === b.dataset.id);
      p.status = next[p.status];
      if (p.status === "Received") {
        p.items.forEach((i) => { const pr = db.products.find((x) => x.sku === i.sku); if (pr) pr.stock += i.qty; });
        db.ledger.unshift({ date: new Date().toISOString().slice(0, 10), ref: p.id, account: "Inventory", type: "asset", amount: p.total });
      }
      save(); render(); toast(p.id + " → " + p.status + (p.status === "Received" ? ". Stock and inventory ledger updated." : ""));
    }));
    const auto = $("#auto");
    if (auto) auto.onclick = () => {
      const items = db.products.filter((p) => p.stock < p.reorder).map((p) => ({ sku: p.sku, name: p.name, qty: p.reorder * 4 - p.stock, unit: p.cost }));
      const po = { id: "PO-" + (3100 + db.purchaseOrders.length), date: new Date().toISOString().slice(0, 10), supplier: "S02", status: "Draft", items, total: items.reduce((s, i) => s + i.qty * i.unit, 0) };
      db.purchaseOrders.unshift(po); save(); render(); toast(po.id + " drafted for " + items.length + " SKUs");
    };
  }
  function suppliers() {
    return head("Suppliers", "Vendor terms, lead times and spend.") + `
      <div class="card tbl"><table><tr><th>Supplier</th><th>Category</th><th>Terms</th><th class="n">Lead time</th><th class="n">Rating</th><th class="n">POs</th><th class="n">Spend</th></tr>
      ${db.suppliers.map((s) => { const p = db.purchaseOrders.filter((x) => x.supplier === s.id); return `<tr><td><b>${s.name}</b></td><td>${s.category}</td><td>${s.terms}</td><td class="n">${s.lead} days</td><td class="n">★ ${s.rating}</td><td class="n">${p.length}</td><td class="n">${usd(p.reduce((t, x) => t + x.total, 0))}</td></tr>`; }).join("")}</table></div>`;
  }

  /* ---------- Router ---------- */
  const routes = {
    "#/store": [store, bindStore, false], "#/admin": [dashboard], "#/admin/orders": [orders, bindOrders], "#/admin/products": [products, bindProducts],
    "#/accounting": [pnl, bindCsv], "#/accounting/ledger": [ledger, bindCsv], "#/purchasing": [pos, bindPos], "#/purchasing/suppliers": [suppliers],
  };
  function render() {
    const [view, bind, inShell = true] = routes[location.hash] || routes["#/admin"];
    $("#app").innerHTML = inShell ? shell(view()) : view();
    if (bind) bind();
    if (inShell) {
      $("#menu").onclick = () => $("#side").classList.toggle("open");
      $("#reset").onclick = () => { db = fresh(); cart = []; save(); render(); toast("Demo data reset"); };
      $("#theme").onclick = () => { const r = document.documentElement; r.dataset.theme = r.dataset.theme === "dark" ? "light" : "dark"; try { localStorage.setItem("ra-theme", r.dataset.theme); } catch (e) {} };
    }
    window.scrollTo(0, 0);
  }
  try { const t = localStorage.getItem("ra-theme"); if (t) document.documentElement.dataset.theme = t; } catch (e) {}
  document.title = BRAND.name + " · Demo";
  window.addEventListener("hashchange", render);
  render();
})();
