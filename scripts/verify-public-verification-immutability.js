#!/usr/bin/env node
const fs = require("node:fs");

const VERSION = "v1.0.4";
const CERT = "PUBLIC_VERIFICATION_IMMUTABILITY_CERTIFICATE";

function fail(msg) {
  console.error(`TRUTHFRAMER_PUBLIC_VERIFICATION_IMMUTABILITY_FAIL=${msg}`);
  process.exit(1);
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
if (cert.status !== "PUBLIC_VERIFICATION_IMMUTABILITY_CERTIFIED") fail("STATUS_MISMATCH");
if (cert.base_release !== "v1.0.3") fail("BASE_RELEASE_MISMATCH");
if (cert.verification_purity_enforced !== true) fail("PURITY_NOT_ENFORCED");
if (cert.verify_all_side_effects_allowed !== false) fail("SIDE_EFFECTS_ALLOWED");
if (cert.mutable_report_deadlock_closed !== true) fail("MUTABLE_REPORT_DEADLOCK_NOT_CLOSED");
if (!Array.isArray(cert.certified_scripts) || cert.certified_scripts.length < 6) fail("CERTIFIED_SCRIPTS_INCOMPLETE");

console.log("TRUTHFRAMER_PUBLIC_VERIFICATION_IMMUTABILITY_PASS=true");
console.log(`CERTIFICATE_VERSION=${VERSION}`);
console.log(`STATUS=${cert.status}`);
console.log("VERIFY_ALL_SIDE_EFFECTS_ALLOWED=false");
