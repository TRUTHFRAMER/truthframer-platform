#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const VERSION = "v1.4.0";

function fail(message) {
  console.error(`TRUTHFRAMER_TRUTH_FRAME_ADMISSION_CLOSURE_SEAL_GENERATE_FAIL=${message}`);
  process.exit(1);
}

function readJson(p) {
  if (!fs.existsSync(p)) fail(`MISSING:${p}`);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, value) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, `${JSON.stringify(value, null, 2)}\n`);
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(Buffer.from(text, "utf8")).digest("hex");
}

function sha256File(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

const gatePath = "admission/TRUTH_FRAME_ADMISSION_GATE.json";
const refusalPath = "admission/TRUTH_FRAME_ADMISSION_REFUSAL_PROOF.json";
const v12LedgerPath = "releases/v1.2.0/RELEASE_LEDGER.json";
const v13LedgerPath = "releases/v1.3.0/RELEASE_LEDGER.json";

const gate = readJson(gatePath);
const refusal = readJson(refusalPath);
const v12 = readJson(v12LedgerPath);
const v13 = readJson(v13LedgerPath);

if (gate.version !== "v1.2.0") fail(`GATE_VERSION:${gate.version}`);
if (gate.status !== "TRUTH_FRAME_ADMISSION_GATE_CLOSED") fail(`GATE_STATUS:${gate.status}`);
if (refusal.version !== "v1.3.0") fail(`REFUSAL_VERSION:${refusal.version}`);
if (refusal.status !== "TRUTH_FRAME_ADMISSION_REFUSAL_PROVEN") fail(`REFUSAL_STATUS:${refusal.status}`);
if (refusal.failed_scenario_count !== 0) fail(`REFUSAL_FAILED_SCENARIO_COUNT:${refusal.failed_scenario_count}`);

const verifyAll = readJson("package.json").scripts["verify:all"] || "";
for (const needle of [
  "npm run verify:truth-frame-admission",
  "npm run verify:truth-frame-admission-network",
  "npm run verify:truth-frame-admission-refusal",
  "npm run verify:truth-frame-admission-refusal-network"
]) {
  if (!verifyAll.includes(needle)) fail(`VERIFY_ALL_MISSING:${needle}`);
}

const core = {
  version: VERSION,
  status: "TRUTH_FRAME_ADMISSION_LAYER_CLOSED_AND_SEALED",
  primary_object: "truth_frame",
  closure_function: "positive_admission_plus_negative_refusal",
  base_release: "v1.3.0",
  sealed_inputs: {
    admission_gate: {
      version: gate.version,
      status: gate.status,
      admitted_truth_frame_count: gate.admitted_truth_frame_count,
      gate_sha256: gate.gate_sha256 || gate.GATE_SHA256 || null,
      file_sha256: sha256File(gatePath)
    },
    admission_refusal_proof: {
      version: refusal.version,
      status: refusal.status,
      scenario_count: refusal.scenario_count,
      failed_scenario_count: refusal.failed_scenario_count,
      proof_sha256: refusal.proof_sha256,
      file_sha256: sha256File(refusalPath)
    },
    release_ledgers: {
      v1_2_0: {
        status: v12.status,
        main_sha: v12.main_sha,
        pages_sha: v12.pages_sha,
        file_sha256: sha256File(v12LedgerPath)
      },
      v1_3_0: {
        status: v13.status,
        main_sha: v13.main_sha,
        pages_sha: v13.pages_sha,
        file_sha256: sha256File(v13LedgerPath)
      }
    }
  },
  invariants: [
    "The admission gate exists as a sealed positive admission object.",
    "The refusal proof exists as a sealed adversarial negative-control object.",
    "Both admission and refusal are included in verify:all.",
    "Both admission and refusal have public network verifiers.",
    "The admission layer is closed only if both admission and refusal remain live and internally consistent."
  ]
};

const seal = {
  ...core,
  closure_seal_sha256: sha256Text(JSON.stringify(core, null, 2))
};

writeJson("admission/TRUTH_FRAME_ADMISSION_CLOSURE_SEAL.json", seal);
writeJson("docs/admission/TRUTH_FRAME_ADMISSION_CLOSURE_SEAL.json", seal);
writeJson("reports/current/truth-frame-admission-closure-seal-v1.4.0.json", seal);

console.log("TRUTHFRAMER_TRUTH_FRAME_ADMISSION_CLOSURE_SEAL_GENERATED=true");
console.log(`VERSION=${VERSION}`);
console.log(`STATUS=${seal.status}`);
console.log(`CLOSURE_SEAL_SHA256=${seal.closure_seal_sha256}`);
