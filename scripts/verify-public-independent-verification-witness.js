#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const files = [
  "verifier/TRUTHFRAMER_PUBLIC_INDEPENDENT_VERIFICATION_WITNESS.json",
  "docs/verifier/TRUTHFRAMER_PUBLIC_INDEPENDENT_VERIFICATION_WITNESS.json",
  "reports/current/public-independent-verification-witness-v1.7.0.json"
];

async function main() {
  const modulePath = path.resolve("docs/verifier/TRUTHFRAMER_PUBLIC_INDEPENDENT_VERIFIER.mjs");
  const { stableStringify, sha256Hex } = await import(modulePath);

  const witnesses = files.map((file) => {
    if (!fs.existsSync(file)) throw new Error(`WITNESS_MISSING ${file}`);
    return JSON.parse(fs.readFileSync(file, "utf8"));
  });

  const reference = JSON.stringify(witnesses[0]);

  for (const witness of witnesses) {
    if (JSON.stringify(witness) !== reference) throw new Error("WITNESS_MIRROR_MISMATCH");

    const declared = witness.witness_sha256;
    const copy = JSON.parse(JSON.stringify(witness));
    delete copy.witness_sha256;
    const observed = await sha256Hex(stableStringify(copy));

    if (declared !== observed) {
      throw new Error(`WITNESS_SHA256_MISMATCH declared=${declared} observed=${observed}`);
    }

    if (witness.version !== "v1.7.0") throw new Error(`VERSION_MISMATCH ${witness.version}`);
    if (witness.status !== "PUBLIC_INDEPENDENT_VERIFICATION_WITNESS_BOUND") {
      throw new Error(`STATUS_MISMATCH ${witness.status}`);
    }
    if (!witness.verifier || witness.verifier.status !== "PUBLIC_INDEPENDENT_VERIFICATION_PASS") {
      throw new Error("VERIFIER_STATUS_NOT_PASS");
    }
    if (!witness.verifier.assertions || !Object.values(witness.verifier.assertions).every(Boolean)) {
      throw new Error("VERIFIER_ASSERTION_NOT_ALL_TRUE");
    }
  }

  const witness = witnesses[0];

  console.log("TRUTHFRAMER_PUBLIC_INDEPENDENT_VERIFICATION_WITNESS_PASS=true");
  console.log(`VERSION=${witness.version}`);
  console.log(`STATUS=${witness.status}`);
  console.log(`VERIFIER_STATUS=${witness.verifier.status}`);
  console.log(`PUBLIC_CHECKED_URL_COUNT=${witness.public_checked_url_count}`);
  console.log(`CAPSULE_SHA256=${witness.verifier.observed_public_claims.capsule_sha256}`);
  console.log(`RECEIPT_SHA256=${witness.verifier.observed_public_claims.receipt_sha256}`);
  console.log(`WITNESS_SHA256=${witness.witness_sha256}`);
  console.log("NO_PRIVATE_SOURCE_REQUIRED=true");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
