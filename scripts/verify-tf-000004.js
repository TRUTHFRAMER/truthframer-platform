const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const caseDir = path.join(root, "cases/tf-000004-correlation-regime-break");

function fail(msg) {
  console.error(`TF000004_VERIFY_FAIL=${msg}`);
  process.exit(1);
}

for (const rel of ["TRUTH_FRAME.json", "SOURCE_MANIFEST.json", "REPLAY_MANIFEST.json"]) {
  if (!fs.existsSync(path.join(caseDir, rel))) fail(`MISSING_${rel}`);
}

const frame = JSON.parse(fs.readFileSync(path.join(caseDir, "TRUTH_FRAME.json"), "utf8"));
const htmlPath = path.join(root, "apps/terminal/tf-000004.html");

if (!fs.existsSync(htmlPath)) fail("HTML_MISSING");
const html = fs.readFileSync(htmlPath, "utf8");

if (frame.object_type !== "TRUTH_FRAME") fail("BAD_OBJECT_TYPE");
if (frame.frame_id !== "tf_000004") fail("BAD_FRAME_ID");
if (!frame.question.includes("relationships changed")) fail("QUESTION_MISSING_RELATIONSHIPS");
if (frame.replay.deterministic !== true) fail("REPLAY_NOT_DETERMINISTIC");

for (const required of [
  "TRUTHFRAMER",
  "TF-000004",
  "Correlation Regime Break",
  "Which relationships changed?",
  "Pre-Regime Matrix",
  "Post-Regime Matrix",
  "Correlation does not imply causation",
  "TRUTH_FRAME"
]) {
  if (!html.includes(required)) fail(`HTML_MISSING_${required.replaceAll(" ", "_")}`);
}

console.log("TF-000004_VERIFY_PASS=true");
console.log("TRUTH_FRAME=tf_000004");
console.log("HTML_SURFACE=apps/terminal/tf-000004.html");
