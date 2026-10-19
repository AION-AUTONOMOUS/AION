(() => {
  "use strict";
  if (document.getElementById("aion-si-global-entry")) return;
  const link = document.createElement("a");
  link.id = "aion-si-global-entry";
  link.href = "/si.html";
  link.setAttribute("aria-label", "AION SI — بوابة القيادة الذكية");
  link.title = "بوابة SI للقيادة الذكية";
  link.textContent = "🧠 SI";
  Object.assign(link.style, {
    position: "fixed",
    left: "14px",
    bottom: "14px",
    zIndex: "2147483000",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    minWidth: "70px",
    padding: "11px 16px",
    borderRadius: "999px",
    border: "1px solid rgba(125,211,252,.8)",
    background: "rgba(7,20,38,.96)",
    color: "#eaf8ff",
    font: "700 14px system-ui,sans-serif",
    textDecoration: "none",
    boxShadow: "0 5px 24px rgba(0,0,0,.35)",
    backdropFilter: "blur(8px)"
  });
  link.addEventListener("mouseenter", () => { link.style.background = "#12385a"; });
  link.addEventListener("mouseleave", () => { link.style.background = "rgba(7,20,38,.96)"; });
  document.addEventListener("DOMContentLoaded", () => document.body.appendChild(link), { once: true });
  if (document.body) document.body.appendChild(link);
})();