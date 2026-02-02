const fs = require("fs");
const path = require("path");

const main = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/questions.seed.json"), "utf-8"));
const extraPath = path.join(__dirname, "../data/questions-extra.json");
let extra = [];
if (fs.existsSync(extraPath)) {
  extra = JSON.parse(fs.readFileSync(extraPath, "utf-8"));
}
const seen = new Set();
const unique = [];
for (const q of [...main, ...extra]) {
  const key = (q.prompt || "").slice(0, 100);
  if (seen.has(key)) continue;
  seen.add(key);
  unique.push(q);
}
const withIds = unique
  .map((q, i) => ({
    id: "q_" + i,
    ...q,
    choices: Array.isArray(q.choices) ? q.choices : [],
  }))
  .filter((q) => q.choices.length === 4);

const publicDir = path.join(__dirname, "../public");
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, "questions.json"), JSON.stringify(withIds));
console.log("Created questions.json with", withIds.length, "questions");
