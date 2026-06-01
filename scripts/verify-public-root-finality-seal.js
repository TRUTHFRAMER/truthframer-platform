#!/usr/bin/env node
const fs = require("fs");
const crypto = require("crypto");

const VERSION = "v1.0.0";
const CLOSES_OVER = "v0.9.1";

function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function readJson(p) {
  return JSON.parse(read(p));
}

function fail(msg) {
  console.error(`TRUTHFRAMER_PUBLIC_ROOT_FINALITY_SEAL_FAIL=${msg}`);
  process.exit(1);
}

const certPath = "docs/verification/PUBLIC_ROOT_FINALITY_CERTIFICATE.json";
const sealPath = "docs/verification/PUBLIC_ROOT_FINALITY_CERTIFICATE_SEAL.json";
const vSealPath = "verification/v1.0.0/PUBLIC_ROOT_FINALITY_CERTIFICATE_SEAL.json";

if (!fs.existsSync(certPath)) fail(`MISSING:${certPath}`);
if (!fs.existsSync(sealPath)) fail(`MISSING:${sealPath}`);
if (!fs.existsSync(vSealPath)) fail(`MISSING:${vSealPath}`);

const seal = readJson(sealPath);
const vSeal = readJson(vSealPath);

if (JSON.stringify(seal) !== JSON.stringify(vSeal)) fail("VERSIONED_SEAL_MISMATCH");
if (seal.protocol !== "TRUTHFRAMER") fail("BAD_PROTOCOL");
if (seal.seal_version !== VERSION) fail("BAD_SEAL_VERSION");
if (seal.status !== "PUBLIC_ROOT_FINALITY_CERTIFIED_SEALED") fail("BAD_STATUS");
if (seal.closes_over_release !== CLOSES_OVER) fail("BAD_CLOSES_OVER_RELEASE");

const actual = sha256(read(certPath));
if (actual !== seal.sealed_certificate_sha256) fail("SEALED_CERTIFICATE_SHA256_MISMATCH");

console.log("TRUTHFRAMER_PUBLIC_ROOT_FINALITY_SEAL_PASS=true");
console.log(`SEAL_VERSION=${seal.seal_version}`);
console.log(`STATUS=${seal.status}`);
console.log(`SEALED_CERTIFICATE_SHA256=${seal.sealed_certificate_sha256}`);
