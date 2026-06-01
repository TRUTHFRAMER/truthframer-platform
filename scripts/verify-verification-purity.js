#!/usr/bin/env node
const cp = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");

if (process.env.TRUTHFRAMER_SKIP_VERIFY_PURITY === "1") {
  console.log("TRUTHFRAMER_VERIFICATION_PURITY_SKIPPED=true");
  process.exit(0);
}

function sh(cmd) {
  return cp.execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function listZ(cmd) {
  const out = cp.execSync(cmd, { encoding: "buffer", stdio: ["ignore", "pipe", "pipe"] });
  return out.toString("utf8").split("\0").filter(Boolean).sort();
}

function snapshot() {
  const tracked = listZ("git ls-files -z");
  const untracked = listZ("git ls-files --others --exclude-standard -z");

  const trackedHashes = {};
  for (const file of tracked) {
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      trackedHashes[file] = sha256File(file);
    }
  }

  const untrackedHashes = {};
  for (const file of untracked) {
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      untrackedHashes[file] = sha256File(file);
    }
  }

  return {
    status: sh("git status --porcelain=v1 --untracked-files=all"),
    trackedHashes,
    untrackedHashes
  };
}

function diffObjects(before, after, prefix) {
  const changes = [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of [...keys].sort()) {
    if (!(key in before)) changes.push(`${prefix}:ADDED:${key}`);
    else if (!(key in after)) changes.push(`${prefix}:REMOVED:${key}`);
    else if (before[key] !== after[key]) changes.push(`${prefix}:MODIFIED:${key}`);
  }
  return changes;
}

const before = snapshot();

cp.execFileSync("npm", ["run", "verify:all"], {
  stdio: "inherit",
  env: {
    ...process.env,
    TRUTHFRAMER_SKIP_VERIFY_PURITY: "1"
  }
});

const after = snapshot();

const changes = [
  ...diffObjects(before.trackedHashes, after.trackedHashes, "TRACKED"),
  ...diffObjects(before.untrackedHashes, after.untrackedHashes, "UNTRACKED")
];

if (before.status !== after.status) {
  changes.push("STATUS_CHANGED");
}

if (changes.length) {
  console.error("TRUTHFRAMER_VERIFICATION_PURITY_FAIL=VERIFY_ALL_MUTATED_REPOSITORY");
  for (const change of changes.slice(0, 80)) console.error(change);
  process.exit(1);
}

console.log("TRUTHFRAMER_VERIFICATION_PURITY_PASS=true");
console.log("VERIFY_ALL_SIDE_EFFECTS=false");
