// Pin It – Bilder von jeder Seite auf Pinterest speichern
(() => {
  "use strict";
  if (window.__pinitLoaded) return;
  window.__pinitLoaded = true;
  if (/(^|\.)pinterest\./.test(location.hostname)) return; // dort gibt's den eigenen Speichern-Button

  const MIN_W = 180, MIN_H = 140;
  const INSET = 10;

  const PIN_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2h4M7 2.2v3.6L4.6 8.6h6.8L9 5.8V2.2M8 8.6V14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // ---------- UI ----------
  const host = document.createElement("pinit-ui");
  host.style.cssText = "all:initial;position:fixed;inset:0 auto auto 0;z-index:2147483647;pointer-events:none;";
  const root = host.attachShadow({ mode: "closed" });
  root.innerHTML = `
    <style>
      .glass {
        box-sizing: border-box; color: #fff;
        font: 500 12px/1 -apple-system, "SF Pro Text", system-ui, sans-serif;
        background: rgba(22,22,24,.78); border: 1px solid rgba(255,255,255,.14);
        -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
      }
      .btn {
        position: fixed; pointer-events: auto; display: none; align-items: center; gap: 6px;
        height: 30px; padding: 0 12px 0 9px; margin: 0; border-radius: 999px; cursor: pointer;
        transition: background .12s, transform .12s;
      }
      .btn.show { display: flex; }
      .btn:hover { background: rgba(40,40,44,.92); }
      .btn:active { transform: scale(.95); }
      .btn svg { width: 15px; height: 15px; }
      .toast {
        position: fixed; left: 50%; bottom: 24px; transform: translate(-50%, 8px);
        padding: 9px 14px; border-radius: 999px; opacity: 0; pointer-events: none;
        transition: opacity .15s, transform .15s;
      }
      .toast.show { opacity: 1; transform: translate(-50%, 0); }

      /* Bildauswahl (Toolbar-Button) */
      .picker {
        position: fixed; inset: 0; pointer-events: auto; display: none; flex-direction: column;
        background: rgba(10,10,10,.86); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);
        font: 500 13px/1.3 -apple-system, "SF Pro Text", system-ui, sans-serif; color: #fff;
      }
      .picker.show { display: flex; }
      .bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; }
      .bar span { opacity: .6; font-size: 12px; }
      .close { all: unset; cursor: pointer; padding: 8px 14px; border-radius: 999px; }
      .grid {
        flex: 1; overflow: auto; padding: 0 24px 24px;
        display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; align-content: start;
      }
      .tile {
        all: unset; position: relative; cursor: pointer; border-radius: 10px; overflow: hidden;
        background: #16161A; aspect-ratio: 1; display: block;
      }
      .tile img { width: 100%; height: 100%; object-fit: cover; display: block; transition: opacity .12s; }
      .tile:hover img { opacity: .7; }
      .tile .size {
        position: absolute; left: 8px; bottom: 8px; padding: 4px 8px; border-radius: 999px;
        font: 500 10px/1 "SF Mono", ui-monospace, monospace;
      }
      .tile .glass.go {
        position: absolute; top: 8px; right: 8px; display: none; align-items: center; gap: 6px;
        height: 26px; padding: 0 10px 0 8px; border-radius: 999px; font-size: 11px;
      }
      .tile:hover .go { display: flex; }
      .tile .go svg { width: 13px; height: 13px; }
      .empty { opacity: .6; padding: 40px 0; }
    </style>
    <button class="btn glass" title="Auf Pinterest speichern">${PIN_ICON}<span>Pin</span></button>
    <div class="toast glass" role="status"></div>
    <div class="picker" role="dialog" aria-label="Bild für Pinterest auswählen">
      <div class="bar"><div>Bild auf Pinterest speichern <span></span></div><button class="close glass">Schliessen</button></div>
      <div class="grid"></div>
    </div>`;
  const btn = root.querySelector(".btn");
  const toastEl = root.querySelector(".toast");
  const picker = root.querySelector(".picker");
  const grid = root.querySelector(".grid");
  (document.body || document.documentElement).appendChild(host);

  let current = null;
  let toastTimer = 0;

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2600);
  }

  // ---------- Bild-URL ----------
  function bestSrc(img) {
    let best = img.currentSrc || img.src, bestW = 0;
    for (const part of (img.getAttribute("srcset") || "").split(",")) {
      const [u, w] = part.trim().split(/\s+/);
      const n = parseFloat(w) || 0;
      if (u && n > bestW) { best = u; bestW = n; }
    }
    try { return new URL(best, location.href).href; } catch (_) { return ""; }
  }

  function pinnable(img) {
    if (!img || img.tagName !== "IMG") return false;
    const r = img.getBoundingClientRect();
    if (r.width < MIN_W || r.height < MIN_H) return false;
    if ((img.naturalWidth || 0) < 120) return false;
    return /^https?:/.test(bestSrc(img));
  }

  function describe(img) {
    return (img.alt || img.title || document.title || "").trim().slice(0, 480);
  }

  function pin(img) {
    const media = bestSrc(img);
    if (!/^https?:/.test(media)) { toast("Dieses Bild kann nicht gepinnt werden"); return; }
    browser.runtime.sendMessage({ type: "pin", media, url: location.href, description: describe(img) });
  }

  // ---------- Hover ----------
  function place() {
    if (!current) return;
    const r = current.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight || !current.isConnected) return hide();
    btn.style.top = `${Math.max(r.top, 0) + INSET}px`;
    btn.style.left = `${r.left + INSET}px`;
  }
  function show(img) { current = img; btn.classList.add("show"); place(); }
  function hide() { current = null; btn.classList.remove("show"); }

  function imageAt(x, y) {
    const stack = document.elementsFromPoint(x, y);
    if (stack[0] === host) return "keep";
    const direct = stack.find((el) => el.tagName === "IMG");
    if (direct) return pinnable(direct) ? direct : null;
    // Bild unter einem Overlay (Shops, Galerien)
    for (const el of stack.slice(0, 4)) {
      const img = el.querySelector && [...el.querySelectorAll("img")].find((i) => {
        const r = i.getBoundingClientRect();
        return pinnable(i) && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
      });
      if (img) return img;
    }
    return null;
  }

  let raf = 0, mx = 0, my = 0;
  document.addEventListener("mousemove", (e) => {
    mx = e.clientX; my = e.clientY;
    if (picker.classList.contains("show")) return;
    if (!raf) raf = requestAnimationFrame(() => {
      raf = 0;
      const img = imageAt(mx, my);
      if (img === "keep") return;
      if (!img) return hide();
      if (img !== current) show(img);
    });
  }, { passive: true, capture: true });
  addEventListener("scroll", place, { passive: true, capture: true });
  addEventListener("resize", place, { passive: true });

  for (const ev of ["pointerdown", "mousedown", "mouseup"]) {
    btn.addEventListener(ev, (e) => { e.stopPropagation(); e.preventDefault(); });
  }
  btn.addEventListener("click", (e) => {
    e.stopPropagation(); e.preventDefault();
    if (current) pin(current);
  });

  // ---------- Bildauswahl ----------
  function openPicker() {
    hide();
    const seen = new Set();
    const imgs = [...document.images].filter((img) => {
      const src = bestSrc(img);
      if (!/^https?:/.test(src) || seen.has(src)) return false;
      if ((img.naturalWidth || 0) < 200 || (img.naturalHeight || 0) < 150) return false;
      seen.add(src);
      return true;
    }).sort((a, b) => b.naturalWidth * b.naturalHeight - a.naturalWidth * a.naturalHeight);

    grid.textContent = "";
    root.querySelector(".bar span").textContent = imgs.length ? `· ${imgs.length} Bilder` : "";
    if (!imgs.length) {
      const p = document.createElement("div");
      p.className = "empty";
      p.textContent = "Keine passenden Bilder auf dieser Seite.";
      grid.append(p);
    }
    for (const img of imgs) {
      const tile = document.createElement("button");
      tile.className = "tile";
      const im = document.createElement("img");
      im.src = bestSrc(img);
      im.alt = img.alt || "";
      const size = document.createElement("span");
      size.className = "size glass";
      size.textContent = `${img.naturalWidth}×${img.naturalHeight}`;
      const go = document.createElement("span");
      go.className = "go glass";
      go.innerHTML = `${PIN_ICON}<span>Pin</span>`;
      tile.append(im, size, go);
      tile.addEventListener("click", () => { closePicker(); pin(img); });
      grid.append(tile);
    }
    picker.classList.add("show");
  }
  function closePicker() { picker.classList.remove("show"); }

  root.querySelector(".close").addEventListener("click", closePicker);
  picker.addEventListener("click", (e) => { if (e.target === picker || e.target === grid) closePicker(); });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && picker.classList.contains("show")) { e.stopPropagation(); closePicker(); }
  }, true);

  // ---------- Nachrichten vom Hintergrund ----------
  browser.runtime.onMessage.addListener((msg) => {
    if (!msg) return;
    if (msg.type === "open-picker") {
      if (picker.classList.contains("show")) closePicker(); else openPicker();
    }
    if (msg.type === "pin-context") {
      const el = msg.targetElementId != null && browser.menus && browser.menus.getTargetElement
        ? browser.menus.getTargetElement(msg.targetElementId) : null;
      if (el && el.tagName === "IMG") pin(el);
      else if (msg.srcUrl && /^https?:/.test(msg.srcUrl)) {
        browser.runtime.sendMessage({ type: "pin", media: msg.srcUrl, url: location.href, description: document.title });
      } else toast("Dieses Bild kann nicht gepinnt werden");
    }
  });
})();
