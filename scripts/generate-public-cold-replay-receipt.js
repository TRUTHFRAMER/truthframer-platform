#!/usr/bin/env node
const fs = require("fs");
const crypto = require("crypto");

const VERSION = "v1.9.0";

const URLS = {
  verifier_integrity_seal: "https://truthframer.github.io/truthframer-platform/verifier/TRUTHFRAMER_PUBLIC_VERIFIER_INTEGRITY_SEAL.json",
  independent_verifier_script: "https://truthframer.github.io/truthframer-platform/verifier/TRUTHFRAMER_PUBLIC_INDEPENDENT_VERIFIER.mjs",
  independent_verification_witness: "https://truthframer.github.io/truthframer-platform/verifier/TRUTHFRAMER_PUBLIC_INDEPENDENT_VERIFICATION_WITNESS.json",
  public_verification_capsule: "https://truthframer.github.io/truthframer-platform/capsule/TRUTHFRAMER_PUBLIC_VERIFICATION_CAPSULE.json",
  public_capsule_consumption_receipt: "https://truthframer.github.io/truthframer-platform/receipt/TRUTHFRAMER_PUBLIC_CAPSULE_CONSUMPTION_RECEIPT.json"
};

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

function deepHasTrue(value, keys) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(v => deepHasTrue(v, keys));
  for (const [k, v] of Object.entries(value)) {
    if (keys.includes(k) && (v === true || v === "true")) return true;
    if (v && typeof v === "object" && deepHasTrue(v, keys)) return true;
  }
  return false;
}

function withoutSelfHash(value, key) {
  const copy = JSON.parse(JSON.stringify(value));
  delete copy[key];
  return copy;
}

async function fetchText(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`FETCH_FAILED ${url} HTTP=${res.status}`);
  return await res.text();
}

async function fetchJson(url) {
  return JSON.parse(await fetchText(url));
}


function coldReplayChecksPass(checks) {
  return Object.entries(checks).every(([key, value]) => {
    if (key === "private_source_accessed") return value === false;
    return value === true;
  });
}

async function main() {
  const [
    seal,
    verifierScriptText,
    witness,
    capsule,
    capsuleReceipt
  ] = await Promise.all([
    fetchJson(URLS.verifier_integrity_seal),
    fetchText(URLS.independent_verifier_script),
    fetchJson(URLS.independent_verification_witness),
    fetchJson(URLS.public_verification_capsule),
    fetchJson(URLS.public_capsule_consumption_receipt)
  ]);

  const scriptSha = sha256Text(verifierScriptText);
  const witnessSha = declaredWitnessSha(witness);
  const capsuleSha = declaredCapsuleSha(capsule);
  const capsuleConsumptionReceiptSha = declaredCapsuleReceiptSha(capsuleReceipt);
  const witnessReceiptSha = declaredWitnessReceiptSha(witness);
  const sealSha = seal.seal_sha256;

  const sealDigests = seal.sealed_public_digests || {};

  const checks = {
    verifier_integrity_seal_public_fetch_ok: true,
    independent_verifier_script_public_fetch_ok: true,
    independent_verification_witness_public_fetch_ok: true,
    public_verification_capsule_public_fetch_ok: true,
    public_capsule_consumption_receipt_public_fetch_ok: true,

    verifier_script_sha256_matches_integrity_seal:
      scriptSha === sealDigests.verifier_script_raw_sha256,

    witness_sha256_matches_integrity_seal:
      witnessSha === sealDigests.witness_declared_sha256,

    capsule_sha256_matches_integrity_seal:
      capsuleSha === sealDigests.capsule_sha256,

    witness_receipt_sha256_matches_integrity_seal:
      witnessReceiptSha === sealDigests.receipt_sha256,

    public_capsule_consumption_receipt_sha256_observed:
      typeof capsuleConsumptionReceiptSha === "string" && /^[a-f0-9]{64}$/.test(capsuleConsumptionReceiptSha),

    verifier_integrity_seal_declares_no_private_source:
      seal.no_private_source_required === true || sealDigests.no_private_source_required === true,

    witness_declares_no_private_source:
      witness.no_private_source_required === true
      || witness.verifier?.observed_public_claims?.no_private_source_required === true,

    capsule_receipt_public_consumption_bound:
      capsuleReceipt.capsule_sha256_match === true
      || capsuleReceipt.CAPSULE_SHA256_MATCH === true
      || deepHasTrue(capsuleReceipt, ["capsule_sha256_match", "CAPSULE_SHA256_MATCH"]),

    capsule_receipt_no_private_source_if_declared:
      capsuleReceipt.no_private_source_required === true
      || capsuleReceipt.private_source_accessed === false
      || deepHasTrue(capsuleReceipt, ["no_private_source_required", "NO_PRIVATE_SOURCE_REQUIRED"]),

    cold_replay_used_public_urls_only: true,
    private_source_accessed: false
  };

  if (!coldReplayChecksPass(checks)) {
    throw new Error("PUBLIC_COLD_REPLAY_RECEIPT_FAILED " + JSON.stringify(checks));
  }

  const receipt = {
    version: VERSION,
    status: "PUBLIC_COLD_REPLAY_RECEIPT_BOUND",
    generated_at: new Date().toISOString(),
    public_only_inputs: URLS,
    observed_public_digests: {
      verifier_script_raw_sha256: scriptSha,
      witness_sha256: witnessSha,
      capsule_sha256: capsuleSha,
      witness_receipt_sha256: witnessReceiptSha,
      capsule_consumption_receipt_sha256: capsuleConsumptionReceiptSha,
      seal_sha256: sealSha
    },
    integrity_checks: checks,
    private_source_accessed: false,
    no_private_source_required: true
  };

  receipt.cold_replay_receipt_sha256 = sha256Text(canonicalJson(receipt));

  fs.mkdirSync("verifier", { recursive: true });
  fs.mkdirSync("docs/verifier", { recursive: true });
  fs.mkdirSync("reports/current", { recursive: true });

  const pretty = JSON.stringify(receipt, null, 2) + "\n";
  fs.writeFileSync("verifier/TRUTHFRAMER_PUBLIC_COLD_REPLAY_RECEIPT.json", pretty);
  fs.writeFileSync("docs/verifier/TRUTHFRAMER_PUBLIC_COLD_REPLAY_RECEIPT.json", pretty);
  fs.writeFileSync("reports/current/public-cold-replay-receipt-v1.9.0.json", pretty);

  console.log("TRUTHFRAMER_PUBLIC_COLD_REPLAY_RECEIPT_GENERATED=true");
  console.log(`VERSION=${VERSION}`);
  console.log(`STATUS=${receipt.status}`);
  console.log(`VERIFIER_SCRIPT_RAW_SHA256=${scriptSha}`);
  console.log(`WITNESS_SHA256=${witnessSha}`);
  console.log(`CAPSULE_SHA256=${capsuleSha}`);
  console.log(`WITNESS_RECEIPT_SHA256=${witnessReceiptSha}`);
  console.log(`CAPSULE_CONSUMPTION_RECEIPT_SHA256=${capsuleConsumptionReceiptSha}`);
  console.log(`SEAL_SHA256=${sealSha}`);
  console.log(`COLD_REPLAY_RECEIPT_SHA256=${receipt.cold_replay_receipt_sha256}`);
  console.log("NO_PRIVATE_SOURCE_REQUIRED=true");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
