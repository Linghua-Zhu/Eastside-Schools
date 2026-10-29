(() => {
  const LVN = { E: "小学", M: "初中", H: "高中", C: "选择校和项目" };
  const qs = new URLSearchParams(location.search);
  const st = {
    seg: ({ e: "E", m: "M", h: "H", c: "C" })[(qs.get("lv") || "").toLowerCase()] || "E",
    d: new Set((qs.get("d") || "").split(",").filter(Boolean)),
    sort: qs.get("sort") || "r",
    shown: { E: 30, M: 30, H: 30, C: 40 }
  };
  const sortSel = document.getElementById("psort");
  if (["r", "p", "e", "m", "s"].includes(st.sort)) sortSel.value = st.sort; else st.sort = "r";
  const keyOf = { r: ["r", 1], p: ["p", 1], e: ["e", -1], m: ["m", -1], s: ["s", -1] };

  function apply() {
    document.querySelectorAll("#pseg button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.seg === st.seg)));
    document.querySelectorAll(".pane").forEach(p => { p.hidden = p.dataset.pane !== st.seg; });
    document.querySelectorAll("#dchips .chip[data-d]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.d === "" ? st.d.size === 0 : st.d.has(b.dataset.d))));
    sortSel.disabled = st.seg === "C";
    const list = document.querySelector('.list[data-list="' + st.seg + '"]');
    const rows = Array.from(list.querySelectorAll(st.seg === "C" ? ".crow" : ".lrow"));
    const ok = r => st.d.size === 0 || st.d.has(r.dataset.d);
    let vis = rows.filter(ok);
    if (st.seg !== "C") {
      const [k, dir] = keyOf[st.sort];
      vis.sort((a, b) => {
        const va = Number(a.dataset[k]), vb = Number(b.dataset[k]);
        const na = k === "r" ? va >= 99999 : k === "p" ? va >= 9e9 : va < 0, nb = k === "r" ? vb >= 99999 : k === "p" ? vb >= 9e9 : vb < 0;
        if (na !== nb) return na ? 1 : -1;
        return dir * (va - vb) || Number(a.dataset.r) - Number(b.dataset.r);
      });
      vis.forEach(r => list.insertBefore(r, list.querySelector(".more")));
    }
    const n = st.shown[st.seg];
    rows.forEach(r => { r.hidden = true; });
    vis.forEach((r, i) => { r.hidden = i >= n; });
    const more = list.querySelector(".more");
    const rest = vis.length - Math.min(n, vis.length);
    more.hidden = rest <= 0;
    more.textContent = "再看 " + Math.min(rest, 30) + " 所" + (rest > 30 ? "（还有 " + rest + " 所）" : "");
    let empty = list.querySelector(".empty");
    if (!vis.length) { if (!empty) { empty = document.createElement("p"); empty.className = "empty"; empty.textContent = "这个学区没有这一类学校。"; list.append(empty); } }
    else if (empty) empty.remove();
    document.getElementById("pcount").textContent = vis.length + " 所" + (st.seg === "C" ? "选择校和项目" : LVN[st.seg]) + (vis.length > n ? "，先显示 " + n + " 所" : "");
    const p = new URLSearchParams();
    if (st.seg !== "E") p.set("lv", st.seg.toLowerCase());
    if (st.d.size) p.set("d", Array.from(st.d).join(","));
    if (st.sort !== "r") p.set("sort", st.sort);
    history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : ""));
  }
  document.querySelectorAll("#pseg button").forEach(b => b.addEventListener("click", () => { st.seg = b.dataset.seg; apply(); }));
  document.querySelectorAll("#dchips .chip[data-d]").forEach(b => b.addEventListener("click", () => {
    const d = b.dataset.d;
    if (!d) st.d.clear(); else if (st.d.has(d)) st.d.delete(d); else st.d.add(d);
    apply();
  }));
  sortSel.addEventListener("change", () => { st.sort = sortSel.value; apply(); });
  document.querySelectorAll(".list .more").forEach(b => b.addEventListener("click", () => { st.shown[st.seg] += 30; apply(); }));
  apply();
})();
