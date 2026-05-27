const fs = require("fs");

function fail(msg) {
  console.error(`TRUTHFRAMER_PUBLIC_ROOT_FAIL=${msg}`);
  process.exit(1);
}

const html = fs.readFileSync("docs/index.html", "utf8");

for (const required of [
  "TRUTHFRAMER",
  "TRUTHFRAMER turns markets into evidence",
  "TF-000001",
  "TF-000002",
  "TF-000003",
  "TF-000004",
  "TRUTH_FRAME registry",
  "System status",
  "No visual without source.",
  "TRUTHFRAMER_PUBLIC_ROOT_CONTROL_SURFACE=true",
  "TRUTHFRAMER is not a broker"
]) {
  if (!html.includes(required)) {
    fail(`MISSING_${required.replaceAll(" ", "_")}`);
  }
}

console.log("TRUTHFRAMER_PUBLIC_ROOT_PASS=true");
