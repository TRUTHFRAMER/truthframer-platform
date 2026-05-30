#!/usr/bin/env node
const fs = require("fs");
const crypto = require("crypto");

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}
function fail(code) {
  console.error(`TRUTHFRAMER_PUBLIC_VERIFICATION_ATLAS_SEAL_FAIL=${code}`);
  process.exit(1);
}

const atlasText = fs.readFileSync("docs/verification/PUBLIC_VERIFICATION_ATLAS.json", "utf8");
const atlas = JSON.parse(atlasText);
const seal = JSON.parse(fs.readFileSync("docs/verification/PUBLIC_VERIFICATION_ATLAS_SEAL.json", "utf8"));

if (seal.object_type !== "TRUTHFRAMER_PUBLIC_VERIFICATION_ATLAS_SEAL") fail("BAD_OBJECT_TYPE");
if (seal.seal_version !== "v0.7.0") fail("BAD_VERSION");
if (seal.status !== "COMPLETE_PUBLIC_VERIFICATION_ATLAS_SEALED") fail("BAD_STATUS");
if (seal.sealed_atlas_sha256 !== sha256(atlasText)) fail("SEALED_ATLAS_SHA_MISMATCH");
if (seal.sealed_frame_count !== 4) fail("SEALED_FRAME_COUNT_NOT_FOUR");
if (seal.sealed_frame_count !== atlas.frame_count) fail("FRAME_COUNT_ATLAS_SEAL_MISMATCH");
if (seal.sealed_artifact_count !== atlas.artifact_count) fail("ARTIFACT_COUNT_ATLAS_SEAL_MISMATCH");

console.log("TRUTHFRAMER_PUBLIC_VERIFICATION_ATLAS_SEAL_PASS=true");
console.log(`SEAL_VERSION=${seal.seal_version}`);
console.log(`STATUS=${seal.status}`);
console.log(`SEALED_ATLAS_SHA256=${seal.sealed_atlas_sha256}`);
