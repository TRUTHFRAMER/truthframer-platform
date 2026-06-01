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

function readJson(file) {
  if (!fs.existsSync(file)) fail(`MISSING_FILE:${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const certPath = `docs/verification/${CERT}.json`;
const versionedPath = `verification/${VERSION}/${CERT}.json`;
const reportPath = `reports/current/public-legal-privacy-perimeter-certificate-${VERSION}.json`;

const cert = readJson(certPath);
const versioned = readJson(versionedPath);

if (JSON.stringify(cert) !== JSON.stringify(versioned)) {
  fail("VERSIONED_CERTIFICATE_MISMATCH");
}

if (fs.existsSync(reportPath)) {
  const report = readJson(reportPath);
  if (JSON.stringify(cert) !== JSON.stringify(report)) {
    fail("REPORT_CERTIFICATE_MISMATCH");
  }
}

if (cert.certificate_version !== VERSION) fail("VERSION_MISMATCH");
if (cert.status !== "PUBLIC_LEGAL_PRIVACY_PERIMETER_CERTIFIED") fail("STATUS_MISMATCH");
if (cert.certified_file_count !== 9) fail("CERTIFIED_FILE_COUNT_MISMATCH");

const certified =
  cert.certified_files ||
  cert.certified_legal_files ||
  cert.files ||
  [];

if (Array.isArray(certified) && certified.length > 0) {
  for (const item of certified) {
    if (!item || typeof item !== "object") fail("BAD_CERTIFIED_FILE_ENTRY");
    if (!item.path) fail("CERTIFIED_FILE_PATH_MISSING");
    const hash = item.sha256 || item.hash || item.file_sha256;
    if (!hash || !/^[a-f0-9]{64}$/i.test(hash)) {
      fail(`CERTIFIED_FILE_HASH_BAD:${item.path}`);
    }
  }
}

/*
  Important boundary:
  v1.0.1 is a historical public legal/privacy certificate.
  Future releases may legitimately modify .gitignore, .npmignore, README, package.json,
  or legal perimeter files. This verifier therefore validates the sealed v1.0.1
  certificate object and its versioned copy, not mutable HEAD file hashes.
  Current HEAD legal/privacy posture remains covered by verify:privacy-perimeter.
*/

console.log("TRUTHFRAMER_PUBLIC_LEGAL_PRIVACY_PERIMETER_PASS=true");
console.log(`CERTIFICATE_VERSION=${VERSION}`);
console.log(`STATUS=${cert.status}`);
console.log(`CERTIFIED_FILE_COUNT=${cert.certified_file_count}`);
console.log(`CERTIFICATE_SHA256=${sha256File(certPath)}`);
