const fs = require("fs");

function fail(msg) {
console.error(`TRUTHFRAMER_README_PUBLIC_ENTRY_FAIL=${msg}`);
process.exit(1);
}

const readme = fs.readFileSync("README.md", "utf8");

for (const required of [
"[https://truthframer.github.io/truthframer-platform/render/](https://truthframer.github.io/truthframer-platform/render/)",
"[https://truthframer.github.io/truthframer-platform/frames/](https://truthframer.github.io/truthframer-platform/frames/)",
"[https://truthframer.github.io/truthframer-platform/registry/TRUTH_FRAME_REGISTRY.json](https://truthframer.github.io/truthframer-platform/registry/TRUTH_FRAME_REGISTRY.json)",
"[https://truthframer.github.io/truthframer-platform/status/truthframer-system-status.json](https://truthframer.github.io/truthframer-platform/status/truthframer-system-status.json)",
"[https://truthframer.github.io/truthframer-platform/proof/PUBLIC_SURFACE_PROOF.json](https://truthframer.github.io/truthframer-platform/proof/PUBLIC_SURFACE_PROOF.json)",
"[https://truthframer.github.io/truthframer-platform/case/tf-000001/TRUTH_FRAME.json](https://truthframer.github.io/truthframer-platform/case/tf-000001/TRUTH_FRAME.json)",
"LIVE_PUBLIC_TRUTH_FRAME",
"No visual without source.",
"No source without clock.",
"No clock without replay.",
"No replay without boundary.",
"No boundary without TRUTH_FRAME.",
"TRUTHFRAMER is not a broker",
"TRUTHFRAMER does not tell users what to trade",
"TRUTH_FRAME object",
"public registry"
]) {
if (!readme.includes(required)) {
fail(`MISSING_${required.replaceAll(" ", "_")}`);
}
}

console.log("TRUTHFRAMER_README_PUBLIC_ENTRY_PASS=true");
