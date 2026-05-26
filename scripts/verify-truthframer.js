const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const caseDir = path.join(root, "cases/tf-000001-cross-venue-prediction-lag");

const framePath = path.join(caseDir, "TRUTH_FRAME.json");
const sourcePath = path.join(caseDir, "SOURCE_MANIFEST.json");
const replayPath = path.join(caseDir, "REPLAY_MANIFEST.json");
const readmePath = path.join(root, "README.md");

function fail(msg) {
  console.error(`TRUTHFRAMER_VERIFY_FAIL=${msg}`);
  process.exit(1);
}

for (const p of [framePath, sourcePath, replayPath, readmePath]) {
  if (!fs.existsSync(p)) fail(`MISSING_${path.basename(p)}`);
}

const frame = JSON.parse(fs.readFileSync(framePath, "utf8"));
const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const replay = JSON.parse(fs.readFileSync(replayPath, "utf8"));
const readme = fs.readFileSync(readmePath, "utf8");
const readmeLower = readme.toLowerCase();

const requiredFrameFields = [
  "object_type",
  "frame_id",
  "time_window",
  "market_scope",
  "source_manifest",
  "truth_layers",
  "visual_projections",
  "replay",
  "truth_score",
  "boundaries"
];

for (const field of requiredFrameFields) {
  if (!(field in frame)) fail(`TRUTH_FRAME_FIELD_MISSING_${field}`);
}

if (frame.object_type !== "TRUTH_FRAME") fail("OBJECT_TYPE_NOT_TRUTH_FRAME");
if (source.object_type !== "SOURCE_MANIFEST") fail("SOURCE_MANIFEST_BAD_TYPE");
if (replay.object_type !== "REPLAY_MANIFEST") fail("REPLAY_MANIFEST_BAD_TYPE");
if (replay.deterministic !== true) fail("REPLAY_NOT_DETERMINISTIC");

if (!Array.isArray(frame.boundaries) || frame.boundaries.length < 3) {
  fail("BOUNDARIES_TOO_THIN");
}

const frameBoundaryText = frame.boundaries.join(" ").toLowerCase();

if (!readmeLower.includes("no visual without source")) {
  fail("OPERATING_LAW_MISSING");
}

if (!readmeLower.includes("not a broker") && !frameBoundaryText.includes("not broker")) {
  fail("NON_BROKER_BOUNDARY_MISSING");
}

if (!readmeLower.includes("does not tell users what to trade")) {
  fail("NON_ADVICE_BOUNDARY_MISSING");
}

if (!frameBoundaryText.includes("not investment advice")) {
  fail("FRAME_NON_ADVICE_BOUNDARY_MISSING");
}

if (!frameBoundaryText.includes("not broker execution")) {
  fail("FRAME_NON_EXECUTION_BOUNDARY_MISSING");
}

console.log("TRUTHFRAMER_VERIFY_PASS=true");
console.log(`TRUTH_FRAME=${frame.frame_id}`);
console.log("SOURCE_MANIFEST_PRESENT=true");
console.log("REPLAY_MANIFEST_PRESENT=true");
console.log("OBJECT_SPINE_PRESENT=true");
console.log("NON_BROKER_BOUNDARY_PRESENT=true");
console.log("NON_ADVICE_BOUNDARY_PRESENT=true");
console.log("REPLAY_BOUNDARY_PRESENT=true");
