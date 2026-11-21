// Grab – Hover-Button auf Pinterest und Are.na
(() => {
  "use strict";
  if (window.__grabLoaded) return;
  window.__grabLoaded = true;

  const L = globalThis.GrabLib;
  const SITE = /(^|\.)pinterest\./.test(location.hostname) ? "pinterest"
    : /(^|\.)are\.na$/.test(location.hostname) ? "arena" : null;
  if (!SITE) return;

  const MIN = 90;            // Mindestgrösse (px) für Bilder/Videos
  const INSET = 10;          // Abstand des Buttons zur Bildecke
  // Pinterest: oben rechts sitzt der rote Speichern-Button -> unten links
  const CORNER = SITE === "pinterest" ? "bottom-left" : "top-right";

  const ICON = {
    dl: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v8m0 0L4.5 6.5M8 10l3.5-3.5M3 13h10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    ok: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    err: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7m0-7l-7 7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    busy: '<svg viewBox="0 0 16 16" aria-hidden="true" class="spin"><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width="1.6"/><path d="M8 2.5a5.5 5.5 0 0 1 5.5 5.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  };

  // ---------- UI (Shadow DOM, damit die Seite nichts überschreibt) ----------
  const host = document.createElement("grab-ui");
  host.style.cssText = "all:initial;position:fixed;inset:0 auto auto 0;z-index:2147483647;pointer-events:none;";
  const root = host.attachShadow({ mode: "closed" });
  root.innerHTML = `
    <style>
      :host { all: initial; }
      .btn, .toast {
        position: fixed; pointer-events: auto; box-sizing: border-box;
        font: 500 12px/1 -apple-system, "SF Pro Text", system-ui, sans-serif;
        color: #fff; background: rgba(22,22,24,.78);
        border: 1px solid rgba(255,255,255,.14);
        -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
      }
      .btn {
        width: 32px; height: 32px; border-radius: 999px; padding: 0; margin: 0;
        display: none; align-items: center; justify-content: center; cursor: pointer;
        transition: background .12s, transform .12s;
      }
      .btn.show { display: flex; }
      .btn:hover { background: rgba(40,40,44,.92); }
      .btn:active { transform: scale(.94); }
      .btn svg { width: 16px; height: 16px; }
      .spin { animation: spin .8s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      .toast {
        left: 50%; bottom: 24px; transform: translate(-50%, 8px);
        padding: 9px 14px; border-radius: 999px; max-width: 70vw;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        opacity: 0; transition: opacity .15s, transform .15s; pointer-events: none;
      }
      .toast.show { opacity: 1; transform: translate(-50%, 0); }
    </style>
    <button class="btn" title="Original herunterladen">${ICON.dl}</button>
    <div class="toast" role="status"></div>`;
  const btn = root.querySelector(".btn");
  const toastEl = root.querySelector(".toast");
  (document.body || document.documentElement).appendChild(host);

  let current = null;   // { media: Element }
  let busy = false;
  let toastTimer = 0;

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2600);
  }

  function setIcon(name) { btn.innerHTML = ICON[name]; }

  function place() {
    if (!current) return;
    const r = current.media.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight || r.width < MIN) return hide();
    const top = CORNER.startsWith("top") ? Math.max(r.top, 0) + INSET : Math.min(r.bottom, innerHeight) - 32 - INSET;
    const left = CORNER.endsWith("left") ? r.left + INSET : r.right - 32 - INSET;
    btn.style.top = `${top}px`;
    btn.style.left = `${left}px`;
  }

  function show(media) {
    current = { media };
    if (!busy) setIcon("dl");
    btn.classList.add("show");
    place();
  }

  function hide() {
    if (busy) return;
    current = null;
    btn.classList.remove("show");
  }

  const isMedia = (el) =>
    (el.tagName === "IMG" || el.tagName === "VIDEO") && (() => {
      const r = el.getBoundingClientRect();
      return r.width >= MIN && r.height >= MIN;
    })();

  // Medium unter dem Zeiger finden (auch unter Overlays)
  function mediaAt(x, y) {
    const stack = document.elementsFromPoint(x, y);
    if (stack[0] === host) return "keep";
    const direct = stack.find(isMedia);
    if (direct) return direct;
    // Pinterest/Are.na legen Overlays über das Bild -> im Karten-Container suchen
    for (const el of stack.slice(0, 6)) {
      const card = el.closest('[data-grid-item], [data-test-id="pin"], a[href*="/pin/"], a[href*="/block/"]');
      const m = card && [...card.querySelectorAll("video, img")].find(isMedia);
      if (m) return m;
    }
    return null;
  }

  let raf = 0, mx = 0, my = 0;
  document.addEventListener("mousemove", (e) => {
    mx = e.clientX; my = e.clientY;
    if (!raf) raf = requestAnimationFrame(() => {
      raf = 0;
      const m = mediaAt(mx, my);
      if (m === "keep") return;
      if (!m) return hide();
      if (!current || current.media !== m) show(m);
    });
  }, { passive: true, capture: true });
  addEventListener("scroll", () => place(), { passive: true, capture: true });
  addEventListener("resize", () => place(), { passive: true });

  // ---------- Medien auflösen ----------
  const pageFetch = (globalThis.content && content.fetch) ? content.fetch.bind(content) : fetch;

  function ownerId(media, re) {
    const a = media.closest('a[href]');
    const fromLink = a && String(a.href).match(re);
    if (fromLink) return fromLink[1];
    // Karte ohne Link um das Bild herum (z.B. Pinterest-Grid)
    const card = media.closest("[data-grid-item], [data-test-id=\"pin\"]");
    const cardLink = card && [...card.querySelectorAll("a[href]")].map((x) => String(x.href).match(re)).find(Boolean);
    if (cardLink) return cardLink[1];
    const fromPage = location.pathname.match(re);
    return fromPage ? fromPage[1] : null;
  }

  function largestSrc(img) {
    if (img.tagName === "VIDEO") return img.currentSrc || img.src || "";
    const set = (img.getAttribute("srcset") || "").split(",").map((s) => s.trim().split(/\s+/));
    let best = img.currentSrc || img.src, bestW = 0;
    for (const [u, w] of set) {
      const n = parseFloat(w) || 0;
      if (u && n > bestW) { best = u; bestW = n; }
    }
    return new URL(best, location.href).href;
  }

  function domFallback(media, prefix) {
    const src = largestSrc(media);
    if (!src || /^(blob|data):/.test(src)) {
      // Video als Blob-Stream -> Poster/Vorschaubild ist das Einzige, was bleibt
      return [];
    }
    const orig = SITE === "pinterest" ? L.pinimgOriginal(src) : L.arenaOriginal(src);
    const kind = media.tagName === "VIDEO" ? "video" : "image";
    return [{ kind, candidates: [orig, src].filter(Boolean), name: `${prefix}.${L.extFromUrl(src, kind)}` }];
  }

  async function resolvePinterest(media) {
    const id = ownerId(media, /\/pin\/([\w-]+)/);
    if (id) {
      try {
        const data = JSON.stringify({ options: { id, field_set_key: "detailed" }, context: {} });
        const url = `${location.origin}/resource/PinResource/get/?source_url=${encodeURIComponent(`/pin/${id}/`)}&data=${encodeURIComponent(data)}&_=${Date.now()}`;
        const res = await pageFetch(url, {
          credentials: "include",
          headers: {
            Accept: "application/json, text/javascript, */*; q=0.01",
            "X-Requested-With": "XMLHttpRequest",
            "X-Pinterest-PWS-Handler": "www/pin/[id].js",
            "X-Pinterest-Source-Url": `/pin/${id}/`,
          },
        });
        const json = await res.json();
        const items = L.pinMedia(json && json.resource_response && json.resource_response.data);
        if (items.length) {
          return items.map((m, i) => ({
            ...m,
            name: `pinterest-${id}${items.length > 1 ? `-${i + 1}` : ""}.${L.extFromUrl(m.candidates[0], m.kind)}`,
          }));
        }
      } catch (e) {
        console.debug("[Grab] Pin-Daten nicht lesbar, nehme Bild von der Seite", e);
      }
    }
    return domFallback(media, `pinterest-${id || Date.now()}`);
  }

  async function resolveArena(media) {
    const id = ownerId(media, /\/block\/(\d+)/);
    if (id) {
      const res = await browser.runtime.sendMessage({ type: "arena-block", id });
      if (res && res.items && res.items.length) {
        return res.items.map((m) => ({
          ...m,
          name: L.safeName(m.name) || `arena-${id}.${L.extFromUrl(m.candidates[0] || "", m.kind)}`,
        }));
      }
    }
    return domFallback(media, `arena-${id || Date.now()}`);
  }

  async function grab(media) {
    if (busy || !media) return;
    busy = true;
    setIcon("busy");
    try {
      const items = SITE === "pinterest" ? await resolvePinterest(media) : await resolveArena(media);
      const embed = items.find((i) => i.kind === "embed");
      if (embed) throw new Error("Eingebettetes Video (YouTube, Vimeo …) – kann nicht direkt geladen werden");
      if (!items.length) throw new Error("Kein Bild oder Video gefunden");
      const res = await browser.runtime.sendMessage({ type: "download", items });
      if (!res || !res.saved.length) throw new Error((res && res.error) || "Download fehlgeschlagen");
      setIcon("ok");
      toast(res.saved.length > 1 ? `${res.saved.length} Dateien gespeichert` : `Gespeichert: ${res.saved[0]}`);
    } catch (e) {
      setIcon("err");
      toast(e.message || String(e));
    } finally {
      setTimeout(() => { busy = false; if (current) setIcon("dl"); else hide(); }, 1200);
    }
  }

  // Klick darf nicht zur Seite durchrutschen (sonst öffnet Pinterest den Pin)
  for (const ev of ["pointerdown", "mousedown", "mouseup"]) {
    btn.addEventListener(ev, (e) => { e.stopPropagation(); e.preventDefault(); });
  }
  btn.addEventListener("click", (e) => {
    e.stopPropagation(); e.preventDefault();
    if (current) grab(current.media);
  });

  // ---------- Kontextmenü ----------
  browser.runtime.onMessage.addListener((msg) => {
    if (!msg || msg.type !== "grab-context") return;
    let el = msg.targetElementId != null && browser.menus && browser.menus.getTargetElement
      ? browser.menus.getTargetElement(msg.targetElementId) : null;
    let media = el && (isMedia(el) ? el : null);
    if (!media && el) {
      const card = el.closest('[data-grid-item], [data-test-id="pin"], a[href*="/pin/"], a[href*="/block/"]') || el;
      media = [...card.querySelectorAll("video, img")].find(isMedia);
    }
    if (!media && current) media = current.media;
    if (!media) {
      // Auf einer Pin-/Block-Seite: grösstes Medium nehmen
      media = [...document.querySelectorAll("video, img")].filter(isMedia)
        .sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight)[0];
    }
    if (media) { show(media); grab(media); } else toast("Kein Bild oder Video gefunden");
  });
})();
