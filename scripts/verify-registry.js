const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
}

function fail(msg) {
  console.error(`TRUTHFRAMER_REGISTRY_FAIL=${msg}`);
  process.exit(1);
}

const registry = readJson("registry/TRUTH_FRAME_REGISTRY.json");
const frame = readJson("cases/tf-000001-cross-venue-prediction-lag/TRUTH_FRAME.json");
const live = readJson("reports/current/tf-000001-public-surface-live.json");
const release = readJson("releases/v0.1.0/RELEASE_LEDGER.json");
const status = readJson("reports/current/truthframer-system-status.json");

if (registry.object_type !== "TRUTH_FRAME_REGISTRY") fail("BAD_REGISTRY_TYPE");
if (registry.current_frame !== "tf_000001") fail("BAD_CURRENT_FRAME");
if (!Array.isArray(registry.frames) || registry.frames.length < 1) fail("NO_FRAMES");
if (frame.object_type !== "TRUTH_FRAME") fail("BAD_FRAME_TYPE");
if (frame.frame_id !== registry.current_frame) fail("FRAME_ID_MISMATCH");
if (live.status !== "LIVE") fail("LIVE_PROOF_NOT_LIVE");
if (release.release !== "v0.1.0") fail("BAD_RELEASE_LEDGER");
if (release.frame_id !== registry.current_frame) fail("RELEASE_FRAME_MISMATCH");
if (status.current_frame !== registry.current_frame) fail("STATUS_CURRENT_FRAME_MISMATCH");

const first = registry.frames[0];
for (const rel of [
  first.truth_frame_path,
  first.source_manifest_path,
  first.replay_manifest_path,
  first.render_source_path,
  first.live_proof_path,
  first.release_ledger_path
]) {
  if (!fs.existsSync(path.join(root, rel))) fail(`REGISTRY_PATH_MISSING_${rel}`);
}

for (const urlField of ["public_url", "render_url", "proof_url", "case_object_url"]) {
  if (!String(first[urlField]).startsWith("https://truthframer.github.io/truthframer-platform")) {
    fail(`BAD_URL_${urlField}`);
  }
}

console.log("TRUTHFRAMER_REGISTRY_PASS=true");
console.log(`CURRENT_FRAME=${registry.current_frame}`);
console.log("PUBLIC_REGISTRY_READY=true");
console.log("SYSTEM_STATUS_READY=true");
