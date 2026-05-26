const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const htmlPath = path.join(root, "apps/terminal/tf-000001.html");
const framePath = path.join(root, "cases/tf-000001-cross-venue-prediction-lag/TRUTH_FRAME.json");

function fail(msg) {
  console.error(`TF000001_RENDER_FAIL=${msg}`);
  process.exit(1);
}

if (!fs.existsSync(htmlPath)) fail("HTML_MISSING");
if (!fs.existsSync(framePath)) fail("TRUTH_FRAME_MISSING");

const html = fs.readFileSync(htmlPath, "utf8");
const frame = JSON.parse(fs.readFileSync(framePath, "utf8"));

for (const required of [
  "TRUTHFRAMER",
  "TF-000001",
  "TRUTH_FRAME",
  "No visual without source.",
  "No investment advice",
  "Replay Timeline",
  "Cross-Venue State"
]) {
  if (!html.includes(required)) fail(`HTML_REQUIRED_TEXT_MISSING_${required.replaceAll(" ", "_")}`);
}

if (frame.object_type !== "TRUTH_FRAME") fail("BAD_FRAME_TYPE");
if (frame.frame_id !== "tf_000001") fail("BAD_FRAME_ID");

console.log("TF-000001_RENDER_PASS=true");
console.log("HTML_SURFACE=apps/terminal/tf-000001.html");
console.log("TRUTH_FRAME=tf_000001");
