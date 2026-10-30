(() => {
  const P = window.PAGE.P, E = window.PAGE.E, S = window.PAGE.S, esc = window.esc, url = window.siteURL;
  const box = document.getElementById("pmap"), detail = document.getElementById("pm-detail");
  const svg = box.querySelector("svg"), VB = svg.viewBox.baseVal;
  const st = { r: 3, active: null, all: false };
  const saved = Number(window.store.get("gssc-radius"));
  if ([2, 3, 5].includes(saved)) st.r = saved;
  const SHOW = 10;
  const miles = (a, b) => {
    const R = 3958.8, t = Math.PI / 180;
    const h = Math.sin((b[0] - a[0]) * t / 2) ** 2 + Math.cos(a[0] * t) * Math.cos(b[0] * t) * Math.sin((b[1] - a[1]) * t / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };
  const near = i => E.map(e => ({ e, mi: miles([P[i].lat, P[i].lon], e) })).filter(x => x.mi <= st.r).sort((a, b) => a.mi - b.mi);
  const pnum = p => '<span class="pnum" style="--pc:' + p.color + '">' + p.no + "</span>";
  function counts() {
    document.querySelectorAll("#pm-legend button").forEach(b => {
      const i = Number(b.dataset.i), n = near(i).length;
      b.querySelector(".n").textContent = n + " 所";
      b.title = P[i].name + " · " + P[i].city + " · " + st.r + " 英里内 " + n + " 所公立小学";
    });
  }
  // zoomed copy of the map around the chosen school, shown on narrow screens
  function miniMap() {
    const dot = box.querySelector('.pvs .pv[data-i="' + st.active + '"] .dot');
    if (!dot) return;
    const cx = Number(dot.getAttribute("cx")), cy = Number(dot.getAttribute("cy"));
    const side = Math.min(VB.width, VB.height, 2 * (st.r + 0.6) * S);
    const x = Math.max(0, Math.min(VB.width - side, cx - side / 2)), y = Math.max(0, Math.min(VB.height - side, cy - side / 2));
    const wrap = document.createElement("div");
    wrap.className = "map pmap pmini has-active";
    const c = svg.cloneNode(true);
    c.setAttribute("viewBox", x.toFixed(1) + " " + y.toFixed(1) + " " + side.toFixed(1) + " " + side.toFixed(1));
    c.setAttribute("aria-hidden", "true");
    c.querySelectorAll("[tabindex]").forEach(el => el.setAttribute("tabindex", "-1"));
    c.querySelectorAll("a").forEach(el => el.setAttribute("tabindex", "-1"));
    wrap.appendChild(c);
    return wrap;
  }
  function fitMini() {
    const m = detail.querySelector(".pmini svg");
    if (!m || !m.clientWidth) return;
    const ks = Math.max(1, m.clientWidth / m.viewBox.baseVal.width);
    m.style.setProperty("--ks", ks.toFixed(3));
    m.querySelectorAll(".pvs .dot").forEach(d => d.setAttribute("r", (9 / ks).toFixed(2)));
    m.querySelectorAll(".pub circle").forEach(d => d.setAttribute("r", (3.6 / ks).toFixed(2)));
  }
  // fade the bottom of the school list while more of it is below
  const legend = document.getElementById("pm-legend");
  const fade = () => legend.classList.toggle("fade", legend.scrollHeight - legend.clientHeight - legend.scrollTop > 4);
  legend.addEventListener("scroll", fade, { passive: true });
  function renderDetail() {
    if (st.active === null) { detail.innerHTML = '<span class="mut">点一所私校，这里显示它的学费、考试、截止日期和圆圈里的公立小学。</span>'; return; }
    const p = P[st.active], list = near(st.active);
    const row = (k, v) => v ? '<div><span class="k">' + k + "</span>" + esc(v) + "</div>" : "";
    let h = "<h3>" + pnum(p) + esc(p.name) + "</h3>" + '<div class="mut">' + esc(p.grades) + (p.address ? " · " + esc(p.address) : "") + "</div>";
    let tnote = p.tyear || "";
    if (tnote === "2026-27") tnote = "";
    else if (tnote.startsWith("2026-27（") && tnote.endsWith("）")) tnote = tnote.slice(8, -1);
    const tu = p.tuition ? p.tuition + (tnote ? "；" + tnote : "") : tnote;
    h += row("学费", tu) + row("入学考试", p.test) + row("申请截止", p.deadline) + row("类型", p.type) + row("外语", p.langs) + row("特点", p.focus);
    h += '<div class="pmini-slot"></div>';
    h += "<div>" + st.r + " 英里内的公立小学" + (list.length ? "（" + list.length + " 所）" : "：没有") + "</div>";
    const shown = st.all ? list : list.slice(0, SHOW);
    if (list.length) h += "<ul>" + shown.map(x => '<li><a href="' + url(x.e[6]) + '">' + esc(x.e[2]) + "</a> <span>" + x.mi.toFixed(1) + " 英里 · " + x.e[3] + (x.e[4] != null ? " · #" + x.e[4] : "") + (x.e[7] ? " · 选择校" : "") + "</span></li>").join("") + "</ul>";
    if (list.length > SHOW) h += '<button type="button" class="more" id="pm-all">' + (st.all ? "只看最近的 " + SHOW + " 所" : "显示全部 " + list.length + " 所") + "</button>";
    h += '<div class="acts"><a class="btn" href="' + url("private/" + p.slug) + '">看这所学校</a>' + (p.web ? '<a class="btn btn2" href="' + esc(p.web) + '" target="_blank" rel="noopener">学校官网</a>' : "") +
      (p.gs ? '<a class="btn btn2" href="https://www.greatschools.org/washington/' + esc(p.gs) + '/" target="_blank" rel="noopener">GreatSchools</a>' : "") + "</div>";
    detail.innerHTML = h;
    const slot = detail.querySelector(".pmini-slot"), m = miniMap();
    if (m) slot.replaceWith(m);
    fitMini();
    const more = document.getElementById("pm-all");
    if (more) more.addEventListener("click", () => { st.all = !st.all; renderDetail(); });
    fade();
  }
  function setActive(i, keepHash) {
    st.active = st.active === i ? null : i;
    st.all = false;
    box.classList.toggle("has-active", st.active !== null);
    box.querySelectorAll(".pv").forEach(g => g.classList.toggle("on", Number(g.dataset.i) === st.active));
    document.querySelectorAll("#pm-legend button").forEach(b => b.setAttribute("aria-pressed", String(Number(b.dataset.i) === st.active)));
    renderDetail();
    if (!keepHash) history.replaceState(null, "", location.pathname + location.search + (st.active === null ? "" : "#" + P[st.active].slug));
    if (st.active !== null && window.innerWidth <= 1000 && !keepHash) detail.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function applyRadius() {
    box.querySelectorAll(".ring").forEach(c => c.setAttribute("r", (st.r * S).toFixed(1)));
    document.querySelectorAll("#pm-r button").forEach(b => b.setAttribute("aria-pressed", String(Number(b.dataset.r) === st.r)));
    counts(); renderDetail();
  }
  box.querySelectorAll(".pvs .pv").forEach(g => {
    const i = Number(g.dataset.i), dot = g.querySelector(".dot");
    dot.addEventListener("click", () => { window.hideTip(); setActive(i); });
    dot.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActive(i); } });
  });
  document.querySelectorAll("#pm-legend button").forEach(b => b.addEventListener("click", () => setActive(Number(b.dataset.i))));
  document.querySelectorAll("#pm-r button").forEach(b => b.addEventListener("click", () => { st.r = Number(b.dataset.r); window.store.set("gssc-radius", String(st.r)); applyRadius(); }));
  const pub = document.getElementById("pm-pub");
  const syncPub = () => { box.classList.toggle("nopub", !pub.checked); detail.classList.toggle("nopub", !pub.checked); };
  pub.addEventListener("change", syncPub);
  const zh = document.getElementById("pm-zh");
  const syncZh = () => {
    const on = zh.checked;
    box.querySelectorAll(".pv").forEach(g => g.classList.toggle("off", on && !P[Number(g.dataset.i)].zh));
    document.querySelectorAll("#pm-legend button").forEach(b => { b.parentElement.hidden = on && !P[Number(b.dataset.i)].zh; });
    document.querySelectorAll("#pm-legend .grp").forEach(g => {
      let n = g.nextElementSibling, any = false;
      while (n && !n.classList.contains("grp")) { if (!n.hidden) any = true; n = n.nextElementSibling; }
      g.hidden = !any;
    });
    fade();
  };
  zh.addEventListener("change", syncZh);
  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { fitMini(); fade(); }, 150); });
  applyRadius();
  syncPub();
  const h = decodeURIComponent(location.hash.slice(1));
  const hi = P.findIndex(p => p.slug === h);
  if (hi >= 0) setActive(hi, true);
})();
