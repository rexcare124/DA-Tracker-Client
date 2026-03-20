#!/usr/bin/env node

// Suppress baseline-browser-mapping warnings by filtering build output
const { spawn } = require("child_process");

// Set environment variables
process.env.BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA = "true";
process.env.BROWSERSLIST_IGNORE_OLD_DATA = "true";

// Prisma client is generated at repo root (npm run build:prisma) before any workspace build,
// so no workspace has loaded the client and locked the DLL (avoids Windows EPERM on rename).

// Intercept console.warn globally before spawning
const originalWarn = console.warn;
console.warn = (...args) => {
  const message = String(args[0] || "");
  if (
    message.includes("baseline-browser-mapping") &&
    message.includes("over two months old")
  ) {
    return; // Suppress the warning
  }
  originalWarn.apply(console, args);
};

// Filter function for output streams
function filterBaselineWarnings(data) {
  const lines = data.toString().split("\n");
  const filtered = lines.filter(
    (line) =>
      !(
        line.includes("baseline-browser-mapping") &&
        line.includes("over two months old")
      )
  );
  return filtered.join("\n");
}

// Spawn the Next.js build process with filtered output
const buildProcess = spawn("next", ["build"], {
  shell: true,
  env: {
    ...process.env,
    BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA: "true",
    BROWSERSLIST_IGNORE_OLD_DATA: "true",
  },
});

// Filter stdout
buildProcess.stdout?.on("data", (data) => {
  const filtered = filterBaselineWarnings(data);
  if (filtered.trim()) {
    process.stdout.write(filtered);
  }
});

// Filter stderr
buildProcess.stderr?.on("data", (data) => {
  const filtered = filterBaselineWarnings(data);
  if (filtered.trim()) {
    process.stderr.write(filtered);
  }
});

buildProcess.on("close", (code) => {
  process.exit(code || 0);
});

buildProcess.on("error", (error) => {
  console.error("Build process error:", error);
  process.exit(1);
});

