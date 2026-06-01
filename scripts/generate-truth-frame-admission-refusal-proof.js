#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { runRefusalHarness, VERSION } = require("./lib/truth-frame-admission-refusal-harness");

function writeJson(p, value) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, `${JSON.stringify(value, null, 2)}\n`);
}

const proof = runRefusalHarness(process.cwd());

writeJson("admission/TRUTH_FRAME_ADMISSION_REFUSAL_PROOF.json", proof);
writeJson("docs/admission/TRUTH_FRAME_ADMISSION_REFUSAL_PROOF.json", proof);
writeJson("reports/current/truth-frame-admission-refusal-proof-v1.3.0.json", proof);

console.log("TRUTHFRAMER_TRUTH_FRAME_ADMISSION_REFUSAL_PROOF_GENERATED=true");
console.log(`VERSION=${VERSION}`);
console.log(`STATUS=${proof.status}`);
console.log(`SCENARIO_COUNT=${proof.scenario_count}`);
console.log(`FAILED_SCENARIO_COUNT=${proof.failed_scenario_count}`);
console.log(`PROOF_SHA256=${proof.proof_sha256}`);

if (proof.status !== "TRUTH_FRAME_ADMISSION_REFUSAL_PROVEN") {
  process.exit(1);
}
