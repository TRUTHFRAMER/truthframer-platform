#!/usr/bin/env node
const fs = require("fs");
const crypto = require("crypto");
const cp = require("child_process");

const VERSION = "v1.5.0";
const STATUS = "PUBLIC_VERIFICATION_CAPSULE_BOUND";
const REPO = "TRUTHFRAMER/truthframer-platform";
const PAGES_BASE = "https://truthframer.github.io/truthframer-platform";
const CAPSULE_PATH = "capsule/TRUTHFRAMER_PUBLIC_VERIFICATION_CAPSULE.json";
const DOCS_CAPSULE_PATH = "docs/capsule/TRUTHFRAMER_PUBLIC_VERIFICATION_CAPSULE.json";
const REPORT_PATH = "reports/current/public-verification-capsule-v1.5.0.json";

function sh(cmd) {
  return cp.execSync(cmd, { encoding: "utf8" }).trim();
}

function sha256File(path) {
  return crypto.createHash("sha256").update(fs.readFileSync(path)).digest("hex");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

const mainSha = sh("git rev-parse HEAD");
const treeSha = sh("git rev-parse HEAD^{tree}");

const candidates = [
  {
    id: "truth_frame_system_spine",
    path: "spine/TRUTH_FRAME_SYSTEM_SPINE.json",
    public_path: "spine/TRUTH_FRAME_SYSTEM_SPINE.json",
    required: true
  },
  {
    id: "truth_frame_admission_gate",
    path: "admission/TRUTH_FRAME_ADMISSION_GATE.json",
    public_path: "admission/TRUTH_FRAME_ADMISSION_GATE.json",
    required: true
  },
  {
    id: "truth_frame_admission_refusal_proof",
    path: "admission/TRUTH_FRAME_ADMISSION_REFUSAL_PROOF.json",
    public_path: "admission/TRUTH_FRAME_ADMISSION_REFUSAL_PROOF.json",
    required: true
  },
  {
    id: "truth_frame_admission_closure_seal",
    path: "admission/TRUTH_FRAME_ADMISSION_CLOSURE_SEAL.json",
    public_path: "admission/TRUTH_FRAME_ADMISSION_CLOSURE_SEAL.json",
    required: true
  },
  {
    id: "release_ledger_v1_4_0",
    path: "releases/v1.4.0/RELEASE_LEDGER.json",
    public_path: null,
    required: true
  },
  {
    id: "release_ledger_report_v1_4_0",
    path: "reports/current/release-ledger-v1.4.0.json",
    public_path: null,
    required: false
  },
  {
    id: "admission_closure_report_v1_4_0",
    path: "reports/current/truth-frame-admission-closure-seal-v1.4.0.json",
    public_path: null,
    required: false
  },
  {
    id: "admission_refusal_report_v1_3_0",
    path: "reports/current/truth-frame-admission-refusal-proof-v1.3.0.json",
    public_path: null,
    required: false
  }
];

const missing = candidates.filter(a => a.required && !fs.existsSync(a.path));
if (missing.length) {
  console.error("TRUTHFRAMER_PUBLIC_VERIFICATION_CAPSULE_GENERATED=false");
  console.error("MISSING_REQUIRED_ARTIFACTS=" + missing.map(a => a.path).join(","));
  process.exit(1);
}

const artifacts = candidates
  .filter(a => fs.existsSync(a.path))
  .map(a => ({
    id: a.id,
    path: a.path,
    bytes: fs.statSync(a.path).size,
    sha256: sha256File(a.path),
    source_url: `https://raw.githubusercontent.com/${REPO}/${mainSha}/${a.path}`,
    public_url: a.public_path ? `${PAGES_BASE}/${a.public_path}` : null
  }));

const capsule = {
  protocol: "TRUTHFRAMER",
  version: VERSION,
  status: STATUS,
  role: "portable_public_verification_capsule",
  generated_at: new Date().toISOString(),
  repository: REPO,
  source: {
    branch: "main",
    commit_sha: mainSha,
    tree_sha: treeSha,
    base_release: "v1.4.0"
  },
  public_surface: {
    capsule_url: `${PAGES_BASE}/${CAPSULE_PATH}`,
    capsule_page_url: `${PAGES_BASE}/capsule/`
  },
  boundary: {
    no_brokerage_claim: true,
    no_financial_advice_claim: true,
    no_external_truth_claim: true,
    verification_scope: "public_artifact_integrity_and_reachability"
  },
  artifact_count: artifacts.length,
  artifacts,
  capsule_sha256: null
};

capsule.capsule_sha256 = sha256Text(canonical(capsule));

fs.mkdirSync("capsule", { recursive: true });
fs.mkdirSync("docs/capsule", { recursive: true });
fs.mkdirSync("reports/current", { recursive: true });

const json = JSON.stringify(capsule, null, 2) + "\n";
fs.writeFileSync(CAPSULE_PATH, json);
fs.writeFileSync(DOCS_CAPSULE_PATH, json);
fs.writeFileSync(REPORT_PATH, json);

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>TRUTHFRAMER Public Verification Capsule</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
:root { color-scheme: dark; }
body { margin: 0; background: #050505; color: #d8d8d8; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
main { max-width: 980px; margin: 0 auto; padding: 56px 24px; }
h1 { font-size: 18px; letter-spacing: .12em; font-weight: 500; color: #f2f2f2; }
p, li { color: #aaa; line-height: 1.6; }
code, pre { background: #101010; color: #e8e8e8; }
pre { padding: 18px; overflow: auto; border: 1px solid #222; }
a { color: #f2f2f2; }
.rule { height: 1px; background: #222; margin: 32px 0; }
</style>
</head>
<body>
<main>
<h1>TRUTHFRAMER PUBLIC VERIFICATION CAPSULE</h1>
<p>Portable public artifact-integrity capsule for TRUTHFRAMER ${VERSION}. This page does not claim market truth, brokerage status, advice, or external factual truth. It exposes the public verification perimeter.</p>
<div class="rule"></div>
<pre>{
  "version": "${capsule.version}",
  "status": "${capsule.status}",
  "artifact_count": ${capsule.artifact_count},
  "capsule_sha256": "${capsule.capsule_sha256}"
}</pre>
<p><a href="./TRUTHFRAMER_PUBLIC_VERIFICATION_CAPSULE.json">Open capsule JSON</a></p>
</main>
</body>
</html>
`;

fs.writeFileSync("docs/capsule/index.html", html);

console.log("TRUTHFRAMER_PUBLIC_VERIFICATION_CAPSULE_GENERATED=true");
console.log("VERSION=" + VERSION);
console.log("STATUS=" + STATUS);
console.log("ARTIFACT_COUNT=" + artifacts.length);
console.log("CAPSULE_SHA256=" + capsule.capsule_sha256);
