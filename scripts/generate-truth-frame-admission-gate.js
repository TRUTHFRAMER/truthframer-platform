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

function sha256File(p) {
  return sha256Buffer(read(p));
}

function sha256Text(text) {
  return sha256Buffer(Buffer.from(text, "utf8"));
}

function writeJson(p, value) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(p, value) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, value);
}

function normId(id) {
  return id.replace("_", "-");
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function idsFromText(text) {
  return uniqueSorted([...text.matchAll(/tf[-_]\d{6}/g)].map((m) => normId(m[0])));
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

function publicRenderPath(id) {
  return id === "tf-000001" ? "docs/render/index.html" : `docs/render/${id}/index.html`;
}

function expectedSequence(caseIds) {
  const numbers = caseIds.map((id) => Number(id.slice(3)));
  const max = Math.max(...numbers);
  return Array.from({ length: max }, (_, i) => `tf-${String(i + 1).padStart(6, "0")}`);
}

mustExist("cases");
mustExist("apps/terminal");
mustExist("registry/TRUTH_FRAME_REGISTRY.json");
mustExist("docs/registry/TRUTH_FRAME_REGISTRY.json");
mustExist("spine/TRUTH_FRAME_SYSTEM_SPINE.json");

const spine = readJson("spine/TRUTH_FRAME_SYSTEM_SPINE.json");
if (spine.status !== "TRUTH_FRAME_SYSTEM_SPINE_CANONICAL") {
  fail(`BAD_SPINE_STATUS:${spine.status}`);
}

const caseDirs = dirsMatching("cases", /^tf-\d{6}-/);
const caseMap = new Map(caseDirs.map((dir) => [dir.match(/^tf-\d{6}/)[0], dir]));
const caseIds = uniqueSorted([...caseMap.keys()]);

if (caseIds.length < 4) fail(`INSUFFICIENT_CASES:${caseIds.length}`);

const terminalIds = uniqueSorted(filesMatching("apps/terminal", /^tf-\d{6}\.html$/).map((f) => f.replace(".html", "")));

const renderDirIds = uniqueSorted(dirsMatching("docs/render", /^tf-\d{6}$/));
const publicRenderIds = uniqueSorted([
  ...(exists("docs/render/index.html") ? ["tf-000001"] : []),
  ...renderDirIds
]);

const docsCaseIds = uniqueSorted(dirsMatching("docs/case", /^tf-\d{6}$/));
const proofIds = uniqueSorted(dirsMatching("docs/proof", /^tf-\d{6}$/));

const registryIds = idsFromText(readText("registry/TRUTH_FRAME_REGISTRY.json"));
const docsRegistryIds = idsFromText(readText("docs/registry/TRUTH_FRAME_REGISTRY.json"));
const spineIds = uniqueSorted((spine.frames || []).map((frame) => frame.id));

const errors = [];

function requireSetMember(label, id, set) {
  if (!set.includes(id)) errors.push(`${label}_MISSING:${id}`);
}

function forbidOrphan(label, actual, allowed) {
  for (const id of actual) {
    if (!allowed.includes(id)) errors.push(`${label}_ORPHAN:${id}`);
  }
}

forbidOrphan("TERMINAL_RENDER", terminalIds, caseIds);
forbidOrphan("PUBLIC_RENDER", publicRenderIds, caseIds);
forbidOrphan("DOCS_CASE", docsCaseIds, caseIds);
forbidOrphan("PUBLIC_PROOF", proofIds, caseIds);
forbidOrphan("REGISTRY", registryIds, caseIds);
forbidOrphan("DOCS_REGISTRY", docsRegistryIds, caseIds);
forbidOrphan("SPINE", spineIds, caseIds);

const sequence = expectedSequence(caseIds);
if (JSON.stringify(caseIds) !== JSON.stringify(sequence)) {
  errors.push(`NON_CONTIGUOUS_FRAME_SEQUENCE:${caseIds.join(",")}`);
}

const admittedFrames = caseIds.map((id) => {
  const caseSlug = caseMap.get(id);
  const truthFramePath = `cases/${caseSlug}/TRUTH_FRAME.json`;
  const sourceManifestPath = `cases/${caseSlug}/SOURCE_MANIFEST.json`;
  const replayManifestPath = `cases/${caseSlug}/REPLAY_MANIFEST.json`;
  const terminalPath = `apps/terminal/${id}.html`;
  const publicRender = publicRenderPath(id);
  const docsCase = exists(`docs/case/${id}`) ? `docs/case/${id}` : null;
  const publicProof = exists(`docs/proof/${id}/PUBLIC_SURFACE_PROOF.json`) ? `docs/proof/${id}/PUBLIC_SURFACE_PROOF.json` : null;

  [
    truthFramePath,
    sourceManifestPath,
    replayManifestPath,
    terminalPath,
    publicRender
  ].forEach((p) => {
    if (!exists(p)) errors.push(`REQUIRED_FILE_MISSING:${id}:${p}`);
  });

  requireSetMember("REGISTRY", id, registryIds);
  requireSetMember("DOCS_REGISTRY", id, docsRegistryIds);
  requireSetMember("SPINE", id, spineIds);
  requireSetMember("TERMINAL_RENDER", id, terminalIds);
  requireSetMember("PUBLIC_RENDER", id, publicRenderIds);

  const truthFrameText = exists(truthFramePath) ? readText(truthFramePath) : "";
  if (!truthFrameText.includes(id) && !truthFrameText.includes(id.replace("-", "_"))) {
    errors.push(`TRUTH_FRAME_ID_NOT_SELF_DECLARED:${id}`);
  }

  return {
    id,
    case_slug: caseSlug,
    admission_status: "ADMITTED",
    required_surfaces: {
      truth_frame: truthFramePath,
      source_manifest: sourceManifestPath,
      replay_manifest: replayManifestPath,
      terminal_render: terminalPath,
      public_render: publicRender,
      registry: "registry/TRUTH_FRAME_REGISTRY.json",
      docs_registry: "docs/registry/TRUTH_FRAME_REGISTRY.json",
      spine: "spine/TRUTH_FRAME_SYSTEM_SPINE.json",
      docs_case: docsCase,
      public_surface_proof: publicProof
    },
    hashes: {
      truth_frame_sha256: exists(truthFramePath) ? sha256File(truthFramePath) : null,
      source_manifest_sha256: exists(sourceManifestPath) ? sha256File(sourceManifestPath) : null,
      replay_manifest_sha256: exists(replayManifestPath) ? sha256File(replayManifestPath) : null,
      terminal_render_sha256: exists(terminalPath) ? sha256File(terminalPath) : null,
      public_render_sha256: exists(publicRender) ? sha256File(publicRender) : null,
      public_surface_proof_sha256: publicProof ? sha256File(publicProof) : null
    }
  };
});

const gateCore = {
  version: VERSION,
  status: errors.length === 0 ? "TRUTH_FRAME_ADMISSION_GATE_CLOSED" : "TRUTH_FRAME_ADMISSION_GATE_OPEN_ERRORS",
  primary_object: "truth_frame",
  gate_function: "refuse_orphan_or_incomplete_truth_frame_surfaces",
  upstream_spine_status: spine.status,
  upstream_spine_sha256: spine.spine_sha256,
  admission_rules: [
    "A truth frame may not exist as a terminal render without a canonical case.",
    "A truth frame may not exist as a public render without a canonical case.",
    "A truth frame may not exist in the registry without a canonical case.",
    "A truth frame may not exist in the spine without a canonical case.",
    "A canonical case must contain TRUTH_FRAME.json, SOURCE_MANIFEST.json, and REPLAY_MANIFEST.json.",
    "Frame identifiers must remain unique and contiguous.",
    "Verification artifacts remain subordinate to admitted truth frames."
  ],
  counts: {
    admitted_truth_frame_count: admittedFrames.length,
    terminal_render_count: terminalIds.length,
    public_render_count: publicRenderIds.length,
    registry_frame_count: registryIds.length,
    spine_frame_count: spineIds.length,
    admission_error_count: errors.length
  },
  admitted_frames: admittedFrames,
  admission_errors: errors
};

const gate = {
  ...gateCore,
  gate_sha256: sha256Text(JSON.stringify(gateCore, null, 2))
};

writeJson("admission/TRUTH_FRAME_ADMISSION_GATE.json", gate);
writeJson("docs/admission/TRUTH_FRAME_ADMISSION_GATE.json", gate);
writeJson("reports/current/truth-frame-admission-gate-v1.2.0.json", gate);

const rows = admittedFrames.map((frame) => `
      <tr>
        <td>${frame.id}</td>
        <td>${frame.case_slug}</td>
        <td>${frame.admission_status}</td>
        <td><code>${frame.hashes.truth_frame_sha256}</code></td>
      </tr>`).join("");

writeText("docs/admission/index.html", `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>TRUTHFRAMER Truth Frame Admission Gate</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    html{background:#050505;color:#d6d6d6;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace}
    body{max-width:1180px;margin:0 auto;padding:48px 24px}
    h1{font-size:28px;letter-spacing:.08em;text-transform:uppercase;color:#f4f4f4}
    p{color:#9a9a9a;line-height:1.6}
    table{width:100%;border-collapse:collapse;margin-top:28px;font-size:12px}
    th,td{border-bottom:1px solid #242424;padding:12px 10px;text-align:left;vertical-align:top}
    th{color:#f0f0f0;text-transform:uppercase;letter-spacing:.08em}
    code{color:#bdbdbd;word-break:break-all}
    .closed{color:#cfcfcf}
    .muted{color:#7f7f7f}
  </style>
</head>
<body>
  <h1>TRUTH FRAME ADMISSION GATE</h1>
  <p>The admission gate refuses orphan or incomplete truth-frame materialization. A frame is admitted only when case, source manifest, replay manifest, terminal render, public render, registry, and spine agree.</p>
  <p><strong>Status:</strong> <span class="closed">${gate.status}</span><br><strong>Version:</strong> ${gate.version}<br><strong>Gate SHA256:</strong> <code>${gate.gate_sha256}</code></p>
  <table>
    <thead>
      <tr>
        <th>Frame</th>
        <th>Case</th>
        <th>Status</th>
        <th>Truth Frame SHA256</th>
      </tr>
    </thead>
    <tbody>${rows}
    </tbody>
  </table>
  <p class="muted">TRUTHFRAMER v1.2.0 — Truth Frame Admission Gate</p>
</body>
</html>
`);

console.log("TRUTHFRAMER_TRUTH_FRAME_ADMISSION_GATE_GENERATED=true");
console.log(`VERSION=${VERSION}`);
console.log(`STATUS=${gate.status}`);
console.log(`ADMITTED_TRUTH_FRAME_COUNT=${gate.counts.admitted_truth_frame_count}`);
console.log(`ADMISSION_ERROR_COUNT=${gate.counts.admission_error_count}`);
console.log(`GATE_SHA256=${gate.gate_sha256}`);

if (errors.length > 0) {
  for (const error of errors) console.error(`ADMISSION_ERROR=${error}`);
  process.exit(1);
}
