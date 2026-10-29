(() => {
  const now = new Date();
  const today = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  const qd = new URLSearchParams(location.search).get("d");
  const st = { f: qd ? "d:" + qd : "", past: false };
  const past = document.getElementById("cal-past");
  function apply() {
    document.querySelectorAll("#cal-f .chip").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.f === st.f)));
    document.querySelectorAll("#cal .cal-m").forEach(m => {
      let n = 0;
      m.querySelectorAll(".ev").forEach(e => {
        const isPast = e.dataset.end < today;
        e.classList.toggle("past", isPast);
        const ok = (!st.f || (st.f.startsWith("k:") ? e.dataset.k === st.f.slice(2) : e.dataset.d === st.f.slice(2))) && (st.past || !isPast);
        e.hidden = !ok;
        if (ok) n++;
      });
      m.hidden = n === 0;
    });
  }
  document.querySelectorAll("#cal-f .chip").forEach(b => b.addEventListener("click", () => { st.f = st.f === b.dataset.f ? "" : b.dataset.f; apply(); }));
  if (past) past.addEventListener("change", () => { st.past = past.checked; apply(); });
  apply();
})();
