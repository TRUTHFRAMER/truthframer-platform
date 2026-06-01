#!/usr/bin/env node
const fs = require("fs");
const crypto = require("crypto");
const cp = require("child_process");

function sh(cmd) {
  return cp.execSync(cmd, { encoding: "utf8" }).trim();
}

function writeJson(path, obj) {
  fs.mkdirSync(require("path").dirname(path), { recursive: true });
  fs.writeFileSync(path, JSON.stringify(obj, null, 2) + "\n");
}

function sha256(path) {
  return crypto.createHash("sha256").update(fs.readFileSync(path)).digest("hex");
}

const version = "v0.9.1";
const includedRelease = "v0.9.0";
const publicBase = "https://truthframer.github.io/truthframer-platform";

const mainSha = sh("git rev-parse HEAD");
const pagesSha = sh("git ls-remote origin refs/heads/gh-pages | awk '{print $1}' || true");

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
  "v0.8.0",
  "v0.9.0"
];

const frames = ["tf_000001", "tf_000002", "tf_000003", "tf_000004"];

const closure = {
  artifact: "PUBLIC_RELEASE_CLOSURE",
  closure_version: version,
  status: "PUBLIC_RELEASE_SELF_INCLUDED",
  purpose: "Proves that the previous public continuity sentinel release is itself now live and included in the public verification chain.",
  included_release: includedRelease,
  main_sha: mainSha,
  pages_sha_at_generation: pagesSha,
  canonical_public_base: publicBase,
  frames,
  releases,
  release_count: releases.length,
  public_continuity_objects: [
    `${publicBase}/verification/PUBLIC_CONTINUITY_SENTINEL.json`,
    `${publicBase}/verification/PUBLIC_CONTINUITY_SENTINEL_SEAL.json`,
    `${publicBase}/verification/PUBLIC_STACK_CLOSURE.json`,
    `${publicBase}/verification/PUBLIC_STACK_CLOSURE_SEAL.json`,
    `${publicBase}/verification/PUBLIC_VERIFICATION_ATLAS.json`,
    `${publicBase}/verification/PUBLIC_VERIFICATION_ATLAS_SEAL.json`,
    `${publicBase}/verification/PUBLIC_VERIFICATION_INDEX.json`,
    `${publicBase}/verification/PUBLIC_VERIFICATION_INDEX_SEAL.json`,
    `${publicBase}/verification/PUBLIC_NETWORK_VERIFICATION_SEAL.json`
  ],
  included_release_url: "https://github.com/TRUTHFRAMER/truthframer-platform/releases/tag/v0.9.0",
  created_at_utc: new Date().toISOString()
};

writeJson("docs/verification/PUBLIC_RELEASE_CLOSURE.json", closure);
writeJson("verification/v0.9.1/PUBLIC_RELEASE_CLOSURE.json", closure);
writeJson("reports/current/public-release-closure-v0.9.1.json", closure);

const closureSha = sha256("docs/verification/PUBLIC_RELEASE_CLOSURE.json");

const seal = {
  artifact: "PUBLIC_RELEASE_CLOSURE_SEAL",
  seal_version: version,
  status: "PUBLIC_RELEASE_SELF_INCLUDED_SEALED",
  sealed_artifact: "PUBLIC_RELEASE_CLOSURE.json",
  sealed_closure_sha256: closureSha,
  included_release: includedRelease,
  main_sha: mainSha,
  pages_sha_at_generation: pagesSha,
  created_at_utc: new Date().toISOString()
};

writeJson("docs/verification/PUBLIC_RELEASE_CLOSURE_SEAL.json", seal);
writeJson("verification/v0.9.1/PUBLIC_RELEASE_CLOSURE_SEAL.json", seal);
writeJson("reports/current/public-release-closure-seal-v0.9.1.json", seal);

console.log("TRUTHFRAMER_PUBLIC_RELEASE_CLOSURE_GENERATED=true");
console.log(`RELEASE_CLOSURE_VERSION=${version}`);
console.log(`INCLUDED_RELEASE=${includedRelease}`);
console.log(`RELEASE_COUNT=${releases.length}`);
console.log(`RELEASE_CLOSURE_SHA256=${closureSha}`);
