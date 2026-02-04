const { spawnSync } = require("child_process");

const isVercel = process.env.VERCEL === "1";
const isCi = Boolean(process.env.CI);

if (isVercel || isCi) {
  console.log("Skipping prisma generate on Vercel/CI");
  process.exit(0);
}

const result = spawnSync("npx prisma generate", {
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 0);
