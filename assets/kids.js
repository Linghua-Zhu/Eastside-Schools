// 托儿 and 课外 pages: tabs, the child care map and list, the school picker for before/after care
(() => {
  const $ = s => document.querySelector(s);
  const esc = window.esc;
  const store = window.store;
  const mi = (a, b) => {
    const dy = (a[0] - b[0]) * 69.17, dx = (a[1] - b[1]) * 69.17 * Math.cos((a[0] + b[0]) / 2 * Math.PI / 180);
    return Math.hypot(dx, dy);
  };
  const ageTxt = m => {
    if (m <= 0) return "出生";
    if (m < 24) return m + " 个月";
    const y = Math.floor(m / 12), r = m % 12;
    return r === 0 ? y + " 岁" : r === 6 ? y + " 岁半" : y + " 岁 " + r + " 个月";
  };
  const gmap = (n, a, c) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(n + " " + a + " " + c + " WA");
  const CCC = "https://www.findchildcarewa.org/PSS_Provider?id=";
  const out = (u, t) => '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(t) + "</a>";

  /* tabs: the hash picks a tab, or a block inside one */
  document.querySelectorAll(".tabs").forEach(bar => {
    const panels = Array.from(document.querySelectorAll(".tabp"));
    const set = (k, push) => {
      bar.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.tab === k)));
      panels.forEach(p => { p.hidden = p.dataset.tab !== k; });
      if (push) history.replaceState(null, "", "#" + k);
      document.dispatchEvent(new CustomEvent("tab", { detail: k }));
    };
    bar.querySelectorAll("button").forEach(b => b.addEventListener("click", () => set(b.dataset.tab, true)));
    const go = () => {
      const h = decodeURIComponent(location.hash.slice(1));
      if (!h) return;
      const p = panels.find(p => p.dataset.tab === h);
      if (p) { set(h, false); return; }
      const el = document.getElementById(h), host = el && el.closest(".tabp");
      if (host) { set(host.dataset.tab, false); requestAnimationFrame(() => el.scrollIntoView()); }
    };
    go();
    window.addEventListener("hashchange", go);
  });

  /* district chips over a grid of cards */
  document.querySelectorAll(".chips[data-for]").forEach(box => {
    const grid = document.getElementById(box.dataset.for);
    box.querySelectorAll(".chip").forEach(b => b.addEventListener("click", () => {
      box.querySelectorAll(".chip").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      grid.querySelectorAll("[data-d]").forEach(c => { c.hidden = !!b.dataset.f && c.dataset.d !== b.dataset.f; });
    }));
  });

  /* ---------- 托儿: map and list ---------- */
  const CC = window.CC;
  if (CC && $("#cc-list")) {
    const [W, H, S] = CC.geo;
    const C = CC.C.map(r => ({ id: r[0], n: r[1], a: r[2], c: r[3], z: r[4], x: r[5], y: r[6], ap: r[7], cap: r[8], s: r[9], e: r[10], ea: r[11], zh: r[12], lat: r[13], lon: r[14] }));
    const byId = {}; C.forEach(p => { byId[p.id] = p; });
    const order = {}; CC.cities.forEach((c, i) => { order[c] = i; });
    const box = $("#cc-map"), svg = box.querySelector("svg"), dots = svg.querySelector(".ccdots"), me = svg.querySelector(".ccme");
    const wrap = document.querySelector(".cc-wrap");
    const st = { loc: null, age: "", ea: false, zh: false, n: 20, sel: null };
    const ageOK = p => !st.age || (st.age === "i" ? p.s <= 11 : st.age === "t" ? p.s <= 29 && p.e >= 12 : p.s <= 59 && p.e >= 30);
    const eaOK = p => !st.ea || ["3", "3+", "4", "5"].includes(p.ea);
    const list = () => C.filter(p => ageOK(p) && eaOK(p) && (!st.zh || p.zh));
    const dist = p => st.loc && p.lat ? mi(st.loc, [p.lat, p.lon]) : null;
    const item = (p, sel) => {
      const d = dist(p);
      const tags = [];
      if (p.ea) tags.push("Early Achievers " + p.ea + " 级");
      if (p.zh) tags.push("说中文");
      return '<div class="cc-item' + (sel ? " sel" : "") + '" data-id="' + p.id + '"><div class="h"><b>' + esc(p.n) + "</b>" +
        (d != null ? '<span class="d">' + (p.ap ? "约 " : "") + d.toFixed(1) + " 英里</span>" : "") + "</div>" +
        '<div class="m">' + esc(p.a) + ", " + esc(p.c) + "</div>" +
        '<div class="m">' + ageTxt(p.s) + "到" + ageTxt(p.e) + (p.cap ? " · 执照上限 " + p.cap + " 个孩子" : "") + (p.ap ? " · 位置按 zip 估算" : "") + "</div>" +
        (tags.length ? '<ul class="feat">' + tags.map(t => "<li>" + esc(t) + "</li>").join("") + "</ul>" : "") +
        '<div class="links">' + out(CCC + p.id, "执照和检查记录") + out(gmap(p.n, p.a, p.c), "Google 地图") + "</div></div>";
    };
    const setView = () => {
      let vb = [0, 0, W, H];
      if (st.loc) {
        const L = 10 * S;
        vb = [st.loc[2] - L / 2, st.loc[3] - L / 2, L, L];
      }
      svg.setAttribute("viewBox", vb.map(v => v.toFixed(1)).join(" "));
      box.style.setProperty("--ks", (W / vb[2]).toFixed(3));
      box.classList.toggle("zoom", !!st.loc);
      wrap.classList.toggle("noloc", !st.loc);
    };
    const render = () => {
      const L = list();
      if (st.loc) L.sort((a, b) => (dist(a) ?? 99) - (dist(b) ?? 99));
      else L.sort((a, b) => (order[a.c] ?? 99) - (order[b.c] ?? 99) || a.n.localeCompare(b.n));
      $("#cc-count").textContent = L.length + " 家" + (L.length > st.n ? "，先显示 " + Math.min(st.n, L.length) + " 家" : "");
      $("#cc-sort").textContent = st.loc ? "按直线距离" : "按城市";
      const sel = st.sel && byId[st.sel];
      $("#cc-list").innerHTML = (sel ? item(sel, true) : "") + L.filter(p => p !== sel).slice(0, st.n).map(p => item(p, false)).join("");
      $("#cc-more").hidden = L.length <= st.n;
      const ks = st.loc ? W / (10 * S) : 1, r = (st.loc ? 5.5 : 3.2) / ks;
      dots.innerHTML = L.filter(p => p.x != null).map(p => '<circle class="cc' + (p.ap ? " ap" : "") + (p.id === st.sel ? " on" : "") + '" cx="' + p.x + '" cy="' + p.y + '" r="' + (p.id === st.sel ? r * 1.6 : r).toFixed(2) + '" data-id="' + p.id + '" data-tip="' + esc("<b>" + esc(p.n) + "</b><br>" + esc(p.c) + " · " + ageTxt(p.s) + "到" + ageTxt(p.e)) + '" vector-effect="non-scaling-stroke"/>').join("");
      me.innerHTML = st.loc ? '<circle cx="' + st.loc[2] + '" cy="' + st.loc[3] + '" r="' + (7 / ks).toFixed(2) + '" class="mepin" vector-effect="non-scaling-stroke"/><circle cx="' + st.loc[2] + '" cy="' + st.loc[3] + '" r="' + (2 * S).toFixed(1) + '" class="mering" vector-effect="non-scaling-stroke"/>' : "";
      setView();
    };
    const findLoc = q => {
      q = (q || "").trim();
      if (!q) return null;
      if (/^\d{5}$/.test(q)) return CC.LOC[q] ? q : undefined;
      const k = Object.keys(CC.LOC).find(k => k.toLowerCase() === q.toLowerCase());
      return k || undefined;
    };
    const inp = $("#cc-loc"), hint = $("#cc-maphint");
    const setLoc = (q, save) => {
      const k = findLoc(q);
      if (k === null) { st.loc = null; if (save) store.set("gssc-ccloc", ""); }
      else if (k === undefined) { hint.textContent = "没有找到“" + q + "”。可以输入城市名（英文）或 5 位 zip。"; return; }
      else { st.loc = CC.LOC[k]; if (save) store.set("gssc-ccloc", k); }
      hint.textContent = st.loc ? "圆圈是 2 英里。实心点是州政府给了坐标的地址，空心点是按 zip 估算的位置。点一个点看是哪一家。" : "实心点是州政府给了坐标的地址；空心点是按 zip 估算的位置。点一个点看是哪一家。";
      st.n = 20; render();
    };
    inp.addEventListener("change", () => setLoc(inp.value, true));
    inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); setLoc(inp.value, true); } });
    document.querySelectorAll("#cc-age .chip").forEach(b => b.addEventListener("click", () => {
      document.querySelectorAll("#cc-age .chip").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      st.age = b.dataset.a; st.n = 20; render();
    }));
    const ea = $("#cc-ea"); if (ea) ea.addEventListener("change", () => { st.ea = ea.checked; st.n = 20; render(); });
    const zh = $("#cc-zh"); if (zh) zh.addEventListener("change", () => { st.zh = zh.checked; st.n = 20; render(); });
    $("#cc-more").addEventListener("click", () => { st.n += 20; render(); });
    dots.addEventListener("click", e => {
      const c = e.target.closest("circle[data-id]");
      if (!c) return;
      st.sel = st.sel === c.dataset.id ? null : c.dataset.id;
      render();
      if (st.sel) { const it = $("#cc-list .cc-item.sel"); if (it && it.getBoundingClientRect().top > window.innerHeight) it.scrollIntoView({ block: "nearest" }); }
    });
    const saved = store.get("gssc-ccloc");
    if (saved && CC.LOC[saved]) { inp.value = saved; setLoc(saved, false); } else render();
  }

  /* ---------- 课外: before and after school care by school ---------- */
  const SA = window.SAD;
  if (SA && $("#sa-school")) {
    const P = SA.SA.map(r => ({ id: r[0], n: r[1], a: r[2], c: r[3], cap: r[4], s: r[5], e: r[6], lat: r[7], lon: r[8], ap: r[9], at: r[10] }));
    const E = {}; SA.E.forEach(r => { E[r[0]] = { id: r[0], n: r[1], d: r[2], lat: r[3], lon: r[4], at: r[5], ch: r[6], off: r[7] }; });
    const sel = $("#sa-school"), box = $("#sa-out");
    const prog = (p, d) => '<li><span class="h"><b>' + esc(p.n) + "</b>" + (d != null ? '<span class="d">' + (p.ap ? "约 " : "") + d.toFixed(1) + " 英里</span>" : "") + "</span>" +
      '<span class="m">' + esc(p.a) + ", " + esc(p.c) + " · " + ageTxt(p.s) + "到" + ageTxt(p.e) + (p.cap ? " · 执照上限 " + p.cap + " 人" : "") + "</span>" +
      '<span class="links">' + out(CCC + p.id, "执照和检查记录") + out(gmap(p.n, p.a, p.c), "Google 地图") + "</span></li>";
    const show = id => {
      const s = E[id];
      if (!s) { box.innerHTML = '<p class="note">选一所小学，显示学校里的持照托管项目、学区的安排和附近的其他托管。</p>'; return; }
      const here = s.at.map(i => P[i]);
      const near = P.map((p, i) => [p, i]).filter(([p, i]) => !s.at.includes(i) && p.lat).map(([p]) => [p, mi([s.lat, s.lon], [p.lat, p.lon])])
        .filter(x => x[1] <= 1.5).sort((a, b) => a[1] - b[1]).slice(0, 5);
      const card = document.querySelector('.sa-d[data-d="' + s.d + '"]');
      const dl = card && card.querySelector("dl");
      const dname = card ? card.querySelector("h3").textContent.trim() : s.d;
      box.innerHTML = '<div class="sa-res"><h3>' + esc(s.n) + ' <a class="sm" href="' + window.siteURL(id) + '">学校页面 →</a></h3>' +
        (s.off ? '<div class="blk"><h4>学区名单上的托管</h4><p>' + esc(s.off) + "</p></div>" : "") +
        '<div class="blk"><h4>州政府持照名单里的校内项目</h4>' + (here.length ? "<ul class=\"sa-list\">" + here.map(p => prog(p, null)).join("") + "</ul>" :
          '<p class="mut">' + (s.off ? "州政府的持照名单里没有对到这所学校的项目。学区自己办的项目不一定在这份名单里。" : "州政府的持照名单里，这所学校没有校内的托管项目。学区或学校自己办的项目不一定需要执照，看下面学区的说明，或者问学校前台。") + "</p>") + "</div>" +
        '<div class="blk"><h4>' + esc(dname) + " 学区的安排</h4>" + (dl ? dl.outerHTML : '<p class="mut">还在整理。</p>') + "</div>" +
        (near.length ? '<div class="blk"><h4>1.5 英里内的其他持照课后项目</h4><p class="mut sm">不在学校里，多数要家长接送，有的提供接送，以机构说明为准。</p><ul class="sa-list">' + near.map(([p, d]) => prog(p, d)).join("") + "</ul></div>" : "") +
        "</div>";
    };
    sel.addEventListener("change", () => {
      show(sel.value);
      const u = new URL(location.href); if (sel.value) u.searchParams.set("s", sel.value); else u.searchParams.delete("s");
      history.replaceState(null, "", u.pathname + u.search + u.hash);
      store.set("gssc-saschool", sel.value);
    });
    const q = new URLSearchParams(location.search).get("s") || store.get("gssc-saschool");
    if (q && E[q]) { sel.value = q; show(q); }
  }
})();
