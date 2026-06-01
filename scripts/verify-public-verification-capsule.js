#!/usr/bin/env node
const fs = require("fs");
const crypto = require("crypto");

const VERSION = "v1.5.0";
const STATUS = "PUBLIC_VERIFICATION_CAPSULE_BOUND";
const CAPSULE_PATH = "capsule/TRUTHFRAMER_PUBLIC_VERIFICATION_CAPSULE.json";
const DOCS_CAPSULE_PATH = "docs/capsule/TRUTHFRAMER_PUBLIC_VERIFICATION_CAPSULE.json";
const REPORT_PATH = "reports/current/public-verification-capsule-v1.5.0.json";

function sha256File(path) {
  return crypto.createHash("sha256").update(fs.readFileSync(path)).digest("hex");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function fail(message) {
  console.error("TRUTHFRAMER_PUBLIC_VERIFICATION_CAPSULE_PASS=false");
  console.error("ERROR=" + message);
  process.exit(1);
}

for (const path of [CAPSULE_PATH, DOCS_CAPSULE_PATH, REPORT_PATH, "docs/capsule/index.html"]) {
  if (!fs.existsSync(path)) fail("missing " + path);
}

if (sha256File(CAPSULE_PATH) !== sha256File(DOCS_CAPSULE_PATH)) fail("docs capsule copy mismatch");
if (sha256File(CAPSULE_PATH) !== sha256File(REPORT_PATH)) fail("report capsule copy mismatch");

const capsule = JSON.parse(fs.readFileSync(CAPSULE_PATH, "utf8"));

if (capsule.protocol !== "TRUTHFRAMER") fail("bad protocol");
if (capsule.version !== VERSION) fail("bad version");
if (capsule.status !== STATUS) fail("bad status");
if (capsule.role !== "portable_public_verification_capsule") fail("bad role");
if (!capsule.boundary?.no_brokerage_claim) fail("missing no brokerage boundary");
if (!capsule.boundary?.no_financial_advice_claim) fail("missing no advice boundary");
if (!capsule.boundary?.no_external_truth_claim) fail("missing no external truth boundary");
if (!Array.isArray(capsule.artifacts)) fail("artifacts not array");
if (capsule.artifact_count !== capsule.artifacts.length) fail("artifact count mismatch");

const expectedIds = new Set([
  "truth_frame_system_spine",
  "truth_frame_admission_gate",
  "truth_frame_admission_refusal_proof",
  "truth_frame_admission_closure_seal",
  "release_ledger_v1_4_0"
]);

for (const id of expectedIds) {
  if (!capsule.artifacts.some(a => a.id === id)) fail("missing required artifact " + id);
}

for (const artifact of capsule.artifacts) {
  if (!artifact.id || !artifact.path || !artifact.sha256) fail("bad artifact shape");
  if (!fs.existsSync(artifact.path)) fail("missing artifact path " + artifact.path);
  if (sha256File(artifact.path) !== artifact.sha256) fail("artifact sha mismatch " + artifact.path);
}

const claimed = capsule.capsule_sha256;
const clone = JSON.parse(JSON.stringify(capsule));
clone.capsule_sha256 = null;
const recomputed = sha256Text(canonical(clone));
if (claimed !== recomputed) fail("capsule sha mismatch");

console.log("TRUTHFRAMER_PUBLIC_VERIFICATION_CAPSULE_PASS=true");
console.log("VERSION=" + VERSION);
console.log("STATUS=" + STATUS);
console.log("ARTIFACT_COUNT=" + capsule.artifact_count);
console.log("CAPSULE_SHA256=" + claimed);
