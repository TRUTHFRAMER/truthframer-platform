#!/usr/bin/env node
const fs = require("fs");

const PUBLIC_URL = "https://truthframer.github.io/truthframer-platform";
const atlas = JSON.parse(fs.readFileSync("docs/verification/PUBLIC_VERIFICATION_ATLAS.json", "utf8"));

function fail(code) {
  console.error(`TRUTHFRAMER_PUBLIC_VERIFICATION_ATLAS_FAIL=${code}`);
  process.exit(1);
}
function requireUrl(url) {
  if (!atlas.artifacts.some(a => a.url === url)) fail(`MISSING_URL:${url}`);
}

if (atlas.object_type !== "TRUTHFRAMER_PUBLIC_VERIFICATION_ATLAS") fail("BAD_OBJECT_TYPE");
if (atlas.atlas_version !== "v0.7.0") fail("BAD_VERSION");
if (atlas.status !== "COMPLETE_PUBLIC_VERIFICATION_ATLAS") fail("BAD_STATUS");
if (atlas.frame_count !== 4) fail("FRAME_COUNT_NOT_FOUR");
if (!Array.isArray(atlas.frames) || atlas.frames.length !== 4) fail("FRAME_ARRAY_NOT_FOUR");
if (!Array.isArray(atlas.releases) || atlas.releases.length < 10) fail("RELEASE_COUNT_TOO_LOW");
if (!Array.isArray(atlas.artifacts) || atlas.artifacts.length !== atlas.artifact_count) fail("ARTIFACT_COUNT_MISMATCH");

const ids = atlas.frames.map(f => f.truth_frame_id).sort();
const expected = ["tf_000001", "tf_000002", "tf_000003", "tf_000004"];
if (JSON.stringify(ids) !== JSON.stringify(expected)) fail(`BAD_FRAME_IDS:${ids.join(",")}`);

const tf1 = atlas.frames.find(f => f.truth_frame_id === "tf_000001");
if (!tf1) fail("TF000001_MISSING");
if (tf1.render_url !== `${PUBLIC_URL}/render/`) fail("TF000001_RENDER_ROUTE_NOT_CANONICAL");
if (tf1.public_surface_proof_url !== `${PUBLIC_URL}/proof/PUBLIC_SURFACE_PROOF.json`) fail("TF000001_PROOF_ROUTE_NOT_CANONICAL");

for (const frame of atlas.frames) {
  requireUrl(frame.render_url);
  requireUrl(frame.truth_frame_url);
  requireUrl(frame.source_manifest_url);
  requireUrl(frame.replay_manifest_url);
  requireUrl(frame.public_surface_proof_url);
}

requireUrl(`${PUBLIC_URL}/verification/PUBLIC_VERIFICATION_INDEX.json`);
requireUrl(`${PUBLIC_URL}/verification/PUBLIC_VERIFICATION_INDEX_SEAL.json`);
requireUrl(`${PUBLIC_URL}/verification/PUBLIC_VERIFICATION_ATLAS.json`);
requireUrl(`${PUBLIC_URL}/verification/PUBLIC_VERIFICATION_ATLAS_SEAL.json`);

console.log("TRUTHFRAMER_PUBLIC_VERIFICATION_ATLAS_PASS=true");
console.log(`ATLAS_VERSION=${atlas.atlas_version}`);
console.log(`STATUS=${atlas.status}`);
console.log(`FRAME_COUNT=${atlas.frame_count}`);
console.log(`ARTIFACT_COUNT=${atlas.artifact_count}`);
