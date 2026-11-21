// Pin It – Hintergrund: Pinterest-Speicherdialog, Kontextmenü, Toolbar
"use strict";

browser.menus.removeAll().then(() => {
  browser.menus.create({ id: "pin", title: "Auf Pinterest speichern", contexts: ["image"] });
});

browser.menus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "pin" || !tab) return;
  browser.tabs.sendMessage(tab.id, {
    type: "pin-context",
    targetElementId: info.targetElementId,
    srcUrl: info.srcUrl,
  }, { frameId: info.frameId || 0 }).catch(() => {
    // Seite ohne Content-Script (z.B. direkt geöffnetes Bild)
    if (/^https?:/.test(info.srcUrl || "")) openPin({ media: info.srcUrl, url: info.pageUrl || info.srcUrl, description: tab.title || "" });
  });
});

browser.browserAction.onClicked.addListener((tab) => {
  browser.tabs.sendMessage(tab.id, { type: "open-picker" }).catch(() => {});
});

// Pinterests eigener Speicherdialog: Pinnwand wählen, Text anpassen, speichern
function openPin({ media, url, description }) {
  const u = new URL("https://www.pinterest.com/pin/create/button/");
  u.searchParams.set("url", url);
  u.searchParams.set("media", media);
  if (description) u.searchParams.set("description", description);
  return browser.windows.create({ url: u.href, type: "popup", width: 780, height: 720 });
}

browser.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === "pin") return openPin(msg).then(() => ({ ok: true }));
});
