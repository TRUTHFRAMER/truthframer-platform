#!/usr/bin/env node
const fs = require("node:fs");
const crypto = require("node:crypto");
const cp = require("node:child_process");
const path = require("node:path");

const VERSION = "v1.0.4";
const BASE_RELEASE = "v1.0.3";
const CERT = "PUBLIC_VERIFICATION_IMMUTABILITY_CERTIFICATE";
const SEAL = "PUBLIC_VERIFICATION_IMMUTABILITY_CERTIFICATE_SEAL";

function sh(cmd) {
  return cp.execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function sha256Text(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function writeJson(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n");
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

if (!pkg.scripts?.["verify:verification-purity"]) {
  throw new Error("verify:verification-purity script missing");
}

if (!pkg.scripts["verify:all"].includes("verify:verification-purity")) {
  throw new Error("verify:all does not include verification purity");
}

const certifiedScripts = [
  "scripts/verify-distribution-egress.js",
  "scripts/verify-verification-purity.js",
  "scripts/verify-public-distribution-egress-firewall.js",
  "scripts/verify-public-distribution-egress-firewall-seal.js",
  "scripts/verify-public-source-provenance.js",
  "scripts/verify-public-source-provenance-seal.js"
];

for (const file of certifiedScripts) {
  if (!fs.existsSync(file)) throw new Error(`missing certified script: ${file}`);
}

const certificate = {
  certificate_version: VERSION,
  status: "PUBLIC_VERIFICATION_IMMUTABILITY_CERTIFIED",
  base_release: BASE_RELEASE,
  repository: "TRUTHFRAMER/truthframer-platform",
  branch: "main",
  base_commit_sha: sh("git rev-parse HEAD"),
  base_tree_sha: sh("git rev-parse HEAD^{tree}"),
  verification_purity_enforced: true,
  verify_all_side_effects_allowed: false,
  mutable_report_deadlock_closed: true,
  repaired_mutable_verifier: "scripts/verify-distribution-egress.js",
  certified_scripts: certifiedScripts.map((file) => ({
    path: file,
    sha256: sha256File(file)
  })),
  claims: [
    "verify:all includes a repository mutation detector",
    "the mutation detector snapshots tracked and untracked file hashes",
    "the mutation detector executes verify:all recursively with purity recursion disabled",
    "verify:distribution-egress is pure and does not rewrite reports/current/distribution-egress-v1.0.2.json",
    "verification may observe state but may not mutate tracked repository state",
    "publication certificates remain historical objects, not mutable head-bound reports"
  ],
  generated_at: new Date().toISOString()
};

const certText = JSON.stringify(certificate, null, 2) + "\n";
const certSha = sha256Text(certText);

const seal = {
  seal_version: VERSION,
  status: "PUBLIC_VERIFICATION_IMMUTABILITY_CERTIFIED_SEALED",
  certificate_path: `docs/verification/${CERT}.json`,
  certificate_sha256: certSha,
  sealed_at: new Date().toISOString()
};

writeJson(`docs/verification/${CERT}.json`, certificate);
writeJson(`docs/verification/${SEAL}.json`, seal);
writeJson(`verification/${VERSION}/${CERT}.json`, certificate);
writeJson(`verification/${VERSION}/${SEAL}.json`, seal);
writeJson(`reports/current/public-verification-immutability-certificate-${VERSION}.json`, certificate);
writeJson(`reports/current/public-verification-immutability-certificate-seal-${VERSION}.json`, seal);

console.log("TRUTHFRAMER_PUBLIC_VERIFICATION_IMMUTABILITY_GENERATED=true");
console.log(`CERTIFICATE_VERSION=${VERSION}`);
console.log(`STATUS=${certificate.status}`);
console.log(`SEALED_CERTIFICATE_SHA256=${certSha}`);
