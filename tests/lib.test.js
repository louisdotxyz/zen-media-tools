// Schlanker Test der URL-Helfer: node tests/lib.test.js
const assert = require("node:assert");
const L = require("../grab/lib.js");

assert.deepStrictEqual(L.hlsToMp4Candidates("https://v1.pinimg.com/videos/iht/hls/a6/d2/95/a6d2958c_240w.m3u8")[0],
  "https://v1.pinimg.com/videos/iht/720p/a6/d2/95/a6d2958c.mp4");

const video = L.pinMedia({ videos: { video_list: {
  V_HLSV4: { url: "https://v1.pinimg.com/videos/mc/hls/ab/cd/ef/x.m3u8", width: 1080 },
  V_720P: { url: "https://v1.pinimg.com/videos/mc/720p/ab/cd/ef/x.mp4", width: 720 } } } });
assert.strictEqual(video[0].candidates[0], "https://v1.pinimg.com/videos/mc/720p/ab/cd/ef/x.mp4");

const img = L.pinMedia({ images: { "236x": { url: "a", width: 236 }, orig: { url: "https://i.pinimg.com/originals/1/2/3.png", width: 2000 } } });
assert.strictEqual(img[0].candidates[0], "https://i.pinimg.com/originals/1/2/3.png");

const carousel = L.pinMedia({ images: { orig: { url: "x" } }, carousel_data: { carousel_slots: [
  { images: { "736x": { url: "s1", width: 736 } } }, { images: { "736x": { url: "s2", width: 736 } } }] } });
assert.strictEqual(carousel.length, 2);

assert.strictEqual(L.pinimgOriginal("https://i.pinimg.com/236x/ab/cd/ef/x.jpg"), "https://i.pinimg.com/originals/ab/cd/ef/x.jpg");
assert.strictEqual(L.arenaOriginal("https://d2w9rnfcy7mm78.cloudfront.net/123/large_foo.jpg?1"), "https://d2w9rnfcy7mm78.cloudfront.net/123/original_foo.jpg?1");
assert.strictEqual(L.arenaMedia({ type: "Attachment", attachment: { url: "u.mp4", content_type: "video/mp4", filename: "u.mp4" } })[0].kind, "video");
assert.strictEqual(L.arenaMedia({ type: "Image", image: { src: "o.jpg", filename: "o.jpg" } })[0].candidates[0], "o.jpg");
assert.strictEqual(L.arenaMedia({ type: "Embed", embed: {}, image: { src: "t.jpg" }, source: { provider: { name: "vimeo.com" } } })[0].candidates[0], "t.jpg");
const key = Buffer.from(JSON.stringify({ bucket: "arena_images", key: "27019512/original_abc.jpg", edits: {} })).toString("base64");
assert.strictEqual(L.arenaOriginal("https://images.are.na/" + key), "https://d2w9rnfcy7mm78.cloudfront.net/27019512/original_abc.jpg");
assert.strictEqual(L.pinIdFromUrl("https://ch.pinterest.com/pin/123456/"), "123456");
console.log("ok");
