#!/usr/bin/env node
const fs = require("fs");
const crypto = require("crypto");

const closurePath = "docs/verification/PUBLIC_RELEASE_CLOSURE.json";
const sealPath = "docs/verification/PUBLIC_RELEASE_CLOSURE_SEAL.json";

if (!fs.existsSync(closurePath) || !fs.existsSync(sealPath)) {
  console.error("TRUTHFRAMER_PUBLIC_RELEASE_CLOSURE_SEAL_FAIL=MISSING_OBJECT");
  process.exit(1);
}

const seal = JSON.parse(fs.readFileSync(sealPath, "utf8"));
const actual = crypto.createHash("sha256").update(fs.readFileSync(closurePath)).digest("hex");

function assert(cond, msg) {
  if (!cond) {
    console.error(`TRUTHFRAMER_PUBLIC_RELEASE_CLOSURE_SEAL_FAIL=${msg}`);
    process.exit(1);
  }
}

assert(seal.artifact === "PUBLIC_RELEASE_CLOSURE_SEAL", "BAD_ARTIFACT");
assert(seal.seal_version === "v0.9.1", "BAD_VERSION");
assert(seal.status === "PUBLIC_RELEASE_SELF_INCLUDED_SEALED", "BAD_STATUS");
assert(seal.sealed_closure_sha256 === actual, "SHA_MISMATCH");
assert(seal.included_release === "v0.9.0", "BAD_INCLUDED_RELEASE");

console.log("TRUTHFRAMER_PUBLIC_RELEASE_CLOSURE_SEAL_PASS=true");
console.log("SEAL_VERSION=v0.9.1");
console.log("STATUS=PUBLIC_RELEASE_SELF_INCLUDED_SEALED");
console.log(`SEALED_RELEASE_CLOSURE_SHA256=${actual}`);
