#!/usr/bin/env node

const { execSync } = require("node:child_process");

const isVercel = process.env.VERCEL === "1";
const isCi = Boolean(process.env.CI);

if (isVercel || isCi) {
  console.log("Skipping prisma generate in Vercel/CI environment.");
  process.exit(0);
}

try {
  execSync("npx prisma generate", { stdio: "inherit" });
} catch (error) {
  console.error("Failed to run prisma generate.", error);
  process.exit(1);
}
