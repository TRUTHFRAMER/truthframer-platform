#!/usr/bin/env node
const fs = require("node:fs");

const VERSION = "v1.0.2";
const CERT = "PUBLIC_DISTRIBUTION_EGRESS_FIREWALL_CERTIFICATE";

function fail(msg) {
  console.error(`TRUTHFRAMER_PUBLIC_DISTRIBUTION_EGRESS_FIREWALL_FAIL=${msg}`);
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
if (cert.status !== "PUBLIC_DISTRIBUTION_EGRESS_FIREWALL_CERTIFIED") fail("STATUS_MISMATCH");
if (cert.package_private !== true) fail("PACKAGE_PRIVATE_NOT_TRUE");
if (cert.package_license !== "UNLICENSED") fail("PACKAGE_LICENSE_NOT_UNLICENSED");
if (!cert.report || cert.report.path !== `reports/current/distribution-egress-${VERSION}.json`) fail("REPORT_POINTER_MISMATCH");
if (!cert.report.sha256 || typeof cert.report.sha256 !== "string") fail("REPORT_HASH_MISSING");
if (!Array.isArray(cert.certified_ignore_files) || cert.certified_ignore_files.length !== 3) fail("IGNORE_FILE_CERTIFICATION_INCOMPLETE");
if (!Array.isArray(cert.deny_policy) || cert.deny_policy.length < 6) fail("DENY_POLICY_INCOMPLETE");
if (cert.npm_pack_file_count !== 4) fail("NPM_PACK_FILE_COUNT_MISMATCH");

/*
  This is intentionally historical.

  The v1.0.2 public certificate seals the distribution-egress posture at the
  certificate issuance point. Later ledger files, release files, and verifier
  files legitimately change git ls-files and reports/current/* output.

  Therefore this verifier validates the certificate object and its versioned
  copy, but does not compare the sealed historical report hash against the
  mutable HEAD-generated report file.
*/

console.log("TRUTHFRAMER_PUBLIC_DISTRIBUTION_EGRESS_FIREWALL_PASS=true");
console.log(`CERTIFICATE_VERSION=${VERSION}`);
console.log(`STATUS=${cert.status}`);
console.log(`NPM_PACK_FILE_COUNT=${cert.npm_pack_file_count}`);
console.log(`CERTIFICATE_REPORT_SHA256=${cert.report.sha256}`);
