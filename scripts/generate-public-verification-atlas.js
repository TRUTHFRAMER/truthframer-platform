#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const VERSION = "v0.7.0";
const PUBLIC_URL = "https://truthframer.github.io/truthframer-platform";

function mkdirp(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}
function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}
function writeJson(file, obj) {
  mkdirp(file);
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n");
}

const frames = [
  {
    truth_frame_id: "tf_000001",
    slug: "tf-000001",
    title: "TF-000001",
    render_url: `${PUBLIC_URL}/render/`,
    truth_frame_url: `${PUBLIC_URL}/case/tf-000001/TRUTH_FRAME.json`,
    source_manifest_url: `${PUBLIC_URL}/case/tf-000001/SOURCE_MANIFEST.json`,
    replay_manifest_url: `${PUBLIC_URL}/case/tf-000001/REPLAY_MANIFEST.json`,
    public_surface_proof_url: `${PUBLIC_URL}/proof/PUBLIC_SURFACE_PROOF.json`
  },
  {
    truth_frame_id: "tf_000002",
    slug: "tf-000002",
    title: "TF-000002",
    render_url: `${PUBLIC_URL}/render/tf-000002/`,
    truth_frame_url: `${PUBLIC_URL}/case/tf-000002/TRUTH_FRAME.json`,
    source_manifest_url: `${PUBLIC_URL}/case/tf-000002/SOURCE_MANIFEST.json`,
    replay_manifest_url: `${PUBLIC_URL}/case/tf-000002/REPLAY_MANIFEST.json`,
    public_surface_proof_url: `${PUBLIC_URL}/proof/tf-000002/PUBLIC_SURFACE_PROOF.json`
  },
  {
    truth_frame_id: "tf_000003",
    slug: "tf-000003",
    title: "TF-000003",
    render_url: `${PUBLIC_URL}/render/tf-000003/`,
    truth_frame_url: `${PUBLIC_URL}/case/tf-000003/TRUTH_FRAME.json`,
    source_manifest_url: `${PUBLIC_URL}/case/tf-000003/SOURCE_MANIFEST.json`,
    replay_manifest_url: `${PUBLIC_URL}/case/tf-000003/REPLAY_MANIFEST.json`,
    public_surface_proof_url: `${PUBLIC_URL}/proof/tf-000003/PUBLIC_SURFACE_PROOF.json`
  },
  {
    truth_frame_id: "tf_000004",
    slug: "tf-000004",
    title: "TF-000004",
    render_url: `${PUBLIC_URL}/render/tf-000004/`,
    truth_frame_url: `${PUBLIC_URL}/case/tf-000004/TRUTH_FRAME.json`,
    source_manifest_url: `${PUBLIC_URL}/case/tf-000004/SOURCE_MANIFEST.json`,
    replay_manifest_url: `${PUBLIC_URL}/case/tf-000004/REPLAY_MANIFEST.json`,
    public_surface_proof_url: `${PUBLIC_URL}/proof/tf-000004/PUBLIC_SURFACE_PROOF.json`
  }
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
  "v0.6.1"
];

const artifacts = [
  { artifact_type: "public_root", url: `${PUBLIC_URL}/` },
  { artifact_type: "public_frames_index", url: `${PUBLIC_URL}/frames/` },
  { artifact_type: "public_registry", url: `${PUBLIC_URL}/registry/TRUTH_FRAME_REGISTRY.json` },
  { artifact_type: "public_system_status", url: `${PUBLIC_URL}/status/truthframer-system-status.json` },
  { artifact_type: "public_system_audit_seal", url: `${PUBLIC_URL}/audit/PUBLIC_SYSTEM_AUDIT_SEAL.json` },
  { artifact_type: "repository_hardening_seal", url: `${PUBLIC_URL}/audit/REPOSITORY_HARDENING_SEAL.json` },
  { artifact_type: "public_network_verification_page", url: `${PUBLIC_URL}/verification/` },
  { artifact_type: "public_network_verification_seal", url: `${PUBLIC_URL}/verification/PUBLIC_NETWORK_VERIFICATION_SEAL.json` },
  { artifact_type: "public_verification_index", url: `${PUBLIC_URL}/verification/PUBLIC_VERIFICATION_INDEX.json` },
  { artifact_type: "public_verification_index_seal", url: `${PUBLIC_URL}/verification/PUBLIC_VERIFICATION_INDEX_SEAL.json` },
  { artifact_type: "public_verification_atlas", url: `${PUBLIC_URL}/verification/PUBLIC_VERIFICATION_ATLAS.json` },
  { artifact_type: "public_verification_atlas_seal", url: `${PUBLIC_URL}/verification/PUBLIC_VERIFICATION_ATLAS_SEAL.json` }
];

