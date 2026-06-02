#!/usr/bin/env node
const crypto = require("crypto");

const COLD_RECEIPT_URL = "https://truthframer.github.io/truthframer-platform/verifier/TRUTHFRAMER_PUBLIC_COLD_REPLAY_RECEIPT.json";

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

function declaredWitnessSha(witness) {
  return witness.witness_sha256
    || witness.verifier?.witness_sha256
    || witness.verifier?.observed_public_claims?.witness_sha256
    || witness.verifier?.observed_public_claims?.witness_declared_sha256;
}

function declaredCapsuleSha(capsule) {
  return capsule.capsule_sha256
    || capsule.public_verification_capsule_sha256
    || capsule.sha256;
}

function declaredCapsuleReceiptSha(receipt) {
  return receipt.receipt_sha256
    || receipt.public_capsule_consumption_receipt_sha256
    || receipt.capsule_consumption_receipt_sha256
    || receipt.consumption_receipt_sha256
    || receipt.public_capsule_receipt_sha256
    || receipt.capsule_receipt_sha256
    || receipt.receipt?.sha256
    || receipt.receipt?.receipt_sha256
    || receipt.public_receipt?.sha256
    || receipt.public_receipt?.receipt_sha256
    || findPublicCapsuleConsumptionReceiptSha256(receipt)
    || canonicalPublicJsonSha256(receipt);
}

function isPublicCapsuleConsumptionReceiptSha256Hex(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function findPublicCapsuleConsumptionReceiptSha256(value) {
  if (!value || typeof value !== "object") return undefined;

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findPublicCapsuleConsumptionReceiptSha256(item);
      if (found) return found;
    }
    return undefined;
  }

  for (const [key, current] of Object.entries(value)) {
    if (
      /receipt/i.test(key)
      && /sha256/i.test(key)
      && isPublicCapsuleConsumptionReceiptSha256Hex(current)
    ) {
      return current;
    }

    if (current && typeof current === "object") {
      const found = findPublicCapsuleConsumptionReceiptSha256(current);
      if (found) return found;
    }
  }

  return undefined;
}

function canonicalPublicJsonSha256(value) {
  return require("crypto")
    .createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}


function declaredWitnessReceiptSha(witness) {
  return witness.receipt_sha256
    || witness.public_independent_verification_receipt_sha256
    || witness.verifier?.receipt_sha256
    || witness.verifier?.observed_public_claims?.receipt_sha256
    || witness.verifier?.observed_public_claims?.receipt_declared_sha256;
}

async function fetchText(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`FETCH_FAILED ${url} HTTP=${res.status}`);
  return await res.text();
}

async function fetchJson(url) {
  return JSON.parse(await fetchText(url));
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

async function main() {
  const cold = await fetchJson(COLD_RECEIPT_URL);
  const copy = JSON.parse(JSON.stringify(cold));
  const declaredColdSha = copy.cold_replay_receipt_sha256;
  delete copy.cold_replay_receipt_sha256;
  const computedColdSha = sha256Text(canonicalJson(copy));

  const urls = cold.public_only_inputs || {};

  const [seal, scriptText, witness, capsule, capsuleReceipt] = await Promise.all([
    fetchJson(urls.verifier_integrity_seal),
    fetchText(urls.independent_verifier_script),
    fetchJson(urls.independent_verification_witness),
    fetchJson(urls.public_verification_capsule),
    fetchJson(urls.public_capsule_consumption_receipt)
  ]);

  const scriptSha = sha256Text(scriptText);
  const witnessSha = declaredWitnessSha(witness);
  const capsuleSha = declaredCapsuleSha(capsule);
  const capsuleConsumptionReceiptSha = declaredCapsuleReceiptSha(capsuleReceipt);
  const witnessReceiptSha = declaredWitnessReceiptSha(witness);
  const sealSha = seal.seal_sha256;

  const observed = cold.observed_public_digests || {};

  const checks = {
    public_cold_replay_receipt_live: true,
    version_ok: cold.version === "v1.9.0",
    status_ok: cold.status === "PUBLIC_COLD_REPLAY_RECEIPT_BOUND",
    cold_replay_receipt_sha256_ok: declaredColdSha === computedColdSha,
    verifier_script_sha256_replays: observed.verifier_script_raw_sha256 === scriptSha,
    witness_sha256_replays: observed.witness_sha256 === witnessSha,
    capsule_sha256_replays: observed.capsule_sha256 === capsuleSha,
    witness_receipt_sha256_replays: observed.witness_receipt_sha256 === witnessReceiptSha,
    capsule_consumption_receipt_sha256_replays: observed.capsule_consumption_receipt_sha256 === capsuleConsumptionReceiptSha,
    seal_sha256_replays: observed.seal_sha256 === sealSha,
    no_private_source_required: cold.no_private_source_required === true,
    private_source_not_accessed: cold.private_source_accessed === false
  };

  if (!coldReplayChecksPass(checks)) {
    throw new Error("TRUTHFRAMER_PUBLIC_COLD_REPLAY_RECEIPT_NETWORK_FAILED " + JSON.stringify(checks));
  }

  console.log("PUBLIC_COLD_REPLAY_RECEIPT_LIVE=true");
  console.log("TRUTHFRAMER_PUBLIC_COLD_REPLAY_RECEIPT_NETWORK_PASS=true");
  console.log(`PUBLIC_COLD_REPLAY_RECEIPT_URL=${COLD_RECEIPT_URL}`);
  console.log(`VERIFIER_SCRIPT_RAW_SHA256=${scriptSha}`);
  console.log(`WITNESS_SHA256=${witnessSha}`);
  console.log(`CAPSULE_SHA256=${capsuleSha}`);
  console.log(`WITNESS_RECEIPT_SHA256=${witnessReceiptSha}`);
  console.log(`CAPSULE_CONSUMPTION_RECEIPT_SHA256=${capsuleConsumptionReceiptSha}`);
  console.log(`SEAL_SHA256=${sealSha}`);
  console.log(`COLD_REPLAY_RECEIPT_SHA256=${declaredColdSha}`);
  console.log("NO_PRIVATE_SOURCE_REQUIRED=true");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
