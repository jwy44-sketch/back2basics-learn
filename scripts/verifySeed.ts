/**
 * Verifies that seed files have 200+ questions combined
 * Run: tsx scripts/verifySeed.ts
 */

import * as fs from "fs";
import * as path from "path";

const MAIN_PATH = path.join(process.cwd(), "data", "questions.seed.json");
const EXTRA_PATH = path.join(process.cwd(), "data", "questions-extra.json");
const MIN_COUNT = 200;

function loadQuestions(filePath: string): unknown[] {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(content);
  return Array.isArray(data) ? data : [];
}

function main() {
  if (!fs.existsSync(MAIN_PATH)) {
    console.error(`ERROR: Seed file not found at ${MAIN_PATH}`);
    process.exit(1);
  }

  const mainQs = loadQuestions(MAIN_PATH);
  const extraQs = fs.existsSync(EXTRA_PATH) ? loadQuestions(EXTRA_PATH) : [];
  const questions = [...mainQs, ...extraQs];

  const count = questions.length;
  const valid = questions.every(
    (q: unknown) =>
      q &&
      typeof q === "object" &&
      "prompt" in q &&
      "choices" in q &&
      Array.isArray((q as { choices: unknown }).choices) &&
      (q as { choices: unknown[] }).choices.length === 4 &&
      "correctIndex" in q &&
      "explanation" in q &&
      "session" in q &&
      "topic" in q &&
      "tags" in q &&
      "farRefs" in q &&
      "difficulty" in q
  );

  if (!valid) {
    console.error("ERROR: Some questions have invalid structure");
    process.exit(1);
  }

  if (count < MIN_COUNT) {
    console.error(`ERROR: Found ${count} questions, need at least ${MIN_COUNT}`);
    process.exit(1);
  }

  console.log(`OK: Seed files have ${count} valid questions (>= ${MIN_COUNT})`);
}

main();
