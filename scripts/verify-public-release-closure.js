#!/usr/bin/env node
const fs = require("fs");

const path = "docs/verification/PUBLIC_RELEASE_CLOSURE.json";
if (!fs.existsSync(path)) {
  console.error(`TRUTHFRAMER_PUBLIC_RELEASE_CLOSURE_FAIL=MISSING:${path}`);
  process.exit(1);
}

const obj = JSON.parse(fs.readFileSync(path, "utf8"));

function assert(cond, msg) {
  if (!cond) {
    console.error(`TRUTHFRAMER_PUBLIC_RELEASE_CLOSURE_FAIL=${msg}`);
    process.exit(1);
  }
}

assert(obj.artifact === "PUBLIC_RELEASE_CLOSURE", "BAD_ARTIFACT");
assert(obj.closure_version === "v0.9.1", "BAD_VERSION");
assert(obj.status === "PUBLIC_RELEASE_SELF_INCLUDED", "BAD_STATUS");
assert(obj.included_release === "v0.9.0", "MISSING_V090_SELF_INCLUSION");
assert(Array.isArray(obj.frames) && obj.frames.length === 4, "FRAME_COUNT_NOT_FOUR");
assert(Array.isArray(obj.releases) && obj.releases.includes("v0.9.0"), "V090_RELEASE_NOT_INCLUDED");
assert(obj.release_count === obj.releases.length, "BAD_RELEASE_COUNT");

console.log("TRUTHFRAMER_PUBLIC_RELEASE_CLOSURE_PASS=true");
console.log("CLOSURE_VERSION=v0.9.1");
console.log("STATUS=PUBLIC_RELEASE_SELF_INCLUDED");
console.log(`RELEASE_COUNT=${obj.release_count}`);
console.log("INCLUDED_RELEASE=v0.9.0");
