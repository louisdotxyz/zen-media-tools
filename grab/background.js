// Grab – Hintergrund: Are.na-API, Downloads, Kontextmenü
"use strict";

const SITES = ["*://*.pinterest.com/*", "*://*.pinterest.ch/*", "*://*.pinterest.de/*",
  "*://*.pinterest.at/*", "*://*.pinterest.co.uk/*", "*://*.pinterest.fr/*",
  "*://*.are.na/*", "*://are.na/*"];

browser.menus.removeAll().then(() => {
  browser.menus.create({
    id: "grab",
    title: "Original herunterladen",
    contexts: ["image", "video", "link", "page"],
    documentUrlPatterns: SITES,
  });
});

browser.menus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "grab" || !tab) return;
  browser.tabs.sendMessage(tab.id, {
    type: "grab-context",
    targetElementId: info.targetElementId,
  }, { frameId: info.frameId || 0 });
});

// Erste Adresse, die wirklich antwortet (z.B. MP4-Varianten bei Pinterest-Videos)
async function firstWorking(candidates) {
  if (candidates.length === 1) return candidates[0];
  for (const url of candidates) {
    try {
      const r = await fetch(url, { method: "HEAD" });
      if (r.ok) return url;
    } catch (_) { /* nächste Variante */ }
  }
  return null;
}

async function download(items) {
  const saved = [];
  let error = null;
  for (const item of items) {
    const url = await firstWorking(item.candidates || []);
    if (!url) { error = "Datei nicht erreichbar (evtl. nur als Stream verfügbar)"; continue; }
    try {
      await browser.downloads.download({ url, filename: item.name, conflictAction: "uniquify", saveAs: false });
      saved.push(item.name);
    } catch (e) {
      error = e.message || String(e);
    }
  }
  return { saved, error };
}

async function arenaBlock(id) {
  const r = await fetch(`https://api.are.na/v3/blocks/${encodeURIComponent(id)}`, {
    headers: { Accept: "application/json" },
  });
  if (!r.ok) return { items: [] };
  return { items: GrabLib.arenaMedia(await r.json()) };
}

browser.runtime.onMessage.addListener((msg) => {
  if (!msg) return;
  if (msg.type === "download") return download(msg.items || []);
  if (msg.type === "arena-block") return arenaBlock(msg.id).catch(() => ({ items: [] }));
});
