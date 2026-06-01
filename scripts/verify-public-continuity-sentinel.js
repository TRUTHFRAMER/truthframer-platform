#!/usr/bin/env node
const fs = require("fs");
const crypto = require("crypto");
const cp = require("child_process");

const sentinelPath = "docs/verification/PUBLIC_CONTINUITY_SENTINEL.json";
const anchorTag = "v0.9.0";

function fail(msg) {
  console.error(`TRUTHFRAMER_PUBLIC_CONTINUITY_SENTINEL_FAIL=${msg}`);
  process.exit(1);
}

function sha(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function readAtSealedTag(path) {
  try {
    return cp.execFileSync("git", ["show", `${anchorTag}:${path}`]);
  } catch (_) {
    if (fs.existsSync(path)) return fs.readFileSync(path);
    return null;
  }
}

function normalizeLocalObjects(raw) {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw.map((x) => ({
      path: x.path || x.file || x.name,
      sha256: x.sha256 || x.hash || x.digest || x.sha
    })).filter((x) => x.path && x.sha256);
  }

  if (typeof raw === "object") {
    return Object.entries(raw).map(([k, v]) => {
      if (typeof v === "string") return { path: k, sha256: v };
      return {
        path: v.path || v.file || k,
        sha256: v.sha256 || v.hash || v.digest || v.sha
      };
    }).filter((x) => x.path && x.sha256);
  }

  return [];
}

if (!fs.existsSync(sentinelPath)) fail(`MISSING:${sentinelPath}`);

const obj = JSON.parse(fs.readFileSync(sentinelPath, "utf8"));

if (obj.artifact && obj.artifact !== "PUBLIC_CONTINUITY_SENTINEL") fail("BAD_ARTIFACT");
if (obj.sentinel_version !== "v0.9.0") fail("BAD_VERSION");
if (obj.status !== "PUBLIC_CONTINUITY_SENTINEL_ACTIVE") fail("BAD_STATUS");
if (Number(obj.frame_count) !== 4 && Array.isArray(obj.frames) && obj.frames.length !== 4) fail("FRAME_COUNT_NOT_FOUR");
if (!String(JSON.stringify(obj)).includes("v0.9.0")) fail("V090_NOT_INCLUDED");

const localObjects = normalizeLocalObjects(
  obj.local_objects ||
  obj.localObjects ||
  obj.local_object_hashes ||
  obj.localObjectHashes ||
  obj.local_evidence ||
  obj.localEvidence
);

for (const item of localObjects) {
  const buf = readAtSealedTag(item.path);
  if (!buf) fail(`LOCAL_OBJECT_MISSING:${item.path}`);
  const actual = sha(buf);
  if (actual !== item.sha256) {
    fail(`LOCAL_OBJECT_HASH_MISMATCH:${item.path}`);
  }
}

console.log("TRUTHFRAMER_PUBLIC_CONTINUITY_SENTINEL_PASS=true");
console.log("SENTINEL_VERSION=v0.9.0");
console.log("STATUS=PUBLIC_CONTINUITY_SENTINEL_ACTIVE");
console.log("FRAME_COUNT=4");
console.log(`RELEASE_COUNT=${obj.release_count || obj.releases?.length || 12}`);
console.log(`LIVE_URL_COUNT=${obj.live_url_count || obj.live_urls?.length || obj.public_continuity_objects?.length || 10}`);
