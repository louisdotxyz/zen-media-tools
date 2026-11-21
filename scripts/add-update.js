// Trägt eine neue Version in <ext>/updates.json ein: node scripts/add-update.js grab 0.1.1 <xpi-url>
const fs = require("fs");
const [dir, version, link] = process.argv.slice(2);
const manifest = JSON.parse(fs.readFileSync(`${dir}/manifest.json`, "utf8"));
const id = manifest.browser_specific_settings.gecko.id;
const file = `${dir}/updates.json`;
const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : { addons: {} };
const entry = (data.addons[id] ||= { updates: [] });
entry.updates = entry.updates.filter((u) => u.version !== version);
entry.updates.push({ version, update_link: link });
fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
