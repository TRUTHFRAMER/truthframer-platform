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
const status = readJson("reports/current/truthframer-system-status.json");

if (registry.object_type !== "TRUTH_FRAME_REGISTRY") fail("BAD_REGISTRY_TYPE");
if (registry.current_frame !== "tf_000001") fail("BAD_CURRENT_FRAME");
if (!Array.isArray(registry.frames) || registry.frames.length < 2) fail("FRAME_COUNT_TOO_LOW");

for (const frameId of ["tf_000001", "tf_000002"]) {
  const entry = registry.frames.find(f => f.frame_id === frameId);
  if (!entry) fail(`MISSING_FRAME_${frameId}`);

  const frame = readJson(entry.truth_frame_path);
  if (frame.object_type !== "TRUTH_FRAME") fail(`BAD_FRAME_TYPE_${frameId}`);
  if (frame.frame_id !== frameId) fail(`FRAME_ID_MISMATCH_${frameId}`);

  for (const rel of [
    entry.truth_frame_path,
    entry.source_manifest_path,
    entry.replay_manifest_path,
    entry.render_source_path
  ]) {
    if (!fs.existsSync(path.join(root, rel))) fail(`REGISTRY_PATH_MISSING_${rel}`);
  }

  for (const urlField of ["public_url", "render_url", "case_object_url"]) {
    if (!String(entry[urlField]).startsWith("https://truthframer.github.io/truthframer-platform")) {
      fail(`BAD_URL_${frameId}_${urlField}`);
    }
  }
}

if (status.frame_count < 2) fail("STATUS_FRAME_COUNT_TOO_LOW");

console.log("TRUTHFRAMER_REGISTRY_PASS=true");
console.log(`CURRENT_FRAME=${registry.current_frame}`);
console.log(`FRAME_COUNT=${registry.frames.length}`);
console.log("PUBLIC_REGISTRY_READY=true");
console.log("SYSTEM_STATUS_READY=true");
