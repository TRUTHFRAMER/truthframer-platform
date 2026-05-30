#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const VERSION = "v0.8.0";
const PUBLIC_URL = "https://truthframer.github.io/truthframer-platform";

function mkdirp(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}
function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}
function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}
function fileSha(file) {
  const text = read(file);
  return text ? sha256(text) : null;
}
function writeJson(file, obj) {
  mkdirp(file);
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n");
}

const frames = [
  ["tf_000001", "tf-000001", `${PUBLIC_URL}/render/`, `${PUBLIC_URL}/proof/PUBLIC_SURFACE_PROOF.json`],
  ["tf_000002", "tf-000002", `${PUBLIC_URL}/render/tf-000002/`, `${PUBLIC_URL}/proof/tf-000002/PUBLIC_SURFACE_PROOF.json`],
  ["tf_000003", "tf-000003", `${PUBLIC_URL}/render/tf-000003/`, `${PUBLIC_URL}/proof/tf-000003/PUBLIC_SURFACE_PROOF.json`],
  ["tf_000004", "tf-000004", `${PUBLIC_URL}/render/tf-000004/`, `${PUBLIC_URL}/proof/tf-000004/PUBLIC_SURFACE_PROOF.json`]
].map(([truth_frame_id, slug, render_url, public_surface_proof_url]) => ({
  truth_frame_id,
  slug,
  render_url,
  truth_frame_url: `${PUBLIC_URL}/case/${slug}/TRUTH_FRAME.json`,
  source_manifest_url: `${PUBLIC_URL}/case/${slug}/SOURCE_MANIFEST.json`,
  replay_manifest_url: `${PUBLIC_URL}/case/${slug}/REPLAY_MANIFEST.json`,
  public_surface_proof_url
}));

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
  "v0.7.0"
].map(version => ({
  version,
  url: `https://github.com/TRUTHFRAMER/truthframer-platform/releases/tag/${version}`
}));

const publicSurfaces = [
  ["public_root", `${PUBLIC_URL}/`],
  ["public_frames_index", `${PUBLIC_URL}/frames/`],
  ["truth_frame_registry", `${PUBLIC_URL}/registry/TRUTH_FRAME_REGISTRY.json`],
  ["system_status", `${PUBLIC_URL}/status/truthframer-system-status.json`],
  ["public_system_audit_seal", `${PUBLIC_URL}/audit/PUBLIC_SYSTEM_AUDIT_SEAL.json`],
  ["repository_hardening_seal", `${PUBLIC_URL}/audit/REPOSITORY_HARDENING_SEAL.json`],
  ["verification_page", `${PUBLIC_URL}/verification/`],
  ["public_network_verification_seal", `${PUBLIC_URL}/verification/PUBLIC_NETWORK_VERIFICATION_SEAL.json`],
  ["public_verification_index", `${PUBLIC_URL}/verification/PUBLIC_VERIFICATION_INDEX.json`],
  ["public_verification_index_seal", `${PUBLIC_URL}/verification/PUBLIC_VERIFICATION_INDEX_SEAL.json`],
  ["public_verification_atlas", `${PUBLIC_URL}/verification/PUBLIC_VERIFICATION_ATLAS.json`],
  ["public_verification_atlas_seal", `${PUBLIC_URL}/verification/PUBLIC_VERIFICATION_ATLAS_SEAL.json`],
  ["public_stack_closure", `${PUBLIC_URL}/verification/PUBLIC_STACK_CLOSURE.json`],
  ["public_stack_closure_seal", `${PUBLIC_URL}/verification/PUBLIC_STACK_CLOSURE_SEAL.json`]
].map(([artifact_type, url]) => ({ artifact_type, url }));

const frameArtifacts = [];
for (const frame of frames) {
  frameArtifacts.push(
    { artifact_type: "truth_frame_render", truth_frame_id: frame.truth_frame_id, url: frame.render_url },
    { artifact_type: "truth_frame_object", truth_frame_id: frame.truth_frame_id, url: frame.truth_frame_url },
    { artifact_type: "source_manifest", truth_frame_id: frame.truth_frame_id, url: frame.source_manifest_url },
    { artifact_type: "replay_manifest", truth_frame_id: frame.truth_frame_id, url: frame.replay_manifest_url },
    { artifact_type: "public_surface_proof", truth_frame_id: frame.truth_frame_id, url: frame.public_surface_proof_url }
  );
}

const gateScripts = [
  ["verify", "scripts/verify-truthframer.js"],
  ["verify:render", "scripts/verify-render.js"],
  ["verify:public", "scripts/verify-public-surface.js"],
  ["verify:registry", "scripts/verify-registry.js"],
  ["verify:readme", "scripts/verify-readme-public-entry.js"],
  ["verify:tf000002", "scripts/verify-tf-000002.js"],
  ["verify:tf000003", "scripts/verify-tf-000003.js"],
  ["verify:tf000004", "scripts/verify-tf-000004.js"],
  ["verify:root", "scripts/verify-public-root.js"],
  ["verify:audit", "scripts/verify-audit-seal.js"],
  ["verify:hardening", "scripts/verify-hardening-seal.js"],
  ["verify:network", "scripts/verify-public-network.js"],
  ["verify:network-seal", "scripts/verify-network-seal.js"],
  ["verify:verification-index", "scripts/verify-public-verification-index.js"],
  ["verify:index-seal", "scripts/verify-public-verification-index-seal.js"],
  ["verify:verification-atlas", "scripts/verify-public-verification-atlas.js"],
  ["verify:atlas-seal", "scripts/verify-public-verification-atlas-seal.js"],
  ["generate:verification-atlas", "scripts/generate-public-verification-atlas.js"],
  ["generate:stack-closure", "scripts/generate-public-stack-closure.js"],
  ["verify:stack-closure", "scripts/verify-public-stack-closure.js"],
  ["verify:stack-closure-seal", "scripts/verify-public-stack-closure-seal.js"]
].map(([script, file]) => ({
  script,
  file,
  present: fs.existsSync(file),
  sha256: fileSha(file)
}));

