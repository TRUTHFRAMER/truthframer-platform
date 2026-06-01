#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const cp = require("child_process");

const VERSION = "v1.0.0";
const CLOSES_OVER = "v0.9.1";

function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function readJson(p) {
  return JSON.parse(read(p));
}

function writeJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n");
}

function exec(cmd) {
  return cp.execSync(cmd, { encoding: "utf8" }).trim();
}

const requiredArtifacts = [
  "PUBLIC_NETWORK_VERIFICATION_SEAL.json",
  "PUBLIC_VERIFICATION_INDEX.json",
  "PUBLIC_VERIFICATION_INDEX_SEAL.json",
  "PUBLIC_VERIFICATION_ATLAS.json",
  "PUBLIC_VERIFICATION_ATLAS_SEAL.json",
  "PUBLIC_STACK_CLOSURE.json",
  "PUBLIC_STACK_CLOSURE_SEAL.json",
  "PUBLIC_CONTINUITY_SENTINEL.json",
  "PUBLIC_CONTINUITY_SENTINEL_SEAL.json",
  "PUBLIC_RELEASE_CLOSURE.json",
  "PUBLIC_RELEASE_CLOSURE_SEAL.json"
];

const artifactDir = "docs/verification";
const coveredArtifacts = requiredArtifacts.map((name) => {
  const p = path.join(artifactDir, name);
  if (!fs.existsSync(p)) {
    throw new Error(`MISSING_PUBLIC_ARTIFACT:${p}`);
  }
  const content = read(p);
  let parsed = {};
  try { parsed = JSON.parse(content); } catch {}
  return {
    name,
    path: p,
    sha256: sha256(content),
    status: parsed.status || parsed.seal_status || parsed.certificate_status || null,
    version: parsed.version || parsed.seal_version || parsed.index_version || parsed.closure_version || parsed.certificate_version || null
  };
});

const releases = fs.existsSync("releases")
  ? fs.readdirSync("releases").filter((x) => /^v\d+\.\d+\.\d+$/.test(x)).sort((a, b) => {
      const pa = a.slice(1).split(".").map(Number);
      const pb = b.slice(1).split(".").map(Number);
      for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
      return 0;
    })
  : [];

if (!releases.includes(CLOSES_OVER)) {
  throw new Error(`MISSING_CLOSED_RELEASE:${CLOSES_OVER}`);
}

const frames = ["tf_000001", "tf_000002", "tf_000003", "tf_000004"];
const mainSha = exec("git rev-parse HEAD");
const pagesSha = exec("git ls-remote origin refs/heads/gh-pages | awk '{print $1}'");

const certificate = {
  protocol: "TRUTHFRAMER",
  certificate_version: VERSION,
  status: "PUBLIC_ROOT_FINALITY_CERTIFIED",
  closes_over_release: CLOSES_OVER,
  issued_at: new Date().toISOString(),
  base_main_sha: mainSha,
  base_pages_sha: pagesSha,
  finality_scope: {
    statement: "This certificate closes over the v0.9.1 public evidence stack. It does not claim impossible self-inclusion of its own future release.",
    local_verification: true,
    public_pages_verification: true,
    release_verification: true,
    sealed_artifact_chain: true,
    continuity_sentinel_present: true,
    release_self_inclusion_present: true
  },
  required_frames: frames,
  covered_releases: releases,
  covered_public_artifacts: coveredArtifacts,
  canonical_public_urls: {
    public_root: "https://truthframer.github.io/truthframer-platform/",
    verification_page: "https://truthframer.github.io/truthframer-platform/verification/",
    release_closure: "https://truthframer.github.io/truthframer-platform/verification/PUBLIC_RELEASE_CLOSURE.json",
    release_closure_seal: "https://truthframer.github.io/truthframer-platform/verification/PUBLIC_RELEASE_CLOSURE_SEAL.json"
  },
  invariant: "TRUTHFRAMER public standing is complete only when frame evidence, public artifacts, release evidence, continuity evidence, and closure seals are jointly replayable."
};

writeJson("docs/verification/PUBLIC_ROOT_FINALITY_CERTIFICATE.json", certificate);
writeJson("verification/v1.0.0/PUBLIC_ROOT_FINALITY_CERTIFICATE.json", certificate);

const certificateRaw = read("docs/verification/PUBLIC_ROOT_FINALITY_CERTIFICATE.json");
const certificateSha = sha256(certificateRaw);

const seal = {
  protocol: "TRUTHFRAMER",
  seal_version: VERSION,
  status: "PUBLIC_ROOT_FINALITY_CERTIFIED_SEALED",
  sealed_artifact: "PUBLIC_ROOT_FINALITY_CERTIFICATE.json",
  sealed_certificate_sha256: certificateSha,
  closes_over_release: CLOSES_OVER,
  base_main_sha: mainSha,
  base_pages_sha: pagesSha,
  issued_at: new Date().toISOString()
};

writeJson("docs/verification/PUBLIC_ROOT_FINALITY_CERTIFICATE_SEAL.json", seal);
writeJson("verification/v1.0.0/PUBLIC_ROOT_FINALITY_CERTIFICATE_SEAL.json", seal);

console.log("TRUTHFRAMER_PUBLIC_ROOT_FINALITY_GENERATED=true");
console.log(`FINALITY_VERSION=${VERSION}`);
console.log(`CLOSES_OVER_RELEASE=${CLOSES_OVER}`);
console.log(`COVERED_ARTIFACT_COUNT=${coveredArtifacts.length}`);
console.log(`COVERED_RELEASE_COUNT=${releases.length}`);
console.log(`SEALED_CERTIFICATE_SHA256=${certificateSha}`);
