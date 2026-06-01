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

function writeJson(p, value) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(p, value) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, value);
}

mustExist("cases");
mustExist("apps/terminal");
mustExist("registry/TRUTH_FRAME_REGISTRY.json");
mustExist("docs/registry/TRUTH_FRAME_REGISTRY.json");
mustExist("docs/render/index.html");
mustExist("docs/frames/index.html");
mustExist("docs/status/truthframer-system-status.json");

const registryText = readText("registry/TRUTH_FRAME_REGISTRY.json");
const docsRegistryText = readText("docs/registry/TRUTH_FRAME_REGISTRY.json");

const caseDirs = fs.readdirSync("cases")
  .filter((entry) => fs.statSync(path.join("cases", entry)).isDirectory())
  .filter((entry) => /^tf-\d{6}-/.test(entry))
  .sort();

if (caseDirs.length < 4) fail(`INSUFFICIENT_TRUTH_FRAMES:${caseDirs.length}`);

const frames = caseDirs.map((caseDir) => {
  const idMatch = caseDir.match(/^tf-\d{6}/);
  if (!idMatch) fail(`BAD_CASE_DIR:${caseDir}`);

  const id = idMatch[0];
  const registryId = id.replace("-", "_");

  const framePath = `cases/${caseDir}/TRUTH_FRAME.json`;
  const sourcePath = `cases/${caseDir}/SOURCE_MANIFEST.json`;
  const replayPath = `cases/${caseDir}/REPLAY_MANIFEST.json`;
  const terminalPath = `apps/terminal/${id}.html`;
  const renderPath = id === "tf-000001" ? "docs/render/index.html" : `docs/render/${id}/index.html`;
  const docsCaseDir = `docs/case/${id}`;
  const proofPath = `docs/proof/${id}/PUBLIC_SURFACE_PROOF.json`;

  [framePath, sourcePath, replayPath, terminalPath, renderPath].forEach(mustExist);

  if (!registryText.includes(id) && !registryText.includes(registryId)) {
    fail(`REGISTRY_MISSING:${id}`);
  }

  if (!docsRegistryText.includes(id) && !docsRegistryText.includes(registryId)) {
    fail(`DOCS_REGISTRY_MISSING:${id}`);
  }

  return {
    id,
    case_slug: caseDir,
    canonical_files: {
      truth_frame: framePath,
      source_manifest: sourcePath,
      replay_manifest: replayPath,
      terminal_render: terminalPath,
      public_render: renderPath,
      docs_case: fs.existsSync(docsCaseDir) ? docsCaseDir : null,
      public_surface_proof: fs.existsSync(proofPath) ? proofPath : null
    },
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

const verificationFiles = fs.existsSync("docs/verification")
  ? fs.readdirSync("docs/verification").filter((f) => f.endsWith(".json")).sort()
  : [];

const releaseLedgers = fs.existsSync("releases")
  ? fs.readdirSync("releases")
      .filter((entry) => fs.existsSync(path.join("releases", entry, "RELEASE_LEDGER.json")))
      .sort()
  : [];

const spineCore = {
  version: VERSION,
  status: "TRUTH_FRAME_SYSTEM_SPINE_CANONICAL",
  generated_mode: "DETERMINISTIC",
  primary_object: "truth_frame",
  subordinate_surfaces: [
    "verification",
    "release_ledgers",
    "certificates",
    "seals",
    "reports",
    "public_pages"
  ],
  invariants: [
    "Every case must have a truth frame, source manifest, and replay manifest.",
    "Every truth frame must have a terminal render.",
    "Every truth frame must be represented in the registry.",
    "Every public render must resolve from the frame spine.",
    "Verification artifacts are subordinate evidence, not the primary system object."
  ],
  counts: {
    truth_frame_count: frames.length,
    verification_json_count: verificationFiles.length,
    release_ledger_count: releaseLedgers.length
  },
  frames
};

const spine = {
  ...spineCore,
  spine_sha256: sha256Text(JSON.stringify(spineCore, null, 2))
};

writeJson("spine/TRUTH_FRAME_SYSTEM_SPINE.json", spine);
writeJson("docs/spine/TRUTH_FRAME_SYSTEM_SPINE.json", spine);
writeJson("reports/current/truth-frame-system-spine-v1.1.0.json", spine);

const rows = frames.map((frame) => `
      <tr>
        <td>${frame.id}</td>
        <td>${frame.case_slug}</td>
        <td><code>${frame.hashes.truth_frame_sha256}</code></td>
        <td><code>${frame.hashes.source_manifest_sha256}</code></td>
        <td><code>${frame.hashes.replay_manifest_sha256}</code></td>
      </tr>`).join("");

writeText("docs/spine/index.html", `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>TRUTHFRAMER Truth Frame System Spine</title>
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
    .seal{margin-top:24px;color:#8a8a8a}
  </style>
</head>
<body>
  <h1>TRUTH FRAME SYSTEM SPINE</h1>
  <p>The primary object of TRUTHFRAMER is the truth frame. Verification, certificates, releases, reports, and public pages are subordinate evidence surfaces.</p>
  <p><strong>Status:</strong> ${spine.status}<br><strong>Version:</strong> ${spine.version}<br><strong>Spine SHA256:</strong> <code>${spine.spine_sha256}</code></p>
  <table>
    <thead>
      <tr>
        <th>Frame</th>
        <th>Case</th>
        <th>Truth Frame SHA256</th>
        <th>Source Manifest SHA256</th>
        <th>Replay Manifest SHA256</th>
      </tr>
    </thead>
    <tbody>${rows}
    </tbody>
  </table>
  <p class="seal">TRUTHFRAMER v1.1.0 — Truth Frame System Spine</p>
</body>
</html>
`);

console.log("TRUTHFRAMER_TRUTH_FRAME_SYSTEM_SPINE_GENERATED=true");
console.log(`VERSION=${VERSION}`);
console.log(`STATUS=${spine.status}`);
console.log(`TRUTH_FRAME_COUNT=${spine.counts.truth_frame_count}`);
console.log(`VERIFICATION_JSON_COUNT=${spine.counts.verification_json_count}`);
console.log(`RELEASE_LEDGER_COUNT=${spine.counts.release_ledger_count}`);
console.log(`SPINE_SHA256=${spine.spine_sha256}`);
