#!/usr/bin/env node
const fs = require("fs");
const crypto = require("crypto");

const VERSION = "v1.4.0";

function fail(message) {
  console.error(`TRUTHFRAMER_TRUTH_FRAME_ADMISSION_CLOSURE_SEAL_FAIL=${message}`);
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

function sha256File(p) {
  if (!fs.existsSync(p)) fail(`MISSING:${p}`);
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

function assertEqual(name, actual, expected) {
  if (actual !== expected) fail(`${name}:${actual}!=${expected}`);
}

const sealPath = "admission/TRUTH_FRAME_ADMISSION_CLOSURE_SEAL.json";
const docsSealPath = "docs/admission/TRUTH_FRAME_ADMISSION_CLOSURE_SEAL.json";
const reportSealPath = "reports/current/truth-frame-admission-closure-seal-v1.4.0.json";

const seal = readJson(sealPath);
const docsSeal = readJson(docsSealPath);
const reportSeal = readJson(reportSealPath);

assertEqual("DOCS_SEAL_MATCH", JSON.stringify(docsSeal), JSON.stringify(seal));
assertEqual("REPORT_SEAL_MATCH", JSON.stringify(reportSeal), JSON.stringify(seal));

assertEqual("VERSION", seal.version, VERSION);
assertEqual("STATUS", seal.status, "TRUTH_FRAME_ADMISSION_LAYER_CLOSED_AND_SEALED");
assertEqual("PRIMARY_OBJECT", seal.primary_object, "truth_frame");
assertEqual("CLOSURE_FUNCTION", seal.closure_function, "positive_admission_plus_negative_refusal");

const gate = readJson("admission/TRUTH_FRAME_ADMISSION_GATE.json");
const refusal = readJson("admission/TRUTH_FRAME_ADMISSION_REFUSAL_PROOF.json");
const v12 = readJson("releases/v1.2.0/RELEASE_LEDGER.json");
const v13 = readJson("releases/v1.3.0/RELEASE_LEDGER.json");

assertEqual("GATE_VERSION", gate.version, "v1.2.0");
assertEqual("GATE_STATUS", gate.status, "TRUTH_FRAME_ADMISSION_GATE_CLOSED");
assertEqual("REFUSAL_VERSION", refusal.version, "v1.3.0");
assertEqual("REFUSAL_STATUS", refusal.status, "TRUTH_FRAME_ADMISSION_REFUSAL_PROVEN");
assertEqual("REFUSAL_FAILED_SCENARIO_COUNT", String(refusal.failed_scenario_count), "0");

assertEqual("SEALED_GATE_FILE_SHA256", seal.sealed_inputs.admission_gate.file_sha256, sha256File("admission/TRUTH_FRAME_ADMISSION_GATE.json"));
assertEqual("SEALED_REFUSAL_FILE_SHA256", seal.sealed_inputs.admission_refusal_proof.file_sha256, sha256File("admission/TRUTH_FRAME_ADMISSION_REFUSAL_PROOF.json"));
assertEqual("SEALED_V12_LEDGER_SHA256", seal.sealed_inputs.release_ledgers.v1_2_0.file_sha256, sha256File("releases/v1.2.0/RELEASE_LEDGER.json"));
assertEqual("SEALED_V13_LEDGER_SHA256", seal.sealed_inputs.release_ledgers.v1_3_0.file_sha256, sha256File("releases/v1.3.0/RELEASE_LEDGER.json"));

assertEqual("SEALED_V12_STATUS", seal.sealed_inputs.release_ledgers.v1_2_0.status, v12.status);
assertEqual("SEALED_V13_STATUS", seal.sealed_inputs.release_ledgers.v1_3_0.status, v13.status);

const verifyAll = readJson("package.json").scripts["verify:all"] || "";
for (const needle of [
  "npm run verify:truth-frame-admission",
  "npm run verify:truth-frame-admission-network",
  "npm run verify:truth-frame-admission-refusal",
  "npm run verify:truth-frame-admission-refusal-network",
  "npm run verify:truth-frame-admission-closure"
]) {
  if (!verifyAll.includes(needle)) fail(`VERIFY_ALL_MISSING:${needle}`);
}

const { closure_seal_sha256, ...core } = seal;
assertEqual("CLOSURE_SEAL_SHA256", closure_seal_sha256, sha256Text(JSON.stringify(core, null, 2)));

console.log("TRUTHFRAMER_TRUTH_FRAME_ADMISSION_CLOSURE_SEAL_PASS=true");
console.log(`VERSION=${VERSION}`);
console.log(`STATUS=${seal.status}`);
console.log(`CLOSURE_SEAL_SHA256=${seal.closure_seal_sha256}`);
