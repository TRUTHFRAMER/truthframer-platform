const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const requiredFiles = [
"cases/tf-000001-cross-venue-prediction-lag/TRUTH_FRAME.json",
"cases/tf-000001-cross-venue-prediction-lag/SOURCE_MANIFEST.json",
"cases/tf-000001-cross-venue-prediction-lag/REPLAY_MANIFEST.json",
"apps/terminal/tf-000001.html",
"docs/index.html",
"docs/render/index.html",
"docs/.nojekyll"
];

function fail(msg) {
console.error(`TF000001_PUBLIC_SURFACE_FAIL=${msg}`);
process.exit(1);
}

for (const rel of requiredFiles) {
if (!fs.existsSync(path.join(root, rel))) fail(`MISSING_${rel}`);
}

const frame = JSON.parse(fs.readFileSync(path.join(root, "cases/tf-000001-cross-venue-prediction-lag/TRUTH_FRAME.json"), "utf8"));
const html = fs.readFileSync(path.join(root, "docs/render/index.html"), "utf8");

if (frame.object_type !== "TRUTH_FRAME") fail("BAD_FRAME_TYPE");
if (frame.frame_id !== "tf_000001") fail("BAD_FRAME_ID");

for (const requiredText of [
"TRUTHFRAMER",
"TF-000001",
"TRUTH_FRAME",
"No visual without source.",
"No investment advice",
"Cross-Venue State",
"Replay Timeline"
]) {
if (!html.includes(requiredText)) {
fail(`PUBLIC_HTML_MISSING_${requiredText.replaceAll(" ", "_")}`);
}
}

const readiness = {
object_type: "PUBLIC_SURFACE_READINESS",
frame_id: "tf_000001",
status: "READY_FOR_GITHUB_PAGES",
source_object: "cases/tf-000001-cross-venue-prediction-lag/TRUTH_FRAME.json",
rendered_surface: "apps/terminal/tf-000001.html",
docs_index: "docs/index.html",
docs_render: "docs/render/index.html",
checks: {
truth_frame_present: true,
source_manifest_present: true,
replay_manifest_present: true,
terminal_render_present: true,
docs_surface_present: true,
boundary_present: true
},
boundary: [
"not investment advice",
"not trade recommendation",
"not broker execution",
"valid only for declared sources and replay window"
]
};

fs.mkdirSync(path.join(root, "reports/current"), { recursive: true });
fs.writeFileSync(
path.join(root, "reports/current/tf-000001-public-surface-readiness.json"),
JSON.stringify(readiness, null, 2) + "\n"
);

console.log("TF-000001_PUBLIC_SURFACE_READY=true");
console.log("PUBLIC_SURFACE=docs/render/index.html");
console.log("READINESS=reports/current/tf-000001-public-surface-readiness.json");
