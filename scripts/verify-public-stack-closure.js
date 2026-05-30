#!/usr/bin/env node
const fs = require("fs");

function fail(code) {
  console.error(`TRUTHFRAMER_PUBLIC_STACK_CLOSURE_FAIL=${code}`);
  process.exit(1);
}
function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
function hasUrl(list, url) {
  return list.some(x => x.url === url);
}

const PUBLIC_URL = "https://truthframer.github.io/truthframer-platform";
const closure = readJson("docs/verification/PUBLIC_STACK_CLOSURE.json");
const pkg = readJson("package.json");

if (closure.object_type !== "TRUTHFRAMER_PUBLIC_STACK_CLOSURE") fail("BAD_OBJECT_TYPE");
if (closure.closure_version !== "v0.8.0") fail("BAD_VERSION");
if (closure.status !== "TOTAL_PUBLIC_STACK_CLOSED") fail("BAD_STATUS");

if (!Array.isArray(closure.frames) || closure.frames.length !== 4) fail("FRAME_COUNT_NOT_FOUR");
if (!Array.isArray(closure.releases) || closure.releases.length !== 11) fail("RELEASE_COUNT_NOT_ELEVEN");
if (!closure.releases.some(r => r.version === "v0.7.0")) fail("V070_RELEASE_NOT_CLOSED");

const ids = closure.frames.map(f => f.truth_frame_id).sort();
const expectedIds = ["tf_000001", "tf_000002", "tf_000003", "tf_000004"];
if (JSON.stringify(ids) !== JSON.stringify(expectedIds)) fail(`BAD_FRAME_IDS:${ids.join(",")}`);

const tf1 = closure.frames.find(f => f.truth_frame_id === "tf_000001");
if (!tf1 || tf1.render_url !== `${PUBLIC_URL}/render/`) fail("TF000001_CANONICAL_ROUTE_FAIL");

const requiredUrls = [
  `${PUBLIC_URL}/`,
  `${PUBLIC_URL}/frames/`,
  `${PUBLIC_URL}/registry/TRUTH_FRAME_REGISTRY.json`,
  `${PUBLIC_URL}/status/truthframer-system-status.json`,
  `${PUBLIC_URL}/audit/PUBLIC_SYSTEM_AUDIT_SEAL.json`,
  `${PUBLIC_URL}/audit/REPOSITORY_HARDENING_SEAL.json`,
  `${PUBLIC_URL}/verification/`,
  `${PUBLIC_URL}/verification/PUBLIC_NETWORK_VERIFICATION_SEAL.json`,
  `${PUBLIC_URL}/verification/PUBLIC_VERIFICATION_INDEX.json`,
  `${PUBLIC_URL}/verification/PUBLIC_VERIFICATION_INDEX_SEAL.json`,
  `${PUBLIC_URL}/verification/PUBLIC_VERIFICATION_ATLAS.json`,
  `${PUBLIC_URL}/verification/PUBLIC_VERIFICATION_ATLAS_SEAL.json`,
  `${PUBLIC_URL}/verification/PUBLIC_STACK_CLOSURE.json`,
  `${PUBLIC_URL}/verification/PUBLIC_STACK_CLOSURE_SEAL.json`
];

for (const url of requiredUrls) {
  if (!hasUrl(closure.public_surfaces, url)) fail(`MISSING_PUBLIC_SURFACE:${url}`);
}

for (const frame of closure.frames) {
  for (const url of [
    frame.render_url,
    frame.truth_frame_url,
    frame.source_manifest_url,
    frame.replay_manifest_url,
    frame.public_surface_proof_url
  ]) {
    if (!hasUrl(closure.frame_artifacts, url)) fail(`MISSING_FRAME_ARTIFACT:${url}`);
  }
}

const scripts = pkg.scripts || {};
for (const gate of closure.gate_scripts) {
  if (!gate.present) fail(`GATE_FILE_MISSING:${gate.file}`);
  if (!scripts[gate.script]) fail(`PACKAGE_SCRIPT_MISSING:${gate.script}`);
}
if (!scripts["verify:all"].includes("verify:stack-closure")) fail("VERIFY_ALL_MISSING_STACK_CLOSURE");
if (!scripts["verify:all"].includes("verify:stack-closure-seal")) fail("VERIFY_ALL_MISSING_STACK_CLOSURE_SEAL");

for (const report of closure.governance_reports) {
  if (!report.present) fail(`GOVERNANCE_REPORT_MISSING:${report.file}`);
}

const protectionText = fs.readFileSync("reports/current/main-branch-protection-v0.8.0.json", "utf8");
if (!protectionText.includes("required_status_checks")) fail("BRANCH_PROTECTION_STATUS_CHECKS_NOT_RECORDED");
if (!protectionText.includes("required_pull_request_reviews")) fail("BRANCH_PROTECTION_REVIEWS_NOT_RECORDED");
if (!protectionText.includes("enforce_admins")) fail("BRANCH_PROTECTION_ADMIN_ENFORCEMENT_NOT_RECORDED");

console.log("TRUTHFRAMER_PUBLIC_STACK_CLOSURE_PASS=true");
console.log(`CLOSURE_VERSION=${closure.closure_version}`);
console.log(`STATUS=${closure.status}`);
console.log(`FRAME_COUNT=${closure.counts.frame_count}`);
console.log(`RELEASE_COUNT=${closure.counts.release_count}`);
console.log(`TOTAL_PUBLIC_ARTIFACT_COUNT=${closure.counts.total_public_artifact_count}`);
