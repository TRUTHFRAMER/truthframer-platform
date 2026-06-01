#!/usr/bin/env node
"use strict";

const fs = require("fs");
const crypto = require("crypto");

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  return "{" + Object.keys(value).sort().map((k) => JSON.stringify(k) + ":" + stableStringify(value[k])).join(",") + "}";
}

function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function withoutSealSha(seal) {
  const clone = JSON.parse(JSON.stringify(seal));
  delete clone.seal_sha256;
  return clone;
}

const path = "verifier/TRUTHFRAMER_PUBLIC_VERIFIER_INTEGRITY_SEAL.json";
const docsPath = "docs/verifier/TRUTHFRAMER_PUBLIC_VERIFIER_INTEGRITY_SEAL.json";
const reportPath = "reports/current/public-verifier-integrity-seal-v1.8.0.json";

for (const p of [path, docsPath, reportPath]) {
  if (!fs.existsSync(p)) throw new Error(`MISSING_REQUIRED_FILE ${p}`);
}

const seal = JSON.parse(fs.readFileSync(path, "utf8"));
const docsSeal = JSON.parse(fs.readFileSync(docsPath, "utf8"));
const reportSeal = JSON.parse(fs.readFileSync(reportPath, "utf8"));

if (stableStringify(seal) !== stableStringify(docsSeal)) throw new Error("DOCS_SEAL_MISMATCH");
if (stableStringify(seal) !== stableStringify(reportSeal)) throw new Error("REPORT_SEAL_MISMATCH");

const expected = sha256Hex(stableStringify(withoutSealSha(seal)));
if (seal.seal_sha256 !== expected) throw new Error("SEAL_SHA256_MISMATCH");

if (seal.version !== "v1.8.0") throw new Error("VERSION_MISMATCH");
if (seal.status !== "PUBLIC_VERIFIER_INTEGRITY_SEALED") throw new Error("STATUS_MISMATCH");

for (const [key, value] of Object.entries(seal.assertions || {})) {
  if (value !== true) throw new Error(`ASSERTION_FAILED ${key}`);
}

console.log("TRUTHFRAMER_PUBLIC_VERIFIER_INTEGRITY_SEAL_PASS=true");
console.log("VERSION=" + seal.version);
console.log("STATUS=" + seal.status);
console.log("VERIFIER_SCRIPT_RAW_SHA256=" + seal.sealed_public_digests.verifier_script_raw_sha256);
console.log("WITNESS_SHA256=" + seal.sealed_public_digests.witness_declared_sha256);
console.log("SEAL_SHA256=" + seal.seal_sha256);
console.log("NO_PRIVATE_SOURCE_REQUIRED=true");
