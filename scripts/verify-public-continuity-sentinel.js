#!/usr/bin/env node
const fs = require("node:fs");
const crypto = require("node:crypto");

function fail(msg) {
  console.error("TRUTHFRAMER_PUBLIC_CONTINUITY_SENTINEL_FAIL=" + msg);
  process.exit(1);
}

function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

const path = "docs/verification/PUBLIC_CONTINUITY_SENTINEL.json";
if (!fs.existsSync(path)) fail("SENTINEL_MISSING");

const sentinel = JSON.parse(fs.readFileSync(path, "utf8"));

if (sentinel.object_type !== "TRUTHFRAMER_PUBLIC_CONTINUITY_SENTINEL") fail("BAD_OBJECT_TYPE");
if (sentinel.sentinel_version !== "v0.9.0") fail("BAD_VERSION");
if (sentinel.status !== "PUBLIC_CONTINUITY_SENTINEL_ACTIVE") fail("BAD_STATUS");
if (sentinel.base_version !== "v0.8.0") fail("BAD_BASE_VERSION");
if (sentinel.base_status !== "TOTAL_PUBLIC_STACK_CLOSED") fail("BAD_BASE_STATUS");
if (!Array.isArray(sentinel.frames) || sentinel.frames.length !== 4) fail("FRAME_COUNT_NOT_FOUR");
if (!Array.isArray(sentinel.releases) || sentinel.releases.length !== 12) fail("RELEASE_COUNT_NOT_TWELVE");

for (const item of sentinel.required_local_objects || []) {
  if (!item.path || !fs.existsSync(item.path)) fail("LOCAL_OBJECT_MISSING:" + item.path);
  const real = sha256(fs.readFileSync(item.path));
  if (real !== item.sha256) fail("LOCAL_OBJECT_HASH_MISMATCH:" + item.path);
}

const copy = { ...sentinel };
const recorded = copy.sentinel_sha256;
delete copy.sentinel_sha256;
const recomputed = sha256(JSON.stringify(copy, null, 2) + "\n");
if (recorded !== recomputed) fail("SENTINEL_HASH_MISMATCH");

console.log("TRUTHFRAMER_PUBLIC_CONTINUITY_SENTINEL_PASS=true");
console.log("SENTINEL_VERSION=" + sentinel.sentinel_version);
console.log("STATUS=" + sentinel.status);
console.log("FRAME_COUNT=" + sentinel.frames.length);
console.log("RELEASE_COUNT=" + sentinel.releases.length);
console.log("LIVE_URL_COUNT=" + sentinel.required_live_urls.length);
