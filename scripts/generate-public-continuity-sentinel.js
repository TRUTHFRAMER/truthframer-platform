#!/usr/bin/env node
const fs = require("node:fs");
const crypto = require("node:crypto");
const { execSync } = require("node:child_process");

const VERSION = "v0.9.0";
const PUBLIC_URL = "https://truthframer.github.io/truthframer-platform";

function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function git(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function exists(path) {
  if (!fs.existsSync(path)) throw new Error(`LOCAL_OBJECT_MISSING:${path}`);
  return {
    path,
    sha256: sha256(fs.readFileSync(path))
  };
}

const frames = [
  "tf_000001",
  "tf_000002",
  "tf_000003",
  "tf_000004"
];

const releases = [
  "v0.1.0",
  "v0.2.0",
  "v0.3.0",
  "v0.4.0",
  "v0.4.1",
  "v0.4.2",
  "v0.5.0",
  "v0.5.1",
  "v0.6.0",
  "v0.6.1",
  "v0.7.0",
  "v0.8.0"
];

const requiredLocalObjects = [
  "package.json",
  "README.md",
  "docs/render/index.html",
  "docs/verification/index.html",
  "docs/verification/PUBLIC_NETWORK_VERIFICATION_SEAL.json",
  "docs/verification/PUBLIC_VERIFICATION_INDEX.json",
  "docs/verification/PUBLIC_VERIFICATION_INDEX_SEAL.json",
  "docs/verification/PUBLIC_VERIFICATION_ATLAS.json",
  "docs/verification/PUBLIC_VERIFICATION_ATLAS_SEAL.json",
  "docs/verification/PUBLIC_STACK_CLOSURE.json",
  "docs/verification/PUBLIC_STACK_CLOSURE_SEAL.json",
  "reports/current/public-stack-closure-v0.8.0.json",
  "reports/current/public-stack-closure-seal-v0.8.0.json",
  "scripts/verify-public-stack-closure.js",
  "scripts/verify-public-stack-closure-seal.js"
].map(exists);

const liveUrls = [
  `${PUBLIC_URL}/`,
  `${PUBLIC_URL}/render/`,
  `${PUBLIC_URL}/verification/`,
  `${PUBLIC_URL}/verification/PUBLIC_NETWORK_VERIFICATION_SEAL.json`,
  `${PUBLIC_URL}/verification/PUBLIC_VERIFICATION_INDEX.json`,
  `${PUBLIC_URL}/verification/PUBLIC_VERIFICATION_INDEX_SEAL.json`,
  `${PUBLIC_URL}/verification/PUBLIC_VERIFICATION_ATLAS.json`,
  `${PUBLIC_URL}/verification/PUBLIC_VERIFICATION_ATLAS_SEAL.json`,
  `${PUBLIC_URL}/verification/PUBLIC_STACK_CLOSURE.json`,
  `${PUBLIC_URL}/verification/PUBLIC_STACK_CLOSURE_SEAL.json`
];

const releaseUrls = releases.map(v => `https://github.com/TRUTHFRAMER/truthframer-platform/releases/tag/${v}`);

let sentinel = {
  object_type: "TRUTHFRAMER_PUBLIC_CONTINUITY_SENTINEL",
  sentinel_version: VERSION,
  status: "PUBLIC_CONTINUITY_SENTINEL_ACTIVE",
  generated_at_utc: new Date().toISOString(),
  repository: "TRUTHFRAMER/truthframer-platform",
  main_sha: git("git rev-parse HEAD"),
  base_version: "v0.8.0",
  base_status: "TOTAL_PUBLIC_STACK_CLOSED",
  continuity_model: {
    local_object_continuity: true,
    public_url_continuity: true,
    release_chain_continuity: true,
    seal_chain_continuity: true,
    protected_main_continuity: true,
    pages_publication_continuity: true
  },
  frames,
  releases,
  required_local_objects: requiredLocalObjects,
  required_live_urls: liveUrls,
  required_release_urls: releaseUrls,
  counts: {
    frame_count: frames.length,
    release_count: releases.length,
    required_local_object_count: requiredLocalObjects.length,
    required_live_url_count: liveUrls.length,
    required_release_url_count: releaseUrls.length
  }
};

const sentinelText = JSON.stringify(sentinel, null, 2) + "\n";
sentinel.sentinel_sha256 = sha256(sentinelText);

const finalSentinelText = JSON.stringify(sentinel, null, 2) + "\n";
fs.writeFileSync("docs/verification/PUBLIC_CONTINUITY_SENTINEL.json", finalSentinelText);
fs.writeFileSync("verification/v0.9.0/PUBLIC_CONTINUITY_SENTINEL.json", finalSentinelText);
fs.writeFileSync("reports/current/public-continuity-sentinel-v0.9.0.json", finalSentinelText);

const seal = {
  object_type: "TRUTHFRAMER_PUBLIC_CONTINUITY_SENTINEL_SEAL",
  seal_version: VERSION,
  status: "PUBLIC_CONTINUITY_SENTINEL_SEALED",
  generated_at_utc: new Date().toISOString(),
  repository: "TRUTHFRAMER/truthframer-platform",
  main_sha: sentinel.main_sha,
  sealed_object: "PUBLIC_CONTINUITY_SENTINEL.json",
  sealed_sentinel_sha256: sentinel.sentinel_sha256,
  base_version: "v0.8.0",
  base_status: "TOTAL_PUBLIC_STACK_CLOSED"
};

const sealText = JSON.stringify(seal, null, 2) + "\n";
fs.writeFileSync("docs/verification/PUBLIC_CONTINUITY_SENTINEL_SEAL.json", sealText);
fs.writeFileSync("verification/v0.9.0/PUBLIC_CONTINUITY_SENTINEL_SEAL.json", sealText);
fs.writeFileSync("reports/current/public-continuity-sentinel-seal-v0.9.0.json", sealText);

console.log("TRUTHFRAMER_PUBLIC_CONTINUITY_SENTINEL_GENERATED=true");
console.log("SENTINEL_VERSION=" + VERSION);
console.log("FRAME_COUNT=" + frames.length);
console.log("RELEASE_COUNT=" + releases.length);
console.log("LIVE_URL_COUNT=" + liveUrls.length);
console.log("SENTINEL_SHA256=" + sentinel.sentinel_sha256);
