#!/usr/bin/env node
const cp = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");

const VERSION = "v1.0.2";

const REQUIRED_PACK_FILES = new Set([
  "LICENSE.md",
  "NOTICE.md",
  "README.md",
  "package.json"
]);

function fail(msg) {
  console.error(`TRUTHFRAMER_DISTRIBUTION_EGRESS_FIREWALL_FAIL=${msg}`);
  process.exit(1);
}

function sh(cmd) {
  return cp.execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function sha256Text(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

if (pkg.private !== true) fail("PACKAGE_PRIVATE_NOT_TRUE");
if (pkg.license !== "UNLICENSED") fail("PACKAGE_LICENSE_NOT_UNLICENSED");

const trackedFiles = sh("git ls-files").split("\n").filter(Boolean).sort();

const forbiddenTracked = trackedFiles.filter((f) =>
  /(^|\/)(\.env|\.env\..+|node_modules|dist|build|coverage|\.DS_Store|npm-debug\.log|\.turbo|\.next|\.vercel)(\/|$)/.test(f) ||
  /\.(pem|key|p12|pfx|mobileprovision|keystore|jks|sqlite|db|dump|bak|tmp|log)$/i.test(f)
);

if (forbiddenTracked.length) {
  fail(`FORBIDDEN_TRACKED_FILES:${forbiddenTracked.join(",")}`);
}

let packJson;
try {
  packJson = JSON.parse(sh("npm pack --dry-run --json"));
} catch (e) {
  fail(`NPM_PACK_DRY_RUN_FAILED:${e.message}`);
}

const packFiles = (packJson[0]?.files || [])
  .map((x) => ({ path: x.path, size: x.size }))
  .sort((a, b) => a.path.localeCompare(b.path));

const packPaths = packFiles.map((x) => x.path).sort();

const missingRequired = [...REQUIRED_PACK_FILES].filter((p) => !packPaths.includes(p));
if (missingRequired.length) {
  fail(`NPM_PACK_REQUIRED_FILE_MISSING:${missingRequired.join(",")}`);
}

const unexpectedPackFiles = packPaths.filter((p) => !REQUIRED_PACK_FILES.has(p));
if (unexpectedPackFiles.length) {
  fail(`NPM_PACK_UNEXPECTED_EGRESS:${unexpectedPackFiles.join(",")}`);
}

const packFilesSha = sha256Text(JSON.stringify(packFiles));
const packPathAllowlistSha = sha256Text(JSON.stringify(packPaths));

console.log("TRUTHFRAMER_DISTRIBUTION_EGRESS_FIREWALL_PASS=true");
console.log(`REPORT_VERSION=${VERSION}`);
console.log(`TRACKED_FILE_COUNT=${trackedFiles.length}`);
console.log(`NPM_PACK_FILE_COUNT=${packFiles.length}`);
console.log(`PACK_FILES_SHA256=${packFilesSha}`);
console.log(`PACK_PATH_ALLOWLIST_SHA256=${packPathAllowlistSha}`);
console.log("PACK_EGRESS_POLICY=ALLOWLIST_ONLY");
