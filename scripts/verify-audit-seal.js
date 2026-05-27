const fs = require("fs");

function fail(msg) {
  console.error(`TRUTHFRAMER_AUDIT_SEAL_FAIL=${msg}`);
  process.exit(1);
}

const seal = JSON.parse(fs.readFileSync("audits/v0.4.1/PUBLIC_SYSTEM_AUDIT_SEAL.json", "utf8"));

if (seal.object_type !== "TRUTHFRAMER_PUBLIC_SYSTEM_AUDIT_SEAL") fail("BAD_OBJECT_TYPE");
if (seal.seal_version !== "v0.4.1") fail("BAD_SEAL_VERSION");
if (seal.status !== "SEALED_PUBLIC_SYSTEM") fail("BAD_STATUS");
if (seal.frame_count !== 4) fail("BAD_FRAME_COUNT");
if (!Array.isArray(seal.frames) || seal.frames.length !== 4) fail("FRAMES_NOT_FOUR");

for (const id of ["tf_000001", "tf_000002", "tf_000003", "tf_000004"]) {
  if (!seal.frames.some(f => f.frame_id === id)) fail(`MISSING_${id}`);
}

for (const pass of [
  "TRUTHFRAMER_VERIFY_PASS",
  "TF-000001_RENDER_PASS",
  "TF-000001_PUBLIC_SURFACE_READY",
  "TRUTHFRAMER_REGISTRY_PASS",
  "TRUTHFRAMER_README_PUBLIC_ENTRY_PASS",
  "TF-000002_VERIFY_PASS",
  "TF-000003_VERIFY_PASS",
  "TF-000004_VERIFY_PASS",
  "TRUTHFRAMER_PUBLIC_ROOT_PASS"
]) {
  if (!seal.verifier_passes.includes(pass)) fail(`MISSING_PASS_${pass}`);
}

if (!seal.machine_readable_surfaces.registry_url.includes("TRUTH_FRAME_REGISTRY.json")) fail("REGISTRY_URL_MISSING");
if (!seal.public_root.includes("truthframer.github.io/truthframer-platform")) fail("BAD_PUBLIC_ROOT");

console.log("TRUTHFRAMER_AUDIT_SEAL_PASS=true");
console.log("SEAL_VERSION=v0.4.1");
console.log("FRAME_COUNT=4");
