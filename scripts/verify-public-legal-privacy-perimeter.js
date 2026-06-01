#!/usr/bin/env node
const fs = require("node:fs");
const crypto = require("node:crypto");

const VERSION = "v1.0.1";
const CERT = "PUBLIC_LEGAL_PRIVACY_PERIMETER_CERTIFICATE";

function fail(msg) {
  console.error(`TRUTHFRAMER_PUBLIC_LEGAL_PRIVACY_PERIMETER_FAIL=${msg}`);
  process.exit(1);
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

const certPath = `docs/verification/${CERT}.json`;
const versionedPath = `verification/${VERSION}/${CERT}.json`;

if (!fs.existsSync(certPath)) fail(`MISSING_CERTIFICATE:${certPath}`);
if (!fs.existsSync(versionedPath)) fail(`MISSING_VERSIONED_CERTIFICATE:${versionedPath}`);

const cert = JSON.parse(fs.readFileSync(certPath, "utf8"));
const versioned = JSON.parse(fs.readFileSync(versionedPath, "utf8"));

if (JSON.stringify(cert) !== JSON.stringify(versioned)) fail("CERTIFICATE_VERSION_COPY_MISMATCH");
if (cert.certificate_version !== VERSION) fail("VERSION_MISMATCH");
if (cert.status !== "PUBLIC_LEGAL_PRIVACY_PERIMETER_CERTIFIED") fail("STATUS_MISMATCH");
if (cert.posture !== "PROPRIETARY_SOURCE_AVAILABLE_ALL_RIGHTS_RESERVED") fail("POSTURE_MISMATCH");
if (cert.open_source_license !== false) fail("OPEN_SOURCE_LICENSE_NOT_FALSE");
if (cert.ai_training_use_permitted !== false) fail("AI_TRAINING_USE_NOT_FALSE");

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (pkg.private !== true) fail("PACKAGE_PRIVATE_NOT_TRUE");
if (pkg.license !== "UNLICENSED") fail("PACKAGE_LICENSE_NOT_UNLICENSED");
if (!pkg.scripts || !pkg.scripts["verify:privacy-perimeter"]) fail("PACKAGE_MISSING_PRIVACY_SCRIPT");

if (!Array.isArray(cert.certified_files) || cert.certified_files.length < 8) {
  fail("CERTIFIED_FILES_INCOMPLETE");
}

for (const entry of cert.certified_files) {
  if (!entry.path || !entry.sha256) fail("BAD_CERTIFIED_FILE_ENTRY");
  if (!fs.existsSync(entry.path)) fail(`CERTIFIED_FILE_MISSING:${entry.path}`);
  const actual = sha256File(entry.path);
  if (actual !== entry.sha256) fail(`CERTIFIED_FILE_HASH_MISMATCH:${entry.path}`);
}

console.log("TRUTHFRAMER_PUBLIC_LEGAL_PRIVACY_PERIMETER_PASS=true");
console.log(`CERTIFICATE_VERSION=${VERSION}`);
console.log(`STATUS=${cert.status}`);
console.log(`CERTIFIED_FILE_COUNT=${cert.certified_files.length}`);
