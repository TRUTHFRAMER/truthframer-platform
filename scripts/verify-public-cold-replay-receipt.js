#!/usr/bin/env node
const fs = require("fs");
const crypto = require("crypto");

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map(k => [k, sortValue(value[k])]));
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(sortValue(value));
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}



function coldReplayIntegrityChecksPass(integrityChecks) {
  return Object.entries(integrityChecks || {}).every(([key, value]) => {
    if (key === "private_source_accessed") return value === false;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return coldReplayIntegrityChecksPass(value);
    }
    return value === true;
  });
}

function coldReplayChecksPass(checks) {
  return Object.entries(checks).every(([key, value]) => {
    if (key === "private_source_accessed") return value === false;
    return value === true;
  });
}

function main() {
  const path = "verifier/TRUTHFRAMER_PUBLIC_COLD_REPLAY_RECEIPT.json";
  const receipt = JSON.parse(fs.readFileSync(path, "utf8"));

  const declared = receipt.cold_replay_receipt_sha256;
  const copy = JSON.parse(JSON.stringify(receipt));
  delete copy.cold_replay_receipt_sha256;
  const computed = sha256Text(canonicalJson(copy));

  const checks = {
    version_ok: receipt.version === "v1.9.0",
    status_ok: receipt.status === "PUBLIC_COLD_REPLAY_RECEIPT_BOUND",
    receipt_sha256_ok: declared === computed,
    no_private_source_required: receipt.no_private_source_required === true,
    private_source_not_accessed: receipt.private_source_accessed === false,
    integrity_checks_all_true: coldReplayIntegrityChecksPass(receipt.integrity_checks || {})
  };

  if (!coldReplayChecksPass(checks)) {
    throw new Error("TRUTHFRAMER_PUBLIC_COLD_REPLAY_RECEIPT_VERIFY_FAILED " + JSON.stringify(checks));
  }

  console.log("TRUTHFRAMER_PUBLIC_COLD_REPLAY_RECEIPT_PASS=true");
  console.log(`VERSION=${receipt.version}`);
  console.log(`STATUS=${receipt.status}`);
  console.log(`VERIFIER_SCRIPT_RAW_SHA256=${receipt.observed_public_digests.verifier_script_raw_sha256}`);
  console.log(`WITNESS_SHA256=${receipt.observed_public_digests.witness_sha256}`);
  console.log(`CAPSULE_SHA256=${receipt.observed_public_digests.capsule_sha256}`);
  console.log(`WITNESS_RECEIPT_SHA256=${receipt.observed_public_digests.witness_receipt_sha256}`);
  console.log(`CAPSULE_CONSUMPTION_RECEIPT_SHA256=${receipt.observed_public_digests.capsule_consumption_receipt_sha256}`);
  console.log(`SEAL_SHA256=${receipt.observed_public_digests.seal_sha256}`);
  console.log(`COLD_REPLAY_RECEIPT_SHA256=${receipt.cold_replay_receipt_sha256}`);
  console.log("NO_PRIVATE_SOURCE_REQUIRED=true");
}

main();
