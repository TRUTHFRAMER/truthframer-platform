#!/usr/bin/env node
const fs = require("node:fs");
const crypto = require("node:crypto");

const VERSION = "v1.0.1";
const CERT = "PUBLIC_LEGAL_PRIVACY_PERIMETER_CERTIFICATE";
const SEAL = "PUBLIC_LEGAL_PRIVACY_PERIMETER_CERTIFICATE_SEAL";

function fail(msg) {
  console.error(`TRUTHFRAMER_PUBLIC_LEGAL_PRIVACY_PERIMETER_SEAL_FAIL=${msg}`);
  process.exit(1);
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

const certPath = `docs/verification/${CERT}.json`;
const sealPath = `docs/verification/${SEAL}.json`;
const versionedCertPath = `verification/${VERSION}/${CERT}.json`;
const versionedSealPath = `verification/${VERSION}/${SEAL}.json`;

for (const file of [certPath, sealPath, versionedCertPath, versionedSealPath]) {
  if (!fs.existsSync(file)) fail(`MISSING_FILE:${file}`);
}

const seal = JSON.parse(fs.readFileSync(sealPath, "utf8"));
const versionedSeal = JSON.parse(fs.readFileSync(versionedSealPath, "utf8"));

if (JSON.stringify(seal) !== JSON.stringify(versionedSeal)) fail("SEAL_VERSION_COPY_MISMATCH");
if (seal.seal_version !== VERSION) fail("SEAL_VERSION_MISMATCH");
if (seal.status !== "PUBLIC_LEGAL_PRIVACY_PERIMETER_CERTIFIED_SEALED") fail("SEAL_STATUS_MISMATCH");

const certHash = sha256File(certPath);
if (seal.sealed_certificate_sha256 !== certHash) fail("SEALED_CERTIFICATE_HASH_MISMATCH");

const cert = fs.readFileSync(certPath, "utf8");
const versionedCert = fs.readFileSync(versionedCertPath, "utf8");
if (cert !== versionedCert) fail("VERSIONED_CERTIFICATE_CONTENT_MISMATCH");

console.log("TRUTHFRAMER_PUBLIC_LEGAL_PRIVACY_PERIMETER_SEAL_PASS=true");
console.log(`SEAL_VERSION=${VERSION}`);
console.log(`STATUS=${seal.status}`);
console.log(`SEALED_CERTIFICATE_SHA256=${seal.sealed_certificate_sha256}`);
