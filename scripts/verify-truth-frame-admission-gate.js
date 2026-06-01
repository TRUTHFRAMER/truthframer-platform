#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const VERSION = "v1.2.0";

function fail(message) {
  console.error(`TRUTHFRAMER_TRUTH_FRAME_ADMISSION_GATE_FAIL=${message}`);
  process.exit(1);
}

function exists(p) {
  return fs.existsSync(p);
}

function mustExist(p) {
  if (!exists(p)) fail(`MISSING:${p}`);
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

function sha256Text(text) {
  return sha256Buffer(Buffer.from(text, "utf8"));
}

function sha256File(p) {
  return sha256Buffer(read(p));
}

function assertEqual(name, actual, expected) {
  if (actual !== expected) fail(`${name}:${actual}!=${expected}`);
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function idsFromText(text) {
  return uniqueSorted([...text.matchAll(/tf[-_]\d{6}/g)].map((m) => m[0].replace("_", "-")));
}

function dirsMatching(root, regex) {
  if (!exists(root)) return [];
  return fs.readdirSync(root)
    .filter((entry) => fs.statSync(path.join(root, entry)).isDirectory())
    .filter((entry) => regex.test(entry))
    .sort();
}

function filesMatching(root, regex) {
  if (!exists(root)) return [];
  return fs.readdirSync(root)
    .filter((entry) => fs.statSync(path.join(root, entry)).isFile())
    .filter((entry) => regex.test(entry))
    .sort();
}

const gate = readJson("admission/TRUTH_FRAME_ADMISSION_GATE.json");
const docsGate = readJson("docs/admission/TRUTH_FRAME_ADMISSION_GATE.json");
const reportGate = readJson("reports/current/truth-frame-admission-gate-v1.2.0.json");
const spine = readJson("spine/TRUTH_FRAME_SYSTEM_SPINE.json");

assertEqual("VERSION", gate.version, VERSION);
assertEqual("STATUS", gate.status, "TRUTH_FRAME_ADMISSION_GATE_CLOSED");
assertEqual("DOCS_GATE_MATCH", JSON.stringify(docsGate), JSON.stringify(gate));
assertEqual("REPORT_GATE_MATCH", JSON.stringify(reportGate), JSON.stringify(gate));
assertEqual("UPSTREAM_SPINE_STATUS", gate.upstream_spine_status, "TRUTH_FRAME_SYSTEM_SPINE_CANONICAL");
assertEqual("UPSTREAM_SPINE_SHA256", gate.upstream_spine_sha256, spine.spine_sha256);

const { gate_sha256, ...core } = gate;
assertEqual("GATE_SHA256", gate_sha256, sha256Text(JSON.stringify(core, null, 2)));

if (!Array.isArray(gate.admission_errors)) fail("ADMISSION_ERRORS_NOT_ARRAY");
if (gate.admission_errors.length !== 0) fail(`ADMISSION_ERRORS_PRESENT:${gate.admission_errors.join(",")}`);

const caseDirs = dirsMatching("cases", /^tf-\d{6}-/);
const caseIds = uniqueSorted(caseDirs.map((dir) => dir.match(/^tf-\d{6}/)[0]));
const terminalIds = uniqueSorted(filesMatching("apps/terminal", /^tf-\d{6}\.html$/).map((f) => f.replace(".html", "")));
const registryIds = idsFromText(readText("registry/TRUTH_FRAME_REGISTRY.json"));
const docsRegistryIds = idsFromText(readText("docs/registry/TRUTH_FRAME_REGISTRY.json"));
const spineIds = uniqueSorted((spine.frames || []).map((frame) => frame.id));

assertEqual("ADMITTED_COUNT", String(gate.counts.admitted_truth_frame_count), String(caseIds.length));
assertEqual("TERMINAL_COUNT", String(gate.counts.terminal_render_count), String(terminalIds.length));
assertEqual("REGISTRY_COUNT", String(gate.counts.registry_frame_count), String(registryIds.length));
assertEqual("SPINE_COUNT", String(gate.counts.spine_frame_count), String(spineIds.length));

for (const id of caseIds) {
  const admitted = gate.admitted_frames.find((frame) => frame.id === id);
  if (!admitted) fail(`ADMITTED_FRAME_MISSING:${id}`);

  const surfaces = admitted.required_surfaces;
  for (const key of ["truth_frame", "source_manifest", "replay_manifest", "terminal_render", "public_render"]) {
    if (!surfaces[key]) fail(`SURFACE_PATH_MISSING:${id}:${key}`);
    mustExist(surfaces[key]);
  }

  assertEqual(`${id}:TRUTH_FRAME_SHA`, admitted.hashes.truth_frame_sha256, sha256File(surfaces.truth_frame));
  assertEqual(`${id}:SOURCE_MANIFEST_SHA`, admitted.hashes.source_manifest_sha256, sha256File(surfaces.source_manifest));
  assertEqual(`${id}:REPLAY_MANIFEST_SHA`, admitted.hashes.replay_manifest_sha256, sha256File(surfaces.replay_manifest));
  assertEqual(`${id}:TERMINAL_RENDER_SHA`, admitted.hashes.terminal_render_sha256, sha256File(surfaces.terminal_render));
  assertEqual(`${id}:PUBLIC_RENDER_SHA`, admitted.hashes.public_render_sha256, sha256File(surfaces.public_render));

  if (!registryIds.includes(id)) fail(`REGISTRY_MISSING:${id}`);
  if (!docsRegistryIds.includes(id)) fail(`DOCS_REGISTRY_MISSING:${id}`);
  if (!spineIds.includes(id)) fail(`SPINE_MISSING:${id}`);
  if (!terminalIds.includes(id)) fail(`TERMINAL_MISSING:${id}`);
}

const html = readText("docs/admission/index.html");
if (!html.includes("TRUTH FRAME ADMISSION GATE")) fail("DOCS_ADMISSION_HTML_TITLE_MISSING");
for (const id of caseIds) {
  if (!html.includes(id)) fail(`DOCS_ADMISSION_HTML_FRAME_MISSING:${id}`);
}

console.log("TRUTHFRAMER_TRUTH_FRAME_ADMISSION_GATE_PASS=true");
console.log(`VERSION=${VERSION}`);
console.log(`STATUS=${gate.status}`);
console.log(`ADMITTED_TRUTH_FRAME_COUNT=${gate.counts.admitted_truth_frame_count}`);
console.log(`GATE_SHA256=${gate.gate_sha256}`);
