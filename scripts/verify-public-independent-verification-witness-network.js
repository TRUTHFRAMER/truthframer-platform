#!/usr/bin/env node
const path = require("path");

const WITNESS_URL =
  "https://truthframer.github.io/truthframer-platform/verifier/TRUTHFRAMER_PUBLIC_INDEPENDENT_VERIFICATION_WITNESS.json";
const VERIFIER_SCRIPT_URL =
  "https://truthframer.github.io/truthframer-platform/verifier/TRUTHFRAMER_PUBLIC_INDEPENDENT_VERIFIER.mjs";

async function fetchText(url) {
  const response = await fetch(url, { cache: "no-store" });
  const text = await response.text();
  if (!response.ok) throw new Error(`PUBLIC_FETCH_FAILED url=${url} status=${response.status}`);
  return text;
}

async function main() {
  const modulePath = path.resolve("docs/verifier/TRUTHFRAMER_PUBLIC_INDEPENDENT_VERIFIER.mjs");
  const { verifyTruthframerPublicIndependently, stableStringify, sha256Hex } = await import(modulePath);

  const witnessText = await fetchText(WITNESS_URL);
  const scriptText = await fetchText(VERIFIER_SCRIPT_URL);

  const witness = JSON.parse(witnessText);
  const declared = witness.witness_sha256;
  const copy = JSON.parse(JSON.stringify(witness));
  delete copy.witness_sha256;
  const observed = await sha256Hex(stableStringify(copy));

  if (declared !== observed) {
    throw new Error(`PUBLIC_WITNESS_SHA256_MISMATCH declared=${declared} observed=${observed}`);
  }

  const live = await verifyTruthframerPublicIndependently();

  if (live.status !== "PUBLIC_INDEPENDENT_VERIFICATION_PASS") {
    throw new Error(`LIVE_PUBLIC_INDEPENDENT_VERIFICATION_FAILED ${JSON.stringify(live.assertions)}`);
  }

  if (witness.verifier.observed_public_claims.capsule_sha256 !== live.observed_public_claims.capsule_sha256) {
    throw new Error("LIVE_CAPSULE_SHA256_MISMATCH");
  }

  if (witness.verifier.observed_public_claims.receipt_sha256 !== live.observed_public_claims.receipt_sha256) {
    throw new Error("LIVE_RECEIPT_SHA256_MISMATCH");
  }

  console.log("PUBLIC_INDEPENDENT_VERIFICATION_WITNESS_LIVE=true");
  console.log("TRUTHFRAMER_PUBLIC_INDEPENDENT_VERIFICATION_WITNESS_NETWORK_PASS=true");
  console.log(`PUBLIC_INDEPENDENT_VERIFICATION_WITNESS_URL=${WITNESS_URL}`);
  console.log(`PUBLIC_INDEPENDENT_VERIFIER_SCRIPT_URL=${VERIFIER_SCRIPT_URL}`);
  console.log(`PUBLIC_INDEPENDENT_VERIFIER_SCRIPT_RAW_SHA256=${await sha256Hex(scriptText)}`);
  console.log(`CAPSULE_SHA256=${live.observed_public_claims.capsule_sha256}`);
  console.log(`RECEIPT_SHA256=${live.observed_public_claims.receipt_sha256}`);
  console.log(`WITNESS_SHA256=${witness.witness_sha256}`);
  console.log("NO_PRIVATE_SOURCE_REQUIRED=true");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
