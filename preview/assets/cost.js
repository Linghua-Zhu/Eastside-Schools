(() => {
  const D = window.DATA, esc = window.esc, url = window.siteURL;
  const META = D.COST || {}, BASE = META.year || 2026;
  const PRIV = Object.fromEntries(D.P.map(p => [p.key, p]));
  const KN = i => "孩子 " + (i + 1);
  const GR = g => g === 0 ? "K" : String(g);
  const GRN = g => g === 0 ? "K" : g + " 年级";
  const USD = v => "$" + Math.round(v).toLocaleString("en-US");
  const USDK = v => v >= 1e6 ? "$" + (v / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M" : "$" + Math.round(v / 1e3) + "k";
  const SY = y => y + "-" + String(y + 1).slice(2);
  const cell = (tag, text, cls) => { const el = document.createElement(tag); if (cls) el.className = cls; if (text != null) el.textContent = text; return el; };
  const tk = (p, g) => { if (!p || !p.tk) return null; const v = Array.isArray(p.tk) ? p.tk[g] : (p.tk[g] ?? p.tk[String(g)]); return v == null ? null : v; };
  const span = p => { let lo = null, hi = null; for (let g = 0; g <= 12; g++) if (tk(p, g) != null) { if (lo == null) lo = g; hi = g; } return [lo, hi]; };
  const defPlan = () => PRIV["basis-bellevue"] ? [{ from: 0, to: 3, s: "pub" }, { from: 4, to: 8, s: "basis-bellevue" }, { from: 9, to: 12, s: "pub" }] : [{ from: 0, to: 12, s: "pub" }];
  const C = { kids: [{ ky: 2027, same: false, segs: defPlan() }, { ky: 2029, same: true, segs: defPlan() }], rate: META.rate == null ? 5 : META.rate, dflt: 0 };

  /* state from the link, else from the last visit */
  function parsePlan(s) {
    let prev = -1;
    return s.split("_").map(t => {
      const i = t.indexOf("."); if (i < 0) return null;
      const g = t.slice(0, i), sc = t.slice(i + 1);
      let from, to;
      if (g.includes("-")) { [from, to] = g.split("-").map(Number); } else { from = prev + 1; to = Number(g); }
      prev = to;
      return { from, to, s: sc };
    }).filter(x => x && !isNaN(x.from) && !isNaN(x.to));
  }
  const clean = segs => {
    const out = (segs || []).map(x => ({ from: Math.max(0, Math.min(12, x.from | 0)), to: Math.max(0, Math.min(12, x.to | 0)), s: x.s === "pub" || PRIV[x.s] ? x.s : "pub" }))
      .map(x => x.from > x.to ? { from: x.to, to: x.from, s: x.s } : x);
    return out.length ? out.slice(0, 8) : [{ from: 0, to: 12, s: "pub" }];
  };
  function fromQuery(q) {
    const kv = Object.fromEntries(new URLSearchParams(q));
    if (kv.s && PRIV[kv.s] && !kv.p) {
      const [lo, hi] = span(PRIV[kv.s]);
      const segs = lo == null ? [{ from: 0, to: 12, s: kv.s }] : [lo > 0 ? { from: 0, to: lo - 1, s: "pub" } : null, { from: lo, to: hi, s: kv.s }, hi < 12 ? { from: hi + 1, to: 12, s: "pub" } : null].filter(Boolean);
      C.kids = [{ ky: 2027, same: false, segs }];
      return true;
    }
    if (!kv.p) return false;
    const n = Math.max(1, Math.min(4, Number(kv.k) || 1));
    const ys = (kv.y || "").split(",").map(Number);
    C.kids = [];
    for (let i = 0; i < n; i++) {
      const raw = i === 0 ? kv.p : kv["p" + (i + 1)];
      const same = i > 0 && (!raw || raw === "same");
      C.kids.push({ ky: ys[i] >= 2010 && ys[i] <= 2045 ? ys[i] : 2027 + 2 * i, same, segs: same ? clean(parsePlan(kv.p)) : clean(parsePlan(raw)) });
    }
    if (kv.r != null && !isNaN(Number(kv.r))) C.rate = Math.max(0, Math.min(12, Number(kv.r)));
    if (kv.d != null && !isNaN(Number(kv.d))) C.dflt = Math.max(0, Math.min(50, Number(kv.d)));
    return true;
  }
  const qstr = () => {
    const p = ["k=" + C.kids.length, "y=" + C.kids.map(k => k.ky).join(","), "p=" + C.kids[0].segs.map(s => s.from + "-" + s.to + "." + s.s).join("_")];
    C.kids.slice(1).forEach((k, i) => p.push("p" + (i + 2) + "=" + (k.same ? "same" : k.segs.map(s => s.from + "-" + s.to + "." + s.s).join("_"))));
    p.push("r=" + C.rate);
    if (C.dflt) p.push("d=" + C.dflt);
    return p.join("&");
  };
  if (!fromQuery(location.search.slice(1))) {
    try { const sv = JSON.parse(window.store.get("gssc-cost") || "null"); if (sv && Array.isArray(sv.kids) && sv.kids.length) { C.kids = sv.kids.slice(0, 4).map((k, i) => ({ ky: k.ky || 2027, same: i > 0 && !!k.same, segs: clean(k.segs) })); if (typeof sv.rate === "number") C.rate = sv.rate; if (typeof sv.dflt === "number") C.dflt = sv.dflt; } } catch (e) {}
  }
  const save = () => { window.store.set("gssc-cost", JSON.stringify(C)); history.replaceState(null, "", location.pathname + "?" + qstr()); };

  /* the plan each kid follows, grade by grade (later segments win) */
  const segsOf = i => (i > 0 && C.kids[i].same) ? C.kids[0].segs : C.kids[i].segs;
  function plan(i) {
    const g = Array(13).fill(null), dup = new Set();
    segsOf(i).forEach(s => { for (let x = s.from; x <= s.to; x++) { if (g[x] != null && g[x] !== s.s) dup.add(x); g[x] = s.s; } });
    const gaps = []; g.forEach((v, x) => { if (v == null) gaps.push(x); });
    return { g: g.map(v => v || "pub"), gaps, dup: [...dup].sort((a, b) => a - b) };
  }
  function discOf(p, j) {
    if (j === 0) return [0, 0];
    const r = p.sib;
    if (!r || r.st === "unknown") return [C.dflt, 0];
    if (r.st === "no") return [0, 0];
    const pick = a => !a || !a.length ? 0 : (a[Math.min(j, a.length - 1)] || 0);
    return [pick(r.pct), pick(r.usd)];
  }
  function compute() {
    const r = C.rate / 100, kids = [];
    C.kids.forEach((k, i) => {
      const P = plan(i), items = [];
      for (let g = 0; g <= 12; g++) {
        const s = P.g[g], p = s === "pub" ? null : PRIV[s], base = p ? tk(p, g) : 0;
        items.push({ kid: i, g, year: k.ky + g, s, p, base: base == null ? 0 : base, miss: !!p && base == null, past: k.ky + g < BASE, pct: 0, disc: 0 });
      }
      kids.push(items);
    });
    const all = kids.flat(), bys = {};
    all.forEach(it => { if (it.p && !it.miss && !it.past) (bys[it.year + "|" + it.s] = bys[it.year + "|" + it.s] || []).push(it); });
    Object.values(bys).forEach(list => { list.sort((a, b) => b.g - a.g); list.forEach((it, j) => { const [pc, usd] = discOf(it.p, j); it.pct = pc; it.disc = Math.min(it.base, Math.round(it.base * pc / 100 + usd)); }); });
    all.forEach(it => { const live = it.p && !it.miss && !it.past; it.today = live ? it.base - it.disc : 0; it.inf = live ? it.today * Math.pow(1 + r, it.year - BASE) : 0; });
    const years = {};
    all.forEach(it => { if (!it.past) (years[it.year] = years[it.year] || []).push(it); });
    const tot = kids.map(items => ({
      today: items.reduce((a, b) => a + b.today, 0), inf: items.reduce((a, b) => a + b.inf, 0),
      disc: items.reduce((a, b) => a + (b.p && !b.miss && !b.past ? b.disc : 0), 0),
      priv: items.filter(b => b.p && !b.miss && !b.past).length, miss: items.filter(b => b.miss && !b.past), past: items.filter(b => b.past && b.p).length
    }));
    return { kids, years, tot };
  }

  /* controls */
  const regions = {};
  D.P.forEach(p => { (regions[p.region] = regions[p.region] || []).push(p); });
  function schoolSelect(seg) {
    const sel = document.createElement("select");
    sel.className = "school" + (seg.s === "pub" ? "" : " priv");
    sel.setAttribute("aria-label", "这一段上哪所学校");
    sel.append(new Option("公立（划片校）", "pub"));
    Object.entries(regions).forEach(([reg, list]) => {
      const og = document.createElement("optgroup"); og.label = reg;
      list.forEach(p => { const [lo, hi] = span(p); og.append(new Option(p.name + (lo == null ? "（没有学费数字）" : "（" + GR(lo) + "-" + GR(hi) + "）"), p.key)); });
      sel.append(og);
    });
    sel.value = seg.s;
    return sel;
  }
  function gradeSelect(v, label) {
    const s = document.createElement("select"); s.setAttribute("aria-label", label);
    for (let g = 0; g <= 12; g++) s.append(new Option(GR(g), g));
    s.value = v; return s;
  }
  function buildKids() {
    const root = document.getElementById("cost-ctrl");
    root.textContent = "";
    C.kids.forEach((k, i) => {
      const card = cell("div", null, "kid");
      const head = cell("div", null, "kid-head");
      head.append(cell("span", KN(i), "t"));
      const yl = cell("label"); yl.append("哪年秋天上 K ");
      const ys = document.createElement("select"); ys.setAttribute("aria-label", KN(i) + " 哪年秋天上 K");
      for (let y = 2014; y <= 2042; y++) ys.append(new Option(String(y), y));
      ys.value = k.ky;
      ys.addEventListener("change", () => { k.ky = Number(ys.value); changed(); buildKids(); });
      yl.append(ys); head.append(yl);
      if (i > 0) { const x = cell("button", "删掉", "x"); x.type = "button"; x.addEventListener("click", () => { C.kids.splice(i, 1); changed(); buildKids(); }); head.append(x); }
      card.append(head);
      const g = BASE - k.ky;
      card.append(cell("span", g < 0 ? BASE + " 年秋天还没上学" : g > 12 ? "已经毕业" : BASE + " 年秋天在读 " + GRN(g), "kstat"));
      if (i > 0) {
        const sl = cell("label", null, "same");
        const cb = document.createElement("input"); cb.type = "checkbox"; cb.checked = k.same;
        cb.addEventListener("change", () => { k.same = cb.checked; if (!k.same) k.segs = JSON.parse(JSON.stringify(C.kids[0].segs)); changed(); buildKids(); });
        sl.append(cb, " 和孩子 1 用一样的方案"); card.append(sl);
      }
      if (!(i > 0 && k.same)) {
        k.segs.forEach((s, j) => {
          const ed = cell("div", null, "seg-ed"), r1 = cell("div", null, "r1");
          const f = gradeSelect(s.from, "这一段从几年级开始"), t = gradeSelect(s.to, "这一段到几年级");
          const upd = () => { let a = Number(f.value), b = Number(t.value); if (a > b) [a, b] = [b, a]; s.from = a; s.to = b; changed(); buildKids(); };
          f.addEventListener("change", upd); t.addEventListener("change", upd);
          r1.append(f, " 到 ", t, " 年级");
          const del = cell("button", "×", "del"); del.type = "button"; del.setAttribute("aria-label", "删掉这一段");
          del.disabled = k.segs.length === 1;
          del.addEventListener("click", () => { k.segs.splice(j, 1); changed(); buildKids(); });
          r1.append(del); ed.append(r1);
          const ss = schoolSelect(s);
          ss.addEventListener("change", () => { s.s = ss.value; changed(); buildKids(); });
          ed.append(ss);
          if (s.s !== "pub") {
            const p = PRIV[s.s], [lo, hi] = span(p);
            let miss = 0; for (let x = s.from; x <= s.to; x++) if (tk(p, x) == null) miss++;
            if (miss) ed.append(cell("p", lo == null ? p.name + " 没有公布学费，这一段按 0 算" : p.name + " 只有 " + GR(lo) + "-" + GR(hi) + " 年级的学费，这一段里没有的年级按没上算", "warn"));
          }
          card.append(ed);
        });
        const add = cell("button", "+ 加一段", "addseg"); add.type = "button";
        const last = k.segs[k.segs.length - 1];
        add.disabled = k.segs.length >= 8 || (last.to >= 12 && last.from >= 12);
        add.addEventListener("click", () => {
          const L = k.segs[k.segs.length - 1];
          if (L.to < 12) k.segs.push({ from: L.to + 1, to: 12, s: "pub" });
          else { const mid = Math.floor((L.from + 12) / 2); L.to = mid; k.segs.push({ from: mid + 1, to: 12, s: "pub" }); }
          changed(); buildKids();
        });
        card.append(add);
        const P = plan(i);
        if (P.gaps.length) card.append(cell("p", P.gaps.map(GR).join("、") + " 年级没有选学校，按公校算", "warn"));
        if (P.dup.length) card.append(cell("p", P.dup.map(GR).join("、") + " 年级选了两所学校，按后面那一段算", "warn"));
      }
      root.append(card);
    });
    if (C.kids.length < 4) {
      const b = cell("button", "+ 加一个孩子（最多 4 个）", "addkid"); b.type = "button";
      b.addEventListener("click", () => { const last = C.kids[C.kids.length - 1]; C.kids.push({ ky: Math.min(2042, last.ky + 2), same: true, segs: JSON.parse(JSON.stringify(C.kids[0].segs)) }); changed(); buildKids(); });
      root.append(b);
    }
    const rate = cell("label", null, "rate"); rate.append("学费每年涨");
    const rs = cell("span"); const ri = document.createElement("input"); ri.type = "number"; ri.min = 0; ri.max = 12; ri.step = 0.5; ri.value = C.rate; ri.setAttribute("aria-label", "学费每年涨幅");
    ri.addEventListener("change", () => { C.rate = Math.max(0, Math.min(12, Number(ri.value) || 0)); ri.value = C.rate; changed(); });
    rs.append(ri, "%"); rate.append(rs); root.append(rate);
    if (META.rate_note) root.append(cell("p", META.rate_note, "note"));
    const dl = cell("label", null, "rate"); dl.append("没查到折扣的私校，第二个孩子起减");
    const ds = cell("span"); const di = document.createElement("input"); di.type = "number"; di.min = 0; di.max = 50; di.step = 1; di.value = C.dflt; di.setAttribute("aria-label", "默认兄弟姐妹折扣");
    di.addEventListener("change", () => { C.dflt = Math.max(0, Math.min(50, Number(di.value) || 0)); di.value = C.dflt; changed(); });
    ds.append(di, "%"); dl.append(ds); root.append(dl);
  }
  function changed() { save(); renderOut(); }

  /* results */
  function renderOut() {
    const out = document.getElementById("cost-out");
    out.textContent = "";
    const R = compute(), n = C.kids.length;
    const total = { today: R.tot.reduce((a, b) => a + b.today, 0), inf: R.tot.reduce((a, b) => a + b.inf, 0), disc: R.tot.reduce((a, b) => a + b.disc, 0), priv: R.tot.reduce((a, b) => a + b.priv, 0) };
    const sum = cell("section", null, "card"); sum.setAttribute("aria-label", "一共多少");
    sum.append(cell("h2", "一共多少"));
    const tt = cell("div", null, "totals");
    [["按今年学费", total.today], ["每年涨 " + C.rate + "%", total.inf]].forEach(([k, v]) => { const d = cell("div"); d.append(cell("span", k, "k"), cell("span", USD(v), "v")); tt.append(d); });
    sum.append(tt);
    const kt = cell("div", null, "ktab");
    kt.append(cell("span", "", "h"), cell("span", "今年价", "h r"), cell("span", "涨价后", "h r"));
    R.tot.forEach((o, i) => { kt.append(cell("span", KN(i) + " · 私校 " + o.priv + " 年"), cell("span", USD(o.today), "r"), cell("span", USD(o.inf), "r")); });
    sum.append(kt);
    const notes = [];
    if (total.disc) notes.push("已减兄弟姐妹折扣 " + USD(total.disc) + "（按今年学费）");
    if (total.priv) notes.push("最后一笔在 " + SY(Math.max(...C.kids.map(k => k.ky + 12))) + " 学年");
    R.tot.forEach((o, i) => { if (o.past) notes.push(KN(i) + " " + BASE + " 年秋天以前的 " + o.past + " 年不算"); });
    R.tot.forEach((o, i) => { if (o.miss.length) notes.push(KN(i) + "有 " + o.miss.length + " 年所选学校没有这个年级的学费，没算"); });
    if (notes.length) sum.append(cell("p", notes.join("。") + "。", "note"));
    const years = Object.keys(R.years).map(Number).sort((a, b) => a - b);
    if (total.priv) {
      const fig = cell("div", null, "cfig"); fig.append(chart(R, years)); sum.append(fig);
      sum.append(cell("p", "每年要付的学费，按每年涨 " + C.rate + "% 算" + (n > 1 ? "，不同颜色是不同的孩子" : "") + "。手指点或鼠标放在柱子上看明细。", "note"));
    } else sum.append(cell("p", "方案里没有私校，学费是 0。把某一段改成一所私校试试。", "note"));
    const cp = cell("button", "复制这个方案的链接", "btn btn2"); cp.type = "button";
    const cpd = cell("span", null, "note");
    cp.addEventListener("click", () => {
      const u = location.origin + location.pathname + "?" + qstr();
      const done = () => { cpd.textContent = "已复制"; setTimeout(() => { cpd.textContent = ""; }, 2000); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(u).then(done).catch(() => { cpd.textContent = u; });
      else cpd.textContent = u;
    });
    const sh = cell("div"); sh.style.cssText = "display:flex;align-items:center;gap:10px;flex-wrap:wrap"; sh.append(cp, cpd); sum.append(sh);
    out.append(sum);
    const used = [];
    R.kids.flat().forEach(it => { if (it.p && !used.includes(it.p)) used.push(it.p); });
    if (used.length) {
      const box = cell("section", null, "card"); box.append(cell("h2", "方案里的私校"));
      const ul = cell("ul", null, "pschools");
      used.sort((a, b) => a.no - b.no).forEach(p => {
        const li = cell("li"); const a = cell("a"); a.href = url("private/" + p.slug); a.append(cell("b", p.name)); li.append(a);
        const bands = []; let cur = null;
        for (let g = 0; g <= 13; g++) {
          const v = g <= 12 ? tk(p, g) : null;
          if (cur && v !== cur.v) { bands.push((cur.from === g - 1 ? GR(cur.from) : GR(cur.from) + "-" + GR(g - 1)) + " " + USD(cur.v)); cur = null; }
          if (v != null && !cur) cur = { from: g, v };
        }
        li.append(cell("span", "学费 " + (bands.join("、") || "未公布") + (p.tk_note ? "（" + p.tk_note + "）" : ""), "m"));
        let sb = p.sib && p.sib.zh ? p.sib.zh.replace(/[。．.]\s*$/, "") : (p.sib && p.sib.st === "no" ? "没有兄弟姐妹折扣" : "官网没有写兄弟姐妹折扣");
        if ((!p.sib || p.sib.st === "unknown") && C.dflt) sb += "，这里按 " + C.dflt + "% 算";
        li.append(cell("span", "折扣：" + sb, "m"));
        ul.append(li);
      });
      box.append(ul); out.append(box);
    }
    if (total.priv) {
      const det = cell("details", null, "card cost-detail");
      det.append(cell("summary", "逐年明细"));
      const sc = cell("div", null, "scrollx"), t = cell("table"), h = cell("tr");
      h.append(cell("th", "学年")); C.kids.forEach((k, i) => h.append(cell("th", KN(i)))); h.append(cell("th", "当年合计"));
      const th = cell("thead"); th.append(h); t.append(th);
      const tb = cell("tbody");
      years.forEach(y => {
        const tr = cell("tr"); tr.append(cell("td", SY(y)));
        let ys = 0;
        C.kids.forEach((k, i) => {
          const it = R.years[y].find(x => x.kid === i), td = cell("td");
          if (!it) td.textContent = k.ky > y ? "还没上学" : "已毕业";
          else if (!it.p) td.textContent = GRN(it.g) + " · 公立";
          else if (it.miss) td.textContent = GRN(it.g) + " · " + it.p.name + " 没有这个年级";
          else { td.textContent = GRN(it.g) + " · " + it.p.name + " · " + USD(it.inf) + (it.disc ? "（已减 " + (it.pct ? it.pct + "%" : USD(it.disc)) + "）" : ""); ys += it.inf; }
          tr.append(td);
        });
        tr.append(cell("td", USD(ys))); tb.append(tr);
      });
      t.append(tb); sc.append(t); det.append(sc); out.append(det);
    }
    const as = cell("ul", null, "cost-assume");
    ["只算学费。不含注册费、杂费、校车、午餐、课后班和捐款，也不算助学金。",
     "私校按各校公布的 " + SY(BASE) + " 学年学费，公校按 0。“每年涨”是从 " + SY(BASE + 1) + " 学年起每年乘一次涨幅。",
     "兄弟姐妹折扣只在几个孩子同一年在同一所私校时算，算在年级低的孩子身上。",
     BASE + " 年秋天以前的年级不算。"].forEach(s => as.append(cell("li", s)));
    out.append(as);
  }
  const SVGNS = "http://www.w3.org/2000/svg";
  function sv(tag, attrs, text) { const el = document.createElementNS(SVGNS, tag); for (const k in attrs) if (attrs[k] != null) el.setAttribute(k, attrs[k]); if (text !== undefined) el.textContent = text; return el; }
  function chart(R, years) {
    const box = document.getElementById("cost-out"), cw = box ? box.clientWidth - 40 : 720;
    const n = C.kids.length, W = Math.max(340, Math.min(720, cw)), H = W < 500 ? 260 : 300, ML = W < 500 ? 46 : 58, MR = 10, MT = 30, MB = 40, pw = W - ML - MR, ph = H - MT - MB;
    const sums = years.map(y => R.years[y].reduce((a, b) => a + b.inf, 0)), max = Math.max(1, ...sums);
    const step = max <= 60e3 ? 10e3 : max <= 150e3 ? 25e3 : max <= 300e3 ? 50e3 : 100e3, ymax = Math.ceil(max * 1.08 / step) * step;
    const Y = v => MT + ph - ph * v / ymax, bw = pw / years.length;
    const svg = sv("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "每年要付的学费" });
    svg.style.fontSize = "12px";
    for (let v = 0; v <= ymax; v += step) {
      svg.append(sv("line", { x1: ML, x2: W - MR, y1: Y(v), y2: Y(v), stroke: "var(--line2)" }));
      svg.append(sv("text", { x: ML - 8, y: Y(v) + 4, "text-anchor": "end", fill: "var(--muted)", "font-size": 11 }, USDK(v)));
    }
    const imax = sums.indexOf(Math.max(...sums));
    years.forEach((y, i) => {
      const pad = Math.max(1, bw * 0.12), x0 = ML + i * bw + pad, w = bw - 2 * pad;
      let acc = 0;
      for (let k = 0; k < n; k++) {
        const it = R.years[y].find(x => x.kid === k), v = it ? it.inf : 0;
        if (v <= 0) continue;
        const top = Y(acc + v), bot = Y(acc);
        svg.append(sv("rect", { x: x0, y: top, width: w, height: Math.max(0, bot - top - (acc ? 2 : 0)), class: "k" + k, rx: acc ? 0 : 2 }));
        acc += v;
      }
      if (acc > 0) {
        const lines = R.years[y].filter(x => x.p && !x.miss).map(x => KN(x.kid) + " " + GRN(x.g) + " · " + esc(x.p.name) + " · " + USD(x.inf));
        const hit = sv("rect", { x: ML + i * bw, y: MT, width: bw, height: ph, fill: "transparent", tabindex: 0 });
        hit.setAttribute("data-tip", "<b>" + SY(y) + " 学年 · " + USD(acc) + "</b><br>" + lines.join("<br>"));
        svg.append(hit);
      }
      if (i === imax && acc > 0) svg.append(sv("text", { x: x0 + w / 2, y: Y(acc) - 6, "text-anchor": "middle", "font-weight": 600, fill: "var(--fg)" }, USD(acc)));
      const every = Math.max(1, Math.ceil(years.length * 34 / pw));
      if (i % every === 0) svg.append(sv("text", { x: x0 + w / 2, y: H - MB + 16, "text-anchor": "middle", fill: "var(--muted)", "font-size": 11 }, String(y)));
    });
    svg.append(sv("text", { x: ML, y: 14, fill: "var(--muted)", "font-size": 11.5, "font-weight": 600 }, "每年学费（美元）"));
    if (n > 1) {
      const lg = sv("g", { transform: `translate(${W - MR - n * 64 + 4}, 4)` });
      for (let k = 0; k < n; k++) { lg.append(sv("rect", { x: 64 * k, y: 0, width: 12, height: 12, class: "k" + k, rx: 2 })); lg.append(sv("text", { x: 64 * k + 17, y: 10.5, fill: "var(--muted)", "font-size": 11 }, KN(k))); }
      svg.append(lg);
    }
    return svg;
  }
  buildKids(); renderOut(); save();
})();
