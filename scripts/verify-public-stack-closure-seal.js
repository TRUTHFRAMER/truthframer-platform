#!/usr/bin/env node
const fs = require("fs");
const crypto = require("crypto");

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}
function fail(code) {
  console.error(`TRUTHFRAMER_PUBLIC_STACK_CLOSURE_SEAL_FAIL=${code}`);
  process.exit(1);
}
function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const closureText = fs.readFileSync("docs/verification/PUBLIC_STACK_CLOSURE.json", "utf8");
const closure = JSON.parse(closureText);
const seal = readJson("docs/verification/PUBLIC_STACK_CLOSURE_SEAL.json");

if (seal.object_type !== "TRUTHFRAMER_PUBLIC_STACK_CLOSURE_SEAL") fail("BAD_OBJECT_TYPE");
if (seal.seal_version !== "v0.8.0") fail("BAD_VERSION");
if (seal.status !== "TOTAL_PUBLIC_STACK_CLOSURE_SEALED") fail("BAD_STATUS");
if (seal.sealed_closure_sha256 !== sha256(closureText)) fail("SEALED_CLOSURE_SHA_MISMATCH");
if (seal.sealed_frame_count !== closure.counts.frame_count) fail("FRAME_COUNT_MISMATCH");
if (seal.sealed_release_count !== closure.counts.release_count) fail("RELEASE_COUNT_MISMATCH");
if (seal.sealed_total_public_artifact_count !== closure.counts.total_public_artifact_count) fail("ARTIFACT_COUNT_MISMATCH");
if (!seal.sealed_atlas_sha256) fail("ATLAS_SHA_NOT_SEALED");
if (!seal.sealed_branch_protection_readback_sha256) fail("BRANCH_PROTECTION_NOT_SEALED");

console.log("TRUTHFRAMER_PUBLIC_STACK_CLOSURE_SEAL_PASS=true");
console.log(`SEAL_VERSION=${seal.seal_version}`);
console.log(`STATUS=${seal.status}`);
console.log(`SEALED_CLOSURE_SHA256=${seal.sealed_closure_sha256}`);
