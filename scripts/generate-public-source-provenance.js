#!/usr/bin/env node
const fs = require("node:fs");
const crypto = require("node:crypto");
const cp = require("node:child_process");

const VERSION = "v1.0.3";
const BASE_RELEASE = "v1.0.2";
const CERT = "PUBLIC_SOURCE_PROVENANCE_CERTIFICATE";
const SEAL = "PUBLIC_SOURCE_PROVENANCE_CERTIFICATE_SEAL";

function sh(cmd) {
  return cp.execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function sha256Text(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function sha256File(file) {
  return sha256Text(read(file));
}

function jsonWrite(file, obj) {
  fs.mkdirSync(require("node:path").dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n");
}

const requiredFiles = [
  "LICENSE.md",
  "NOTICE.md",
  "PRIVACY.md",
  "SECURITY.md",
  "CONTRIBUTING.md",
  ".gitignore",
  ".npmignore",
  ".dockerignore",
  "package.json",
  "docs/verification/PUBLIC_ROOT_FINALITY_CERTIFICATE.json",
  "docs/verification/PUBLIC_LEGAL_PRIVACY_PERIMETER_CERTIFICATE.json",
  "docs/verification/PUBLIC_DISTRIBUTION_EGRESS_FIREWALL_CERTIFICATE.json",
  "docs/verification/PUBLIC_DISTRIBUTION_EGRESS_FIREWALL_CERTIFICATE_SEAL.json",
  "releases/v1.0.2/RELEASE_LEDGER.json"
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`TRUTHFRAMER_PUBLIC_SOURCE_PROVENANCE_FAIL=MISSING_REQUIRED_FILE:${file}`);
    process.exit(1);
  }
}

const pkg = JSON.parse(read("package.json"));
if (pkg.private !== true) throw new Error("package.private must be true");
if (pkg.license !== "UNLICENSED") throw new Error("package.license must be UNLICENSED");

const mainSha = sh("git rev-parse HEAD");
const treeSha = sh("git rev-parse HEAD^{tree}");
const trackedFiles = sh("git ls-files").split("\n").filter(Boolean).sort();

const forbiddenTracked = trackedFiles.filter((f) =>
  /(^|\/)(\.env|\.env\..+|node_modules|dist|build|coverage|\.DS_Store|npm-debug\.log|\.turbo|\.next|\.vercel)(\/|$)/.test(f) ||
  /\.(pem|key|p12|pfx|mobileprovision|keystore|jks|sqlite|db|dump|bak|tmp|log)$/i.test(f)
);

if (forbiddenTracked.length) {
  console.error(`TRUTHFRAMER_PUBLIC_SOURCE_PROVENANCE_FAIL=FORBIDDEN_TRACKED_FILES:${forbiddenTracked.join(",")}`);
  process.exit(1);
}

const packJson = JSON.parse(sh("npm pack --dry-run --json"));
const packFiles = (packJson[0]?.files || []).map((x) => ({
  path: x.path,
  size: x.size
})).sort((a, b) => a.path.localeCompare(b.path));

const packListSha = sha256Text(JSON.stringify(packFiles));

const certifiedObjects = requiredFiles.map((file) => ({
  path: file,
  sha256: sha256File(file)
}));

const certificate = {
  certificate_version: VERSION,
  status: "PUBLIC_SOURCE_PROVENANCE_CERTIFIED",
  base_release: BASE_RELEASE,
  repository: "TRUTHFRAMER/truthframer-platform",
  branch: "main",
  main_commit_sha: mainSha,
  main_tree_sha: treeSha,
  package_private: pkg.private,
  package_license: pkg.license,
  tracked_file_count: trackedFiles.length,
  forbidden_tracked_file_count: forbiddenTracked.length,
  npm_pack_file_count: packFiles.length,
  npm_pack_files_sha256: packListSha,
  npm_pack_files: packFiles,
  certified_objects: certifiedObjects,
  provenance_claims: [
    "main commit and tree are recorded",
    "legal/privacy perimeter files are present and hashed",
    "public root finality certificate is present and hashed",
    "public legal privacy certificate is present and hashed",
    "public distribution egress certificate is present and hashed",
    "npm pack surface is enumerated and hashed",
    "forbidden tracked secret/build/runtime outputs are absent",
    "package is private and UNLICENSED"
  ],
  generated_at: new Date().toISOString()
};

const certText = JSON.stringify(certificate, null, 2) + "\n";
const certSha = sha256Text(certText);

const seal = {
  seal_version: VERSION,
  status: "PUBLIC_SOURCE_PROVENANCE_CERTIFIED_SEALED",
  certificate_path: `docs/verification/${CERT}.json`,
  certificate_sha256: certSha,
  sealed_at: new Date().toISOString()
};

jsonWrite(`docs/verification/${CERT}.json`, certificate);
jsonWrite(`docs/verification/${SEAL}.json`, seal);
jsonWrite(`verification/${VERSION}/${CERT}.json`, certificate);
jsonWrite(`verification/${VERSION}/${SEAL}.json`, seal);
jsonWrite(`reports/current/public-source-provenance-certificate-${VERSION}.json`, certificate);
jsonWrite(`reports/current/public-source-provenance-certificate-seal-${VERSION}.json`, seal);

console.log("TRUTHFRAMER_PUBLIC_SOURCE_PROVENANCE_GENERATED=true");
console.log(`CERTIFICATE_VERSION=${VERSION}`);
console.log(`STATUS=${certificate.status}`);
console.log(`TRACKED_FILE_COUNT=${certificate.tracked_file_count}`);
console.log(`NPM_PACK_FILE_COUNT=${certificate.npm_pack_file_count}`);
console.log(`SEALED_CERTIFICATE_SHA256=${certSha}`);
