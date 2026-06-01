#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

async function main() {
  const modulePath = path.resolve("docs/verifier/TRUTHFRAMER_PUBLIC_INDEPENDENT_VERIFIER.mjs");
  const { verifyTruthframerPublicIndependently, stableStringify, sha256Hex } = await import(modulePath);

  const verifier = await verifyTruthframerPublicIndependently();

  if (verifier.status !== "PUBLIC_INDEPENDENT_VERIFICATION_PASS") {
    throw new Error(`PUBLIC_INDEPENDENT_VERIFICATION_FAILED ${JSON.stringify(verifier.assertions)}`);
  }

  const witness = {
    protocol: "TRUTHFRAMER_PUBLIC_INDEPENDENT_VERIFICATION_WITNESS",
    version: "v1.7.0",
    status: "PUBLIC_INDEPENDENT_VERIFICATION_WITNESS_BOUND",
    closure_claim:
      "A third party can verify TRUTHFRAMER public truth-frame continuity from public URLs only, without private source, local repository state, maintainer terminal output, or hidden context.",
    public_console_path: "/verifier/",
    public_verifier_script: "TRUTHFRAMER_PUBLIC_INDEPENDENT_VERIFIER.mjs",
    public_checked_url_count: 2,
    verifier
  };

  witness.witness_sha256 = await sha256Hex(stableStringify(witness));

  fs.mkdirSync("verifier", { recursive: true });
  fs.mkdirSync("docs/verifier", { recursive: true });
  fs.mkdirSync("reports/current", { recursive: true });

  const body = JSON.stringify(witness, null, 2) + "\n";

  fs.writeFileSync("verifier/TRUTHFRAMER_PUBLIC_INDEPENDENT_VERIFICATION_WITNESS.json", body);
  fs.writeFileSync("docs/verifier/TRUTHFRAMER_PUBLIC_INDEPENDENT_VERIFICATION_WITNESS.json", body);
  fs.writeFileSync("reports/current/public-independent-verification-witness-v1.7.0.json", body);

  fs.copyFileSync(
    "docs/verifier/TRUTHFRAMER_PUBLIC_INDEPENDENT_VERIFIER.mjs",
    "verifier/TRUTHFRAMER_PUBLIC_INDEPENDENT_VERIFIER.mjs"
  );

  console.log("TRUTHFRAMER_PUBLIC_INDEPENDENT_VERIFICATION_WITNESS_GENERATED=true");
  console.log(`VERSION=${witness.version}`);
  console.log(`STATUS=${witness.status}`);
  console.log(`VERIFIER_STATUS=${verifier.status}`);
  console.log(`CAPSULE_SHA256=${verifier.observed_public_claims.capsule_sha256}`);
  console.log(`RECEIPT_SHA256=${verifier.observed_public_claims.receipt_sha256}`);
  console.log(`WITNESS_SHA256=${witness.witness_sha256}`);
  console.log("NO_PRIVATE_SOURCE_REQUIRED=true");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
