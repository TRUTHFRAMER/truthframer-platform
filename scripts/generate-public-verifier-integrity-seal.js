#!/usr/bin/env node
"use strict";

const fs = require("fs");
const crypto = require("crypto");

const VERSION = "v1.8.0";
const VERIFIER_SCRIPT_URL = "https://truthframer.github.io/truthframer-platform/verifier/TRUTHFRAMER_PUBLIC_INDEPENDENT_VERIFIER.mjs";
const WITNESS_URL = "https://truthframer.github.io/truthframer-platform/verifier/TRUTHFRAMER_PUBLIC_INDEPENDENT_VERIFICATION_WITNESS.json";

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  return "{" + Object.keys(value).sort().map((k) => JSON.stringify(k) + ":" + stableStringify(value[k])).join(",") + "}";
}

function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

async function fetchText(url) {
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  if (!res.ok) throw new Error(`PUBLIC_FETCH_FAILED url=${url} status=${res.status}`);
  return { status: res.status, text };
}

async function main() {
  const script = await fetchText(VERIFIER_SCRIPT_URL);
  const witnessResponse = await fetchText(WITNESS_URL);
  const witness = JSON.parse(witnessResponse.text);

  const verifierScriptRawSha256 = sha256Hex(script.text);
  const witnessRawSha256 = sha256Hex(witnessResponse.text);
  const witnessCanonicalSha256 = sha256Hex(stableStringify(witness));

  const expectedWitnessSha256 = witness.witness_sha256;
  if (!/^[a-f0-9]{64}$/i.test(expectedWitnessSha256)) {
    throw new Error("WITNESS_SHA256_MISSING_OR_INVALID");
  }

  const seal = {
    protocol: "TRUTHFRAMER_PUBLIC_VERIFIER_INTEGRITY_SEAL",
    version: VERSION,
    status: "PUBLIC_VERIFIER_INTEGRITY_SEALED",
    public_inputs: {
      verifier_script_url: VERIFIER_SCRIPT_URL,
      independent_verification_witness_url: WITNESS_URL
    },
    public_fetch: {
      verifier_script_public_fetch_ok: script.status === 200,
      witness_public_fetch_ok: witnessResponse.status === 200
    },
    sealed_public_digests: {
      verifier_script_raw_sha256: verifierScriptRawSha256,
      witness_raw_bytes_sha256: witnessRawSha256,
      witness_canonical_json_sha256: witnessCanonicalSha256,
      witness_declared_sha256: expectedWitnessSha256,
      capsule_sha256: witness.verifier.observed_public_claims.capsule_sha256,
      receipt_sha256: witness.verifier.observed_public_claims.receipt_sha256,
      receipt_sha256_basis: witness.verifier.observed_public_claims.receipt_sha256_basis,
      no_private_source_required: witness.no_private_source_required === true || witness.verifier?.observed_public_claims?.no_private_source_required === true
    },
    assertions: {
      verifier_script_public_fetch_ok: script.status === 200,
      witness_public_fetch_ok: witnessResponse.status === 200,
      witness_declares_sha256: /^[a-f0-9]{64}$/i.test(expectedWitnessSha256),
      witness_status_bound: witness.status === "PUBLIC_INDEPENDENT_VERIFICATION_WITNESS_BOUND",
      verifier_status_pass: witness.verifier.status === "PUBLIC_INDEPENDENT_VERIFICATION_PASS",
      no_private_source_required: witness.no_private_source_required === true || witness.verifier?.observed_public_claims?.no_private_source_required === true
    }
  };

  seal.seal_sha256 = sha256Hex(stableStringify(seal));

  if (!Object.values(seal.assertions).every(Boolean)) {
    throw new Error("PUBLIC_VERIFIER_INTEGRITY_SEAL_FAILED " + JSON.stringify(seal.assertions));
  }

  fs.mkdirSync("docs/verifier", { recursive: true });
  fs.mkdirSync("verifier", { recursive: true });
  fs.mkdirSync("reports/current", { recursive: true });

  const text = JSON.stringify(seal, null, 2) + "\n";
  fs.writeFileSync("docs/verifier/TRUTHFRAMER_PUBLIC_VERIFIER_INTEGRITY_SEAL.json", text);
  fs.writeFileSync("verifier/TRUTHFRAMER_PUBLIC_VERIFIER_INTEGRITY_SEAL.json", text);
  fs.writeFileSync("reports/current/public-verifier-integrity-seal-v1.8.0.json", text);

  console.log("TRUTHFRAMER_PUBLIC_VERIFIER_INTEGRITY_SEAL_GENERATED=true");
  console.log("VERSION=" + VERSION);
  console.log("STATUS=" + seal.status);
  console.log("VERIFIER_SCRIPT_RAW_SHA256=" + verifierScriptRawSha256);
  console.log("WITNESS_SHA256=" + expectedWitnessSha256);
  console.log("SEAL_SHA256=" + seal.seal_sha256);
  console.log("NO_PRIVATE_SOURCE_REQUIRED=true");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
