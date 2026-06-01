#!/usr/bin/env node
const fs = require("node:fs");
const crypto = require("node:crypto");

const VERSION = "v1.0.2";
const CERT = "PUBLIC_DISTRIBUTION_EGRESS_FIREWALL_CERTIFICATE";
const SEAL = "PUBLIC_DISTRIBUTION_EGRESS_FIREWALL_CERTIFICATE_SEAL";

function fail(msg) {
  console.error(`TRUTHFRAMER_PUBLIC_DISTRIBUTION_EGRESS_FIREWALL_SEAL_FAIL=${msg}`);
  process.exit(1);
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

const certPath = `docs/verification/${CERT}.json`;
const sealPath = `docs/verification/${SEAL}.json`;
const versionedSealPath = `verification/${VERSION}/${SEAL}.json`;

for (const file of [certPath, sealPath, versionedSealPath]) {
  if (!fs.existsSync(file)) fail(`MISSING_FILE:${file}`);
}

const seal = JSON.parse(fs.readFileSync(sealPath, "utf8"));
const versionedSeal = JSON.parse(fs.readFileSync(versionedSealPath, "utf8"));

if (JSON.stringify(seal) !== JSON.stringify(versionedSeal)) fail("VERSIONED_SEAL_MISMATCH");
if (seal.seal_version !== VERSION) fail("SEAL_VERSION_MISMATCH");
if (seal.status !== "PUBLIC_DISTRIBUTION_EGRESS_FIREWALL_CERTIFIED_SEALED") fail("SEAL_STATUS_MISMATCH");
if (seal.sealed_certificate_sha256 !== sha256File(certPath)) fail("SEALED_CERTIFICATE_HASH_MISMATCH");

console.log("TRUTHFRAMER_PUBLIC_DISTRIBUTION_EGRESS_FIREWALL_SEAL_PASS=true");
console.log(`SEAL_VERSION=${VERSION}`);
console.log(`STATUS=${seal.status}`);
console.log(`SEALED_CERTIFICATE_SHA256=${seal.sealed_certificate_sha256}`);
