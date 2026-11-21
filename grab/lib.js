// Reine Helfer ohne Browser-APIs – auch in Node testbar.
(function (root) {
  "use strict";

  const PIN_ID_RE = /\/pin\/([\w-]+)/;
  const BLOCK_ID_RE = /\/block\/(\d+)/;

  function pinIdFromUrl(url) {
    const m = String(url || "").match(PIN_ID_RE);
    return m ? m[1] : null;
  }

  function blockIdFromUrl(url) {
    const m = String(url || "").match(BLOCK_ID_RE);
    return m ? m[1] : null;
  }

  // HLS-Stream (.m3u8) -> mögliche direkte MP4-Adressen auf v1.pinimg.com
  function hlsToMp4Candidates(url) {
    if (!/\.m3u8(\?|$)/.test(url)) return [url];
    const base = url.replace(/\?.*$/, "");
    const hash = base.replace(/(_\d+w)?\.m3u8$/, "");
    return [
      hash.replace("/hls/", "/720p/") + ".mp4",
      hash.replace("/hls/", "/expMp4/") + "_720w.mp4",
      hash.replace("/hls/", "/expMp4/") + "_480w.mp4",
    ];
  }

  // Bestes Video aus Pinterests video_list: grösstes MP4, sonst aus HLS abgeleitet
  function bestVideo(list) {
    const entries = Object.values(list || {}).filter((v) => v && v.url);
    if (!entries.length) return null;
    const mp4 = entries
      .filter((v) => /\.mp4(\?|$)/.test(v.url))
      .sort((a, b) => (b.width || 0) - (a.width || 0));
    if (mp4.length) return { kind: "video", candidates: mp4.map((v) => v.url) };
    const hls = entries.sort((a, b) => (b.width || 0) - (a.width || 0))[0];
    return { kind: "video", candidates: hlsToMp4Candidates(hls.url) };
  }

  // Bestes Bild aus Pinterests images-Objekt: Original, sonst grösstes
  function bestImage(images) {
    if (!images) return null;
    const orig = images.orig || images.originals;
    if (orig && orig.url) return { kind: "image", candidates: [orig.url] };
    const all = Object.values(images)
      .filter((v) => v && v.url)
      .sort((a, b) => (b.width || 0) - (a.width || 0));
    return all.length ? { kind: "image", candidates: [all[0].url] } : null;
  }

  // Alle Medien eines Pins (Video, Idea-/Story-Pin-Seiten, Karussell, Bild)
  function pinMedia(pin) {
    const out = [];
    const push = (m) => m && out.push(m);
    if (!pin) return out;

    push(bestVideo(pin.videos && pin.videos.video_list));

    const pages = (pin.story_pin_data && pin.story_pin_data.pages) || [];
    for (const page of pages) {
      for (const b of page.blocks || []) {
        if (b.video && b.video.video_list) push(bestVideo(b.video.video_list));
        else if (b.image && b.image.images) push(bestImage(b.image.images));
      }
    }

    const slots = (pin.carousel_data && pin.carousel_data.carousel_slots) || [];
    for (const s of slots) push(bestImage(s.images));

    if (!out.length) push(bestImage(pin.images));
    return out;
  }

  // i.pinimg.com/236x/... -> /originals/
  function pinimgOriginal(src) {
    if (!/pinimg\.com\//.test(src || "")) return null;
    return src.replace(/\/\d+x(\d+)?(_[A-Z]+)?\//, "/originals/");
  }

  // Are.na v3 Block -> Download
  function arenaMedia(block) {
    if (!block) return [];
    if (block.type === "Attachment" && block.attachment && block.attachment.url) {
      return [{
        kind: /^video\//.test(block.attachment.content_type || "") ? "video" : "file",
        candidates: [block.attachment.url],
        name: block.attachment.filename,
      }];
    }
    if (block.type === "Embed") return [{ kind: "embed", candidates: [], source: block.embed && (block.embed.source_url || block.embed.url) }];
    if (block.image && block.image.src) {
      return [{ kind: "image", candidates: [block.image.src], name: block.image.filename }];
    }
    return [];
  }

  // Are.na-CDN: large_/display_/thumb_ -> original_
  function arenaOriginal(src) {
    if (!/(cloudfront\.net|are\.na)\//.test(src || "")) return null;
    const out = src.replace(/\/(thumb|display|large|medium|small|square)_/, "/original_");
    return out === src ? null : out;
  }

  function extFromUrl(url, kind) {
    const m = String(url).replace(/[?#].*$/, "").match(/\.([a-z0-9]{2,5})$/i);
    if (m) return m[1].toLowerCase();
    return kind === "video" ? "mp4" : "jpg";
  }

  function safeName(name) {
    return String(name || "")
      .replace(/[\/\\:*?"<>|\u0000-\u001f]+/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120);
  }

  const api = {
    pinIdFromUrl, blockIdFromUrl, hlsToMp4Candidates, bestVideo, bestImage,
    pinMedia, pinimgOriginal, arenaMedia, arenaOriginal, extFromUrl, safeName,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.GrabLib = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
