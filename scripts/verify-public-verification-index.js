#!/usr/bin/env node
const fs = require("node:fs");

const paths = [
  "verification/v0.6.0/PUBLIC_VERIFICATION_INDEX.json",
  "docs/verification/PUBLIC_VERIFICATION_INDEX.json",
  "reports/current/public-verification-index-v0.6.0.json"
];

for (const path of paths) {
  if (!fs.existsSync(path)) {
    console.error(`TRUTHFRAMER_PUBLIC_VERIFICATION_INDEX_FAIL=MISSING:${path}`);
    process.exit(1);
  }
}

const index = JSON.parse(fs.readFileSync(paths[0], "utf8"));
const docs = JSON.parse(fs.readFileSync(paths[1], "utf8"));
const report = JSON.parse(fs.readFileSync(paths[2], "utf8"));

function fail(code) {
  console.error(`TRUTHFRAMER_PUBLIC_VERIFICATION_INDEX_FAIL=${code}`);
  process.exit(1);
}

if (JSON.stringify(index) !== JSON.stringify(docs)) fail("DOCS_COPY_DIVERGES");
if (JSON.stringify(index) !== JSON.stringify(report)) fail("REPORT_COPY_DIVERGES");

if (index.object_type !== "TRUTHFRAMER_PUBLIC_VERIFICATION_INDEX") fail("BAD_OBJECT_TYPE");
if (index.index_version !== "v0.6.0") fail("BAD_INDEX_VERSION");
if (index.status !== "PUBLIC_VERIFICATION_INDEXED") fail("BAD_STATUS");
if (!index.verification_index_url.endsWith("/verification/PUBLIC_VERIFICATION_INDEX.json")) fail("BAD_INDEX_URL");
if (!index.network_verification_seal_url.endsWith("/verification/PUBLIC_NETWORK_VERIFICATION_SEAL.json")) fail("BAD_NETWORK_SEAL_URL");

for (const rel of ["v0.1.0","v0.2.0","v0.3.0","v0.4.0","v0.4.1","v0.4.2","v0.5.0","v0.5.1"]) {
  if (!index.verified_release_chain.includes(rel)) fail(`MISSING_RELEASE_${rel.replaceAll(".", "_")}`);
}

if (!index.public_surfaces) fail("MISSING_PUBLIC_SURFACES");
if (!Array.isArray(index.public_surfaces.truth_frames) || index.public_surfaces.truth_frames.length !== 4) fail("BAD_TRUTH_FRAME_COUNT");
if (!Array.isArray(index.public_surfaces.controls) || index.public_surfaces.controls.length < 5) fail("BAD_CONTROL_SURFACE_COUNT");
if (!Array.isArray(index.public_surfaces.seals) || index.public_surfaces.seals.length < 3) fail("BAD_SEAL_COUNT");

for (const frame of index.public_surfaces.truth_frames) {
  if (!frame.id || !frame.render || !frame.case || !frame.proof) fail(`BAD_FRAME_ENTRY_${frame.id || "UNKNOWN"}`);
}

if (!index.required_commands.includes("npm run verify:verification-index")) fail("MISSING_REQUIRED_COMMAND");

console.log("TRUTHFRAMER_PUBLIC_VERIFICATION_INDEX_PASS=true");
console.log(`INDEX_VERSION=${index.index_version}`);
console.log(`STATUS=${index.status}`);
console.log(`FRAME_COUNT=${index.public_surfaces.truth_frames.length}`);
