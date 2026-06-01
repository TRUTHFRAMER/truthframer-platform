#!/usr/bin/env node
"use strict";

const fs = require("fs");
const crypto = require("crypto");

const SEAL_URL = "https://truthframer.github.io/truthframer-platform/verifier/TRUTHFRAMER_PUBLIC_VERIFIER_INTEGRITY_SEAL.json";
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

function withoutSealSha(seal) {
  const clone = JSON.parse(JSON.stringify(seal));
  delete clone.seal_sha256;
  return clone;
}

async function fetchText(url) {
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  if (!res.ok) throw new Error(`PUBLIC_FETCH_FAILED url=${url} status=${res.status}`);
  return { status: res.status, text };
}

async function main() {
  const sealResponse = await fetchText(SEAL_URL);
  const scriptResponse = await fetchText(VERIFIER_SCRIPT_URL);
  const witnessResponse = await fetchText(WITNESS_URL);

  const publicSeal = JSON.parse(sealResponse.text);
  const localSeal = JSON.parse(fs.readFileSync("verifier/TRUTHFRAMER_PUBLIC_VERIFIER_INTEGRITY_SEAL.json", "utf8"));

  const publicSealExpectedSha = sha256Hex(stableStringify(withoutSealSha(publicSeal)));
  const scriptSha = sha256Hex(scriptResponse.text);
  const witness = JSON.parse(witnessResponse.text);

  const assertions = {
    public_seal_live: sealResponse.status === 200,
    public_verifier_script_live: scriptResponse.status === 200,
    public_witness_live: witnessResponse.status === 200,
    public_seal_matches_local: stableStringify(publicSeal) === stableStringify(localSeal),
    seal_sha256_valid: publicSeal.seal_sha256 === publicSealExpectedSha,
    verifier_script_sha256_matches_seal: publicSeal.sealed_public_digests.verifier_script_raw_sha256 === scriptSha,
    witness_sha256_matches_seal: publicSeal.sealed_public_digests.witness_declared_sha256 === witness.witness_sha256,
    witness_verifier_pass: witness.verifier.status === "PUBLIC_INDEPENDENT_VERIFICATION_PASS",
    no_private_source_required: publicSeal.assertions.no_private_source_required === true
  };

  if (!Object.values(assertions).every(Boolean)) {
    throw new Error("PUBLIC_VERIFIER_INTEGRITY_SEAL_NETWORK_FAILED " + JSON.stringify(assertions));
  }

  console.log("PUBLIC_VERIFIER_INTEGRITY_SEAL_LIVE=true");
  console.log("TRUTHFRAMER_PUBLIC_VERIFIER_INTEGRITY_SEAL_NETWORK_PASS=true");
  console.log("PUBLIC_VERIFIER_INTEGRITY_SEAL_URL=" + SEAL_URL);
  console.log("PUBLIC_INDEPENDENT_VERIFIER_SCRIPT_URL=" + VERIFIER_SCRIPT_URL);
  console.log("PUBLIC_INDEPENDENT_VERIFICATION_WITNESS_URL=" + WITNESS_URL);
  console.log("VERIFIER_SCRIPT_RAW_SHA256=" + scriptSha);
  console.log("WITNESS_SHA256=" + witness.witness_sha256);
  console.log("SEAL_SHA256=" + publicSeal.seal_sha256);
  console.log("NO_PRIVATE_SOURCE_REQUIRED=true");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
