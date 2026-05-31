#!/usr/bin/env node
const fs = require("node:fs");

function fail(msg) {
  console.error("TRUTHFRAMER_PUBLIC_CONTINUITY_SENTINEL_SEAL_FAIL=" + msg);
  process.exit(1);
}

const sentinelPath = "docs/verification/PUBLIC_CONTINUITY_SENTINEL.json";
const sealPath = "docs/verification/PUBLIC_CONTINUITY_SENTINEL_SEAL.json";

if (!fs.existsSync(sentinelPath)) fail("SENTINEL_MISSING");
if (!fs.existsSync(sealPath)) fail("SEAL_MISSING");

const sentinel = JSON.parse(fs.readFileSync(sentinelPath, "utf8"));
const seal = JSON.parse(fs.readFileSync(sealPath, "utf8"));

if (seal.object_type !== "TRUTHFRAMER_PUBLIC_CONTINUITY_SENTINEL_SEAL") fail("BAD_OBJECT_TYPE");
if (seal.seal_version !== "v0.9.0") fail("BAD_VERSION");
if (seal.status !== "PUBLIC_CONTINUITY_SENTINEL_SEALED") fail("BAD_STATUS");
if (seal.sealed_sentinel_sha256 !== sentinel.sentinel_sha256) fail("SEALED_HASH_MISMATCH");

console.log("TRUTHFRAMER_PUBLIC_CONTINUITY_SENTINEL_SEAL_PASS=true");
console.log("SEAL_VERSION=" + seal.seal_version);
console.log("STATUS=" + seal.status);
console.log("SEALED_SENTINEL_SHA256=" + seal.sealed_sentinel_sha256);
