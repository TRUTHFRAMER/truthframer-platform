#!/usr/bin/env node
const fs = require("node:fs");
const crypto = require("node:crypto");
const cp = require("node:child_process");

const VERSION = "v1.0.2";

function fail(msg) {
  console.error(`TRUTHFRAMER_DISTRIBUTION_EGRESS_FAIL=${msg}`);
  process.exit(1);
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function mustExist(file) {
  if (!fs.existsSync(file)) fail(`MISSING_FILE:${file}`);
}

for (const file of ["package.json", ".gitignore", ".npmignore", ".dockerignore", "LICENSE.md", "NOTICE.md", "PRIVACY.md", "SECURITY.md"]) {
  mustExist(file);
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (pkg.private !== true) fail("PACKAGE_PRIVATE_NOT_TRUE");
if (pkg.license !== "UNLICENSED") fail("PACKAGE_LICENSE_NOT_UNLICENSED");

const requiredIgnoreFragments = [
  ".env",
  "*.pem",
  "*.key",
  "secrets/",
  "credentials/",
  ".npmrc",
  "*.log",
  ".DS_Store"
];

for (const file of [".gitignore", ".npmignore", ".dockerignore"]) {
  const text = fs.readFileSync(file, "utf8");
  for (const fragment of requiredIgnoreFragments) {
    if (!text.includes(fragment)) fail(`IGNORE_MISSING:${file}:${fragment}`);
  }
}

const denyPatterns = [
  /(^|\/)\.env($|[.\-/])/i,
  /\.pem$/i,
  /\.key$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /(^|\/)id_rsa($|[.\-/])/i,
  /(^|\/)secrets?($|\/|\.)/i,
  /(^|\/)credentials?($|\/|\.)/i,
  /(^|\/)\.npmrc$/i,
  /(^|\/)\.pypirc$/i,
  /(^|\/)\.netrc$/i,
  /service[-_]?account.*\.json$/i
];

const tracked = cp.execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

for (const file of tracked) {
  for (const pattern of denyPatterns) {
    if (pattern.test(file)) fail(`TRACKED_FORBIDDEN_PATH:${file}`);
  }
}

let packOutput;
try {
  packOutput = cp.execFileSync("npm", ["pack", "--dry-run", "--json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
} catch (err) {
  fail(`NPM_PACK_DRY_RUN_FAILED:${err.message}`);
}

const jsonStart = packOutput.indexOf("[");
if (jsonStart < 0) fail("NPM_PACK_JSON_NOT_FOUND");
const pack = JSON.parse(packOutput.slice(jsonStart));
if (!Array.isArray(pack) || !pack[0] || !Array.isArray(pack[0].files)) {
  fail("NPM_PACK_BAD_SHAPE");
}

const packFiles = pack[0].files.map((f) => f.path);
for (const file of packFiles) {
  for (const pattern of denyPatterns) {
    if (pattern.test(file)) fail(`PACK_FORBIDDEN_PATH:${file}`);
  }
}

const report = {
  report_version: VERSION,
  status: "DISTRIBUTION_EGRESS_FIREWALL_PASS",
  package_name: pkg.name || null,
  package_private: pkg.private,
  package_license: pkg.license,
  tracked_file_count: tracked.length,
  npm_pack_file_count: packFiles.length,
  ignore_files: [".gitignore", ".npmignore", ".dockerignore"].map((file) => ({
    path: file,
    sha256: sha256File(file),
    bytes: fs.statSync(file).size
  })),
  pack_files_sha256: crypto.createHash("sha256").update(packFiles.sort().join("\n")).digest("hex"),
  deny_policy: [
    "env files",
    "private keys",
    "package credentials",
    "service-account JSON",
    "secrets directories",
    "credentials directories"
  ]
};

fs.mkdirSync("reports/current", { recursive: true });
fs.writeFileSync(`reports/current/distribution-egress-${VERSION}.json`, JSON.stringify(report, null, 2) + "\n");

console.log("TRUTHFRAMER_DISTRIBUTION_EGRESS_FIREWALL_PASS=true");
console.log(`REPORT_VERSION=${VERSION}`);
console.log(`TRACKED_FILE_COUNT=${tracked.length}`);
console.log(`NPM_PACK_FILE_COUNT=${packFiles.length}`);
console.log(`PACK_FILES_SHA256=${report.pack_files_sha256}`);