const governanceReports = [
  "reports/current/main-branch-protection-v0.8.0.json",
  "reports/current/pages-config-v0.8.0.json",
  "reports/current/repository-readback-v0.8.0.json"
].map(file => ({
  file,
  present: fs.existsSync(file),
  sha256: fileSha(file)
}));

const sourceObjects = [
  "package.json",
  ".github/workflows/verify.yml",
  "docs/verification/PUBLIC_VERIFICATION_INDEX.json",
  "docs/verification/PUBLIC_VERIFICATION_INDEX_SEAL.json",
  "docs/verification/PUBLIC_VERIFICATION_ATLAS.json",
  "docs/verification/PUBLIC_VERIFICATION_ATLAS_SEAL.json",
  "docs/audit/PUBLIC_SYSTEM_AUDIT_SEAL.json",
  "docs/audit/REPOSITORY_HARDENING_SEAL.json"
].map(file => ({
  file,
  present: fs.existsSync(file),
  sha256: fileSha(file)
}));

const closure = {
  object_type: "TRUTHFRAMER_PUBLIC_STACK_CLOSURE",
  closure_version: VERSION,
  status: "TOTAL_PUBLIC_STACK_CLOSED",
  public_root: PUBLIC_URL,
  boundary: "This object closes the public TRUTHFRAMER stack from initial truth-frame spine through v0.7.0 complete public verification atlas.",
  canonical_constraints: [
    "TF-000001 public render route is /render/",
    "TF-000002 through TF-000004 public render routes are /render/<frame>/",
    "public stack closure is generated from source-controlled verification objects and public URL topology",
    "release chain is closed through v0.7.0; v0.8.0 is the closure release for this state"
  ],
  counts: {
    frame_count: frames.length,
    release_count: releases.length,
    public_surface_count: publicSurfaces.length,
    frame_artifact_count: frameArtifacts.length,
    gate_script_count: gateScripts.length,
    governance_report_count: governanceReports.length,
    source_object_count: sourceObjects.length,
    total_public_artifact_count: publicSurfaces.length + frameArtifacts.length + releases.length
  },
  frames,
  releases,
  public_surfaces: publicSurfaces,
  frame_artifacts: frameArtifacts,
  gate_scripts: gateScripts,
  governance_reports: governanceReports,
  source_objects: sourceObjects
};

const closureTextWithoutSha = JSON.stringify(closure, null, 2) + "\n";
closure.closure_payload_sha256 = sha256(closureTextWithoutSha);

const closureText = JSON.stringify(closure, null, 2) + "\n";
const closureSha = sha256(closureText);

const seal = {
  object_type: "TRUTHFRAMER_PUBLIC_STACK_CLOSURE_SEAL",
  seal_version: VERSION,
  status: "TOTAL_PUBLIC_STACK_CLOSURE_SEALED",
  public_root: PUBLIC_URL,
  closure_url: `${PUBLIC_URL}/verification/PUBLIC_STACK_CLOSURE.json`,
  closure_seal_url: `${PUBLIC_URL}/verification/PUBLIC_STACK_CLOSURE_SEAL.json`,
  sealed_closure_sha256: closureSha,
  sealed_frame_count: frames.length,
  sealed_release_count: releases.length,
  sealed_total_public_artifact_count: closure.counts.total_public_artifact_count,
  sealed_gate_script_count: gateScripts.length,
  sealed_governance_report_count: governanceReports.length,
  sealed_atlas_sha256: fileSha("docs/verification/PUBLIC_VERIFICATION_ATLAS.json"),
  sealed_atlas_seal_sha256: fileSha("docs/verification/PUBLIC_VERIFICATION_ATLAS_SEAL.json"),
  sealed_branch_protection_readback_sha256: fileSha("reports/current/main-branch-protection-v0.8.0.json"),
  sealed_pages_readback_sha256: fileSha("reports/current/pages-config-v0.8.0.json")
};

writeJson("docs/verification/PUBLIC_STACK_CLOSURE.json", closure);
writeJson("verification/v0.8.0/PUBLIC_STACK_CLOSURE.json", closure);
writeJson("reports/current/public-stack-closure-v0.8.0.json", closure);

writeJson("docs/verification/PUBLIC_STACK_CLOSURE_SEAL.json", seal);
writeJson("verification/v0.8.0/PUBLIC_STACK_CLOSURE_SEAL.json", seal);
writeJson("reports/current/public-stack-closure-seal-v0.8.0.json", seal);

console.log("TRUTHFRAMER_PUBLIC_STACK_CLOSURE_GENERATED=true");
console.log(`STACK_FRAME_COUNT=${frames.length}`);
console.log(`STACK_RELEASE_COUNT=${releases.length}`);
console.log(`STACK_TOTAL_PUBLIC_ARTIFACT_COUNT=${closure.counts.total_public_artifact_count}`);
console.log(`STACK_CLOSURE_SHA256=${closureSha}`);
