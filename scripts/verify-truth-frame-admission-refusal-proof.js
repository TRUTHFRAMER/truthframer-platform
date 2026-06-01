#!/usr/bin/env node
const fs = require("fs");
const crypto = require("crypto");
const { runRefusalHarness, VERSION } = require("./lib/truth-frame-admission-refusal-harness");

function fail(message) {
  console.error(`TRUTHFRAMER_TRUTH_FRAME_ADMISSION_REFUSAL_PROOF_FAIL=${message}`);
  process.exit(1);
}

function readJson(p) {
  if (!fs.existsSync(p)) fail(`MISSING:${p}`);
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (error) {
    fail(`INVALID_JSON:${p}:${error.message}`);
  }
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(Buffer.from(text, "utf8")).digest("hex");
}

function assertEqual(name, actual, expected) {
  if (actual !== expected) fail(`${name}:${actual}!=${expected}`);
}

const proof = readJson("admission/TRUTH_FRAME_ADMISSION_REFUSAL_PROOF.json");
const docsProof = readJson("docs/admission/TRUTH_FRAME_ADMISSION_REFUSAL_PROOF.json");
const reportProof = readJson("reports/current/truth-frame-admission-refusal-proof-v1.3.0.json");

assertEqual("DOCS_PROOF_MATCH", JSON.stringify(docsProof), JSON.stringify(proof));
assertEqual("REPORT_PROOF_MATCH", JSON.stringify(reportProof), JSON.stringify(proof));
assertEqual("VERSION", proof.version, VERSION);
assertEqual("STATUS", proof.status, "TRUTH_FRAME_ADMISSION_REFUSAL_PROVEN");
assertEqual("SCENARIO_COUNT", String(proof.scenario_count), "5");
assertEqual("FAILED_SCENARIO_COUNT", String(proof.failed_scenario_count), "0");

for (const scenario of proof.scenarios || []) {
  if (scenario.observed_failure !== true) fail(`SCENARIO_DID_NOT_FAIL:${scenario.id}`);
  if (scenario.expected_token_present !== true) fail(`EXPECTED_TOKEN_MISSING:${scenario.id}`);
  if (scenario.refusal_pass !== true) fail(`REFUSAL_NOT_PROVEN:${scenario.id}`);
}

const { proof_sha256, ...core } = proof;
assertEqual("PROOF_SHA256", proof_sha256, sha256Text(JSON.stringify(core, null, 2)));

const live = runRefusalHarness(process.cwd());
const { proof_sha256: liveProofSha, ...liveCore } = live;
const { proof_sha256: storedProofSha, ...storedCore } = proof;

assertEqual("LIVE_REFUSAL_STATUS", live.status, "TRUTH_FRAME_ADMISSION_REFUSAL_PROVEN");
assertEqual("LIVE_PROOF_SHA256", liveProofSha, storedProofSha);
assertEqual("LIVE_PROOF_CORE", JSON.stringify(liveCore), JSON.stringify(storedCore));

console.log("TRUTHFRAMER_TRUTH_FRAME_ADMISSION_REFUSAL_PROOF_PASS=true");
console.log(`VERSION=${VERSION}`);
console.log(`STATUS=${proof.status}`);
console.log(`SCENARIO_COUNT=${proof.scenario_count}`);
console.log(`PROOF_SHA256=${proof.proof_sha256}`);
