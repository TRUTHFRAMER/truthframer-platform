#!/usr/bin/env node
const fs = require("node:fs");
const crypto = require("node:crypto");

const VERSION = "v1.0.1";
const CERT = "PUBLIC_LEGAL_PRIVACY_PERIMETER_CERTIFICATE";
const SEAL = "PUBLIC_LEGAL_PRIVACY_PERIMETER_CERTIFICATE_SEAL";

function fail(msg) {
  console.error(`TRUTHFRAMER_PUBLIC_LEGAL_PRIVACY_PERIMETER_GENERATE_FAIL=${msg}`);
  process.exit(1);
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function writeJson(file, obj) {
  fs.mkdirSync(require("node:path").dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n");
}

const immutableFiles = [
  "LICENSE.md",
  "NOTICE.md",
  "PRIVACY.md",
  "SECURITY.md",
  "CONTRIBUTING.md",
  ".gitignore",
  ".npmignore",
  ".dockerignore",
  "scripts/verify-privacy-perimeter.js"
];

for (const file of immutableFiles) {
  if (!fs.existsSync(file)) fail(`MISSING_SOURCE_FILE:${file}`);
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (pkg.private !== true) fail("PACKAGE_PRIVATE_NOT_TRUE");
if (pkg.license !== "UNLICENSED") fail("PACKAGE_LICENSE_NOT_UNLICENSED");
if (!pkg.scripts || !pkg.scripts["verify:privacy-perimeter"]) {
  fail("PACKAGE_MISSING_PRIVACY_VERIFY_SCRIPT");
}

const sourceFiles = immutableFiles.map((file) => ({
  path: file,
  sha256: sha256File(file),
  bytes: fs.statSync(file).size
}));

const certificate = {
  certificate_version: VERSION,
  status: "PUBLIC_LEGAL_PRIVACY_PERIMETER_CERTIFIED",
  posture: "PROPRIETARY_SOURCE_AVAILABLE_ALL_RIGHTS_RESERVED",
  public_license_grant: "NONE_BEYOND_GITHUB_PLATFORM_MINIMUM",
  open_source_license: false,
  commercial_use_permitted: false,
  redistribution_permitted: false,
  derivative_use_permitted: false,
  ai_training_use_permitted: false,
  package_posture: {
    private: pkg.private,
    license: pkg.license,
    privacy_verifier: "verify:privacy-perimeter"
  },
  certified_files: sourceFiles,
  certified_file_count: sourceFiles.length,
  public_paths: {
    certificate: `verification/${CERT}.json`,
    seal: `verification/${SEAL}.json`,
    versioned_certificate: `verification/${VERSION}/${CERT}.json`,
    versioned_seal: `verification/${VERSION}/${SEAL}.json`
  }
};

const certText = JSON.stringify(certificate, null, 2) + "\n";
const certHash = sha256Text(certText);

const seal = {
  seal_version: VERSION,
  status: "PUBLIC_LEGAL_PRIVACY_PERIMETER_CERTIFIED_SEALED",
  sealed_certificate_sha256: certHash,
  certificate: `${CERT}.json`,
  certified_file_count: sourceFiles.length
};

writeJson(`docs/verification/${CERT}.json`, certificate);
writeJson(`verification/${VERSION}/${CERT}.json`, certificate);
writeJson(`reports/current/public-legal-privacy-perimeter-certificate-${VERSION}.json`, certificate);

writeJson(`docs/verification/${SEAL}.json`, seal);
writeJson(`verification/${VERSION}/${SEAL}.json`, seal);
writeJson(`reports/current/public-legal-privacy-perimeter-certificate-seal-${VERSION}.json`, seal);

console.log("TRUTHFRAMER_PUBLIC_LEGAL_PRIVACY_PERIMETER_GENERATED=true");
console.log(`CERTIFICATE_VERSION=${VERSION}`);
console.log(`STATUS=${certificate.status}`);
console.log(`CERTIFIED_FILE_COUNT=${sourceFiles.length}`);
console.log(`SEALED_CERTIFICATE_SHA256=${certHash}`);
