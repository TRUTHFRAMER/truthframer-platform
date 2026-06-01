#!/usr/bin/env node
const fs = require("node:fs");
const crypto = require("node:crypto");

const VERSION = "v1.0.2";
const CERT = "PUBLIC_DISTRIBUTION_EGRESS_FIREWALL_CERTIFICATE";

function fail(msg) {
  console.error(`TRUTHFRAMER_PUBLIC_DISTRIBUTION_EGRESS_FIREWALL_FAIL=${msg}`);
  process.exit(1);
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

const certPath = `docs/verification/${CERT}.json`;
const versionedPath = `verification/${VERSION}/${CERT}.json`;

for (const file of [certPath, versionedPath]) {
  if (!fs.existsSync(file)) fail(`MISSING_CERTIFICATE:${file}`);
}

const cert = JSON.parse(fs.readFileSync(certPath, "utf8"));
const versioned = JSON.parse(fs.readFileSync(versionedPath, "utf8"));

if (JSON.stringify(cert) !== JSON.stringify(versioned)) fail("VERSIONED_CERTIFICATE_MISMATCH");
if (cert.certificate_version !== VERSION) fail("VERSION_MISMATCH");
if (cert.status !== "PUBLIC_DISTRIBUTION_EGRESS_FIREWALL_CERTIFIED") fail("STATUS_MISMATCH");
if (cert.package_private !== true) fail("PACKAGE_PRIVATE_NOT_TRUE");
if (cert.package_license !== "UNLICENSED") fail("PACKAGE_LICENSE_NOT_UNLICENSED");
if (!cert.report || !fs.existsSync(cert.report.path)) fail("REPORT_MISSING");
if (sha256File(cert.report.path) !== cert.report.sha256) fail("REPORT_HASH_MISMATCH");
if (!Array.isArray(cert.certified_ignore_files) || cert.certified_ignore_files.length !== 3) fail("IGNORE_FILE_CERTIFICATION_INCOMPLETE");

console.log("TRUTHFRAMER_PUBLIC_DISTRIBUTION_EGRESS_FIREWALL_PASS=true");
console.log(`CERTIFICATE_VERSION=${VERSION}`);
console.log(`STATUS=${cert.status}`);
console.log(`NPM_PACK_FILE_COUNT=${cert.npm_pack_file_count}`);
