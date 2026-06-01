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
  console.error(`TRUTHFRAMER_PUBLIC_ROOT_FINALITY_FAIL=${msg}`);
  process.exit(1);
}

const p = "docs/verification/PUBLIC_ROOT_FINALITY_CERTIFICATE.json";
const vp = "verification/v1.0.0/PUBLIC_ROOT_FINALITY_CERTIFICATE.json";

if (!fs.existsSync(p)) fail(`MISSING:${p}`);
if (!fs.existsSync(vp)) fail(`MISSING:${vp}`);

const cert = readJson(p);
const versioned = readJson(vp);

if (JSON.stringify(cert) !== JSON.stringify(versioned)) fail("VERSIONED_COPY_MISMATCH");
if (cert.protocol !== "TRUTHFRAMER") fail("BAD_PROTOCOL");
if (cert.certificate_version !== VERSION) fail("BAD_VERSION");
if (cert.status !== "PUBLIC_ROOT_FINALITY_CERTIFIED") fail("BAD_STATUS");
if (cert.closes_over_release !== CLOSES_OVER) fail("BAD_CLOSES_OVER_RELEASE");

if (!Array.isArray(cert.required_frames) || cert.required_frames.length !== 4) fail("FRAME_COUNT_NOT_FOUR");
for (const frame of ["tf_000001", "tf_000002", "tf_000003", "tf_000004"]) {
  if (!cert.required_frames.includes(frame)) fail(`MISSING_FRAME:${frame}`);
}

if (!Array.isArray(cert.covered_releases) || !cert.covered_releases.includes(CLOSES_OVER)) fail("CLOSED_RELEASE_NOT_COVERED");
if (!Array.isArray(cert.covered_public_artifacts) || cert.covered_public_artifacts.length < 11) fail("INSUFFICIENT_PUBLIC_ARTIFACT_COVERAGE");

for (const a of cert.covered_public_artifacts) {
  if (!a.path || !fs.existsSync(a.path)) fail(`LOCAL_ARTIFACT_MISSING:${a.path}`);
  const actual = sha256(read(a.path));
  if (actual !== a.sha256) fail(`LOCAL_ARTIFACT_HASH_MISMATCH:${a.path}`);
}

console.log("TRUTHFRAMER_PUBLIC_ROOT_FINALITY_PASS=true");
console.log(`FINALITY_VERSION=${cert.certificate_version}`);
console.log(`STATUS=${cert.status}`);
console.log(`CLOSES_OVER_RELEASE=${cert.closes_over_release}`);
console.log(`COVERED_RELEASE_COUNT=${cert.covered_releases.length}`);
console.log(`COVERED_ARTIFACT_COUNT=${cert.covered_public_artifacts.length}`);
