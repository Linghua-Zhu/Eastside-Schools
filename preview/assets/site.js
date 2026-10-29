(() => {
  const SITE = window.SITE || { base: "", ext: "" };
  const url = (path, q) => SITE.base + "zh/" + path + "/" + SITE.ext + (q ? "?" + q : "");
  window.siteURL = url;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  window.esc = esc;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  window.store = store;

  /* tooltips */
  const TIP = document.getElementById("tipbox");
  const touch = window.matchMedia && matchMedia("(hover: none)").matches;
  function show(el) {
    if (!TIP) return;
    TIP.innerHTML = el.getAttribute("data-tip");
    TIP.style.display = "block";
    const r = el.getBoundingClientRect(), t = TIP.getBoundingClientRect();
    let x = r.left + r.width / 2 - t.width / 2, y = r.top - t.height - 8;
    if (y < 6) y = r.bottom + 8;
    x = Math.max(6, Math.min(window.innerWidth - t.width - 6, x));
    TIP.style.left = x + "px"; TIP.style.top = y + "px";
  }
  function hide() { if (TIP) TIP.style.display = "none"; }
  window.showTip = show; window.hideTip = hide;
  if (!touch) {
    document.addEventListener("mouseover", e => { const t = e.target.closest && e.target.closest("[data-tip]"); if (t) show(t); });
    document.addEventListener("mouseout", e => { const t = e.target.closest && e.target.closest("[data-tip]"); if (t && !(e.relatedTarget && t.contains(e.relatedTarget))) hide(); });
  }
  document.addEventListener("focusin", e => { const t = e.target.closest && e.target.closest("[data-tip]"); if (t) show(t); });
  document.addEventListener("focusout", hide);
  document.addEventListener("click", e => {
    const t = e.target.closest && e.target.closest("[data-tip]");
    if (touch && t && !t.closest("a")) { show(t); return; }
    if (!t) hide();
  });
  window.addEventListener("scroll", hide, { passive: true });

  /* search */
  const IDX = (window.SEARCH || []).map(x => ({ label: x[0], sub: x[1], path: x[2], kw: (x[0] + " " + x[3]).toLowerCase(), zip: x[4] }));
  function find(q) {
    q = q.trim().toLowerCase();
    if (!q) return [];
    if (/^\d{5}$/.test(q)) return IDX.filter(x => x.zip === q).slice(0, 20);
    const words = q.split(/\s+/);
    const scored = [];
    IDX.forEach(x => {
      const l = x.label.toLowerCase();
      if (!words.every(w => x.kw.includes(w))) return;
      let s = 1;
      if (l.startsWith(q)) s = 4;
      else if (l.split(/[\s\-]+/).some(t => t.startsWith(words[0]))) s = 3;
      else if (x.kw.split(/[\s\-]+/).some(t => t.startsWith(words[0]))) s = 2;
      scored.push([s, x]);
    });
    scored.sort((a, b) => b[0] - a[0] || a[1].label.localeCompare(b[1].label));
    return scored.slice(0, 12).map(s => s[1]);
  }
  const looksLikeAddress = q => /\d/.test(q) && /[a-z]{2,}/i.test(q) && !/^\d{5}$/.test(q.trim());
  document.querySelectorAll(".search").forEach(box => {
    const inp = box.querySelector("input"), out = box.querySelector(".search-out");
    let items = [], on = -1;
    const render = () => {
      const q = inp.value;
      items = find(q);
      on = items.length ? 0 : -1;
      if (!q.trim()) { out.hidden = true; out.textContent = ""; return; }
      if (!items.length) {
        out.innerHTML = "<p>" + (looksLikeAddress(q) ? "地址查询还在做，先输入校名或 5 位 zip。" : "没有找到。可以输入校名（英文）或 5 位 zip。") + "</p>";
      } else {
        out.innerHTML = items.map((x, i) => '<a href="' + url(x.path) + '" class="' + (i === on ? "on" : "") + '">' + esc(x.label) + '<span class="s">' + esc(x.sub) + "</span></a>").join("");
      }
      out.hidden = false;
    };
    inp.addEventListener("input", render);
    inp.addEventListener("focus", () => { if (inp.value.trim()) render(); });
    inp.addEventListener("keydown", e => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!items.length) return;
        e.preventDefault();
        on = (on + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        out.querySelectorAll("a").forEach((a, i) => a.classList.toggle("on", i === on));
      } else if (e.key === "Enter") {
        if (items.length) { e.preventDefault(); location.href = url(items[Math.max(0, on)].path); }
      } else if (e.key === "Escape") { out.hidden = true; inp.blur(); }
    });
    document.addEventListener("click", e => { if (!box.contains(e.target)) out.hidden = true; });
  });

  /* upcoming dates on school and district pages: hide what is over, keep four */
  document.querySelectorAll(".dates.upcoming").forEach(box => {
    const now = new Date(), t = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
    let shown = 0;
    const kids = Array.from(box.children);
    for (let i = 0; i < kids.length; i += 2) {
      const keep = kids[i].dataset.end >= t && shown < 4;
      kids[i].hidden = kids[i + 1].hidden = !keep;
      if (keep) shown++;
    }
    if (!shown) box.closest(".card").hidden = true;
  });

  /* home: level switch and this month's dates */
  const seg = document.getElementById("lv-seg");
  if (seg) {
    const mapBox = document.getElementById("home-map");
    const setLv = lv => {
      seg.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lv === lv)));
      document.querySelectorAll(".lvblock").forEach(b => { b.hidden = b.dataset.lv !== lv; });
      if (mapBox) mapBox.dataset.lv = lv;
      store.set("gssc-lv", lv);
      hide();
    };
    seg.querySelectorAll("button").forEach(b => b.addEventListener("click", () => setLv(b.dataset.lv)));
    const saved = store.get("gssc-lv");
    if (saved && saved !== "E" && /^[EMH]$/.test(saved)) setLv(saved);
  }
  const month = document.querySelector(".entry.month");
  if (month && window.PAGE && PAGE.events) {
    const now = new Date(), y = now.getFullYear(), m = now.getMonth() + 1;
    const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    const today = iso(now), mEnd = iso(new Date(y, m, 0)), mStart = iso(new Date(y, m - 1, 1));
    const live = PAGE.events.filter(e => (e.end || e.start) >= today);
    let list = live.filter(e => e.start <= mEnd && (e.end || e.start) >= mStart), title = m + " 月要做的事";
    if (!list.length) { list = live.slice(0, 4); title = "接下来要做的事"; }
    const fmt = s => { const p = s.split("-"); return Number(p[1]) + "/" + Number(p[2]); };
    month.querySelector(".t").textContent = title;
    const tag = e => '<span class="dtag ' + (e.d && e.d !== "PRIV" ? e.d : "") + '">' + (e.d === "PRIV" ? "私校" : esc(e.d || "")) + "</span> ";
    month.querySelector(".dates").innerHTML = list.slice(0, 4).map(e => '<span class="dt">' + fmt(e.start) + (e.end ? "–" + fmt(e.end) : "") + '</span><span class="w">' + tag(e) + esc(e.what) + "</span>").join("") || '<span class="dt"></span><span class="w">这段时间没有收录的日期</span>';
  }
})();