for (const frame of frames) {
  artifacts.push(
    { artifact_type: "truth_frame_render", truth_frame_id: frame.truth_frame_id, url: frame.render_url },
    { artifact_type: "truth_frame_object", truth_frame_id: frame.truth_frame_id, url: frame.truth_frame_url },
    { artifact_type: "source_manifest", truth_frame_id: frame.truth_frame_id, url: frame.source_manifest_url },
    { artifact_type: "replay_manifest", truth_frame_id: frame.truth_frame_id, url: frame.replay_manifest_url },
    { artifact_type: "public_surface_proof", truth_frame_id: frame.truth_frame_id, url: frame.public_surface_proof_url }
  );
}

for (const release of releases) {
  artifacts.push({
    artifact_type: "github_release",
    release_version: release,
    url: `https://github.com/TRUTHFRAMER/truthframer-platform/releases/tag/${release}`
  });
}

const atlas = {
  object_type: "TRUTHFRAMER_PUBLIC_VERIFICATION_ATLAS",
  atlas_version: VERSION,
  status: "COMPLETE_PUBLIC_VERIFICATION_ATLAS",
  public_root: PUBLIC_URL,
  frame_count: frames.length,
  release_count: releases.length,
  artifact_count: artifacts.length,
  canonical_boundary: "TF-000001 is intentionally represented by /render/; TF-000002+ are represented by /render/<slug>/.",
  frames,
  releases: releases.map(version => ({
    version,
    url: `https://github.com/TRUTHFRAMER/truthframer-platform/releases/tag/${version}`
  })),
  artifacts
};

const atlasPayloadSha = sha256(JSON.stringify(atlas, null, 2) + "\n");
atlas.atlas_payload_sha256 = atlasPayloadSha;

const atlasText = JSON.stringify(atlas, null, 2) + "\n";
const atlasFileSha = sha256(atlasText);

const seal = {
  object_type: "TRUTHFRAMER_PUBLIC_VERIFICATION_ATLAS_SEAL",
  seal_version: VERSION,
  status: "COMPLETE_PUBLIC_VERIFICATION_ATLAS_SEALED",
  public_root: PUBLIC_URL,
  atlas_url: `${PUBLIC_URL}/verification/PUBLIC_VERIFICATION_ATLAS.json`,
  atlas_seal_url: `${PUBLIC_URL}/verification/PUBLIC_VERIFICATION_ATLAS_SEAL.json`,
  sealed_atlas_sha256: atlasFileSha,
  sealed_frame_count: frames.length,
  sealed_release_count: releases.length,
  sealed_artifact_count: artifacts.length,
  sealed_index_version: "v0.6.0",
  sealed_index_seal_version: "v0.6.1",
  canonical_frame_ids: frames.map(f => f.truth_frame_id)
};

writeJson("docs/verification/PUBLIC_VERIFICATION_ATLAS.json", atlas);
writeJson("verification/v0.7.0/PUBLIC_VERIFICATION_ATLAS.json", atlas);
writeJson("reports/current/public-verification-atlas-v0.7.0.json", atlas);

writeJson("docs/verification/PUBLIC_VERIFICATION_ATLAS_SEAL.json", seal);
writeJson("verification/v0.7.0/PUBLIC_VERIFICATION_ATLAS_SEAL.json", seal);
writeJson("reports/current/public-verification-atlas-seal-v0.7.0.json", seal);

console.log("TRUTHFRAMER_PUBLIC_VERIFICATION_ATLAS_GENERATED=true");
console.log(`ATLAS_ARTIFACT_COUNT=${artifacts.length}`);
console.log(`ATLAS_RELEASE_COUNT=${releases.length}`);
console.log(`ATLAS_FRAME_COUNT=${frames.length}`);
console.log(`ATLAS_SHA256=${atlasFileSha}`);
