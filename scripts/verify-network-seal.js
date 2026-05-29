#!/usr/bin/env node
const fs = require("node:fs");

const paths = [
  "verification/v0.5.1/PUBLIC_NETWORK_VERIFICATION_SEAL.json",
  "docs/verification/PUBLIC_NETWORK_VERIFICATION_SEAL.json",
  "reports/current/public-network-verification-seal-v0.5.1.json"
];

for (const path of paths) {
  if (!fs.existsSync(path)) {
    console.error(`TRUTHFRAMER_NETWORK_SEAL_FAIL=MISSING:${path}`);
    process.exit(1);
  }
}

const seal = JSON.parse(fs.readFileSync(paths[0], "utf8"));
const docs = JSON.parse(fs.readFileSync(paths[1], "utf8"));
const report = JSON.parse(fs.readFileSync(paths[2], "utf8"));

const same =
  JSON.stringify(seal) === JSON.stringify(docs) &&
  JSON.stringify(seal) === JSON.stringify(report);

if (!same) {
  console.error("TRUTHFRAMER_NETWORK_SEAL_FAIL=SEAL_COPIES_DIVERGE");
  process.exit(1);
}

function requireField(cond, code) {
  if (!cond) {
    console.error(`TRUTHFRAMER_NETWORK_SEAL_FAIL=${code}`);
    process.exit(1);
  }
}

requireField(seal.object_type === "TRUTHFRAMER_PUBLIC_NETWORK_VERIFICATION_SEAL", "BAD_OBJECT_TYPE");
requireField(seal.seal_version === "v0.5.1", "BAD_SEAL_VERSION");
requireField(seal.status === "PUBLIC_NETWORK_VERIFIABLE", "BAD_STATUS");
requireField(seal.required_command === "npm run verify:network", "BAD_COMMAND");
requireField(seal.verification_page.endsWith("/verification/"), "BAD_VERIFICATION_PAGE");
requireField(seal.verified_release_chain.includes("v0.5.0"), "V050_NOT_IN_RELEASE_CHAIN");
requireField(seal.verified_public_surfaces.length >= 10, "INSUFFICIENT_PUBLIC_SURFACES");

console.log("TRUTHFRAMER_NETWORK_VERIFICATION_SEAL_PASS=true");
console.log(`SEAL_VERSION=${seal.seal_version}`);
console.log(`STATUS=${seal.status}`);
