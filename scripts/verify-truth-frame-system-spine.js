#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const VERSION = "v1.1.0";

function fail(message) {
  console.error(`TRUTHFRAMER_TRUTH_FRAME_SYSTEM_SPINE_FAIL=${message}`);
  process.exit(1);
}

function mustExist(p) {
  if (!fs.existsSync(p)) fail(`MISSING:${p}`);
}

function read(p) {
  mustExist(p);
  return fs.readFileSync(p);
}

function readText(p) {
  return read(p).toString("utf8");
}

function readJson(p) {
  try {
    return JSON.parse(readText(p));
  } catch (error) {
    fail(`INVALID_JSON:${p}:${error.message}`);
  }
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sha256File(p) {
  return sha256Buffer(read(p));
}

function sha256Text(text) {
  return sha256Buffer(Buffer.from(text, "utf8"));
}

function assertEqual(name, actual, expected) {
  if (actual !== expected) fail(`${name}:${actual}!=${expected}`);
}

function collectFrames() {
  mustExist("cases");
  const registryText = readText("registry/TRUTH_FRAME_REGISTRY.json");
  const docsRegistryText = readText("docs/registry/TRUTH_FRAME_REGISTRY.json");

  return fs.readdirSync("cases")
    .filter((entry) => fs.statSync(path.join("cases", entry)).isDirectory())
    .filter((entry) => /^tf-\d{6}-/.test(entry))
    .sort()
    .map((caseDir) => {
      const id = caseDir.match(/^tf-\d{6}/)?.[0];
      if (!id) fail(`BAD_CASE_DIR:${caseDir}`);

      const registryId = id.replace("-", "_");
      if (!registryText.includes(id) && !registryText.includes(registryId)) fail(`REGISTRY_MISSING:${id}`);
      if (!docsRegistryText.includes(id) && !docsRegistryText.includes(registryId)) fail(`DOCS_REGISTRY_MISSING:${id}`);

      const framePath = `cases/${caseDir}/TRUTH_FRAME.json`;
      const sourcePath = `cases/${caseDir}/SOURCE_MANIFEST.json`;
      const replayPath = `cases/${caseDir}/REPLAY_MANIFEST.json`;
      const terminalPath = `apps/terminal/${id}.html`;
      const renderPath = id === "tf-000001" ? "docs/render/index.html" : `docs/render/${id}/index.html`;
      const proofPath = `docs/proof/${id}/PUBLIC_SURFACE_PROOF.json`;

      [framePath, sourcePath, replayPath, terminalPath, renderPath].forEach(mustExist);

      return {
        id,
        case_slug: caseDir,
        hashes: {
          truth_frame_sha256: sha256File(framePath),
          source_manifest_sha256: sha256File(sourcePath),
          replay_manifest_sha256: sha256File(replayPath),
          terminal_render_sha256: sha256File(terminalPath),
          public_render_sha256: sha256File(renderPath),
          public_surface_proof_sha256: fs.existsSync(proofPath) ? sha256File(proofPath) : null
        }
      };
    });
}

const spine = readJson("spine/TRUTH_FRAME_SYSTEM_SPINE.json");
const docsSpine = readJson("docs/spine/TRUTH_FRAME_SYSTEM_SPINE.json");
const reportSpine = readJson("reports/current/truth-frame-system-spine-v1.1.0.json");

assertEqual("VERSION", spine.version, VERSION);
assertEqual("STATUS", spine.status, "TRUTH_FRAME_SYSTEM_SPINE_CANONICAL");
assertEqual("DOCS_SPINE_MATCH", JSON.stringify(docsSpine), JSON.stringify(spine));
assertEqual("REPORT_SPINE_MATCH", JSON.stringify(reportSpine), JSON.stringify(spine));

const { spine_sha256, ...core } = spine;
assertEqual("SPINE_SHA256", spine_sha256, sha256Text(JSON.stringify(core, null, 2)));

const freshFrames = collectFrames();
if (freshFrames.length < 4) fail(`INSUFFICIENT_TRUTH_FRAMES:${freshFrames.length}`);
assertEqual("TRUTH_FRAME_COUNT", String(spine.counts.truth_frame_count), String(freshFrames.length));

for (const fresh of freshFrames) {
  const recorded = spine.frames.find((frame) => frame.id === fresh.id);
  if (!recorded) fail(`SPINE_FRAME_MISSING:${fresh.id}`);

  assertEqual(`${fresh.id}:TRUTH_FRAME_SHA256`, recorded.hashes.truth_frame_sha256, fresh.hashes.truth_frame_sha256);
  assertEqual(`${fresh.id}:SOURCE_MANIFEST_SHA256`, recorded.hashes.source_manifest_sha256, fresh.hashes.source_manifest_sha256);
  assertEqual(`${fresh.id}:REPLAY_MANIFEST_SHA256`, recorded.hashes.replay_manifest_sha256, fresh.hashes.replay_manifest_sha256);
  assertEqual(`${fresh.id}:TERMINAL_RENDER_SHA256`, recorded.hashes.terminal_render_sha256, fresh.hashes.terminal_render_sha256);
  assertEqual(`${fresh.id}:PUBLIC_RENDER_SHA256`, recorded.hashes.public_render_sha256, fresh.hashes.public_render_sha256);
}

const html = readText("docs/spine/index.html");
for (const frame of freshFrames) {
  if (!html.includes(frame.id)) fail(`DOCS_SPINE_HTML_MISSING_FRAME:${frame.id}`);
}

console.log("TRUTHFRAMER_TRUTH_FRAME_SYSTEM_SPINE_PASS=true");
console.log(`VERSION=${VERSION}`);
console.log(`STATUS=${spine.status}`);
console.log(`TRUTH_FRAME_COUNT=${spine.counts.truth_frame_count}`);
console.log(`SPINE_SHA256=${spine.spine_sha256}`);
