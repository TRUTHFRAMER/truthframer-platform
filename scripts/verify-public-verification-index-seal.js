#!/usr/bin/env node
const fs = require("node:fs");
const crypto = require("node:crypto");

function fail(code) {
  console.error(`TRUTHFRAMER_PUBLIC_VERIFICATION_INDEX_SEAL_FAIL=${code}`);
  process.exit(1);
}

const sealPaths = [
  "verification/v0.6.1/PUBLIC_VERIFICATION_INDEX_SEAL.json",
  "docs/verification/PUBLIC_VERIFICATION_INDEX_SEAL.json",
  "reports/current/public-verification-index-seal-v0.6.1.json"
];

const indexPath = "docs/verification/PUBLIC_VERIFICATION_INDEX.json";

for (const p of sealPaths) if (!fs.existsSync(p)) fail(`MISSING:${p}`);
if (!fs.existsSync(indexPath)) fail("MISSING_PUBLIC_VERIFICATION_INDEX");

const seal = JSON.parse(fs.readFileSync(sealPaths[0], "utf8"));
const docsSeal = JSON.parse(fs.readFileSync(sealPaths[1], "utf8"));
const reportSeal = JSON.parse(fs.readFileSync(sealPaths[2], "utf8"));

if (JSON.stringify(seal) !== JSON.stringify(docsSeal)) fail("DOCS_COPY_DIVERGES");
if (JSON.stringify(seal) !== JSON.stringify(reportSeal)) fail("REPORT_COPY_DIVERGES");

const indexRaw = fs.readFileSync(indexPath, "utf8");
const index = JSON.parse(indexRaw);
const indexSha256 = crypto.createHash("sha256").update(indexRaw).digest("hex");

if (seal.object_type !== "TRUTHFRAMER_PUBLIC_VERIFICATION_INDEX_SEAL") fail("BAD_OBJECT_TYPE");
if (seal.seal_version !== "v0.6.1") fail("BAD_SEAL_VERSION");
if (seal.status !== "PUBLIC_VERIFICATION_INDEX_SEALED") fail("BAD_STATUS");
if (seal.sealed_index_version !== "v0.6.0") fail("BAD_SEALED_INDEX_VERSION");
if (seal.sealed_index_status !== "PUBLIC_VERIFICATION_INDEXED") fail("BAD_SEALED_INDEX_STATUS");
if (seal.sealed_index_sha256 !== indexSha256) fail("INDEX_HASH_MISMATCH");
if (index.object_type !== "TRUTHFRAMER_PUBLIC_VERIFICATION_INDEX") fail("BAD_INDEX_OBJECT_TYPE");
if (index.status !== "PUBLIC_VERIFICATION_INDEXED") fail("BAD_INDEX_STATUS");

for (const rel of ["v0.1.0","v0.2.0","v0.3.0","v0.4.0","v0.4.1","v0.4.2","v0.5.0","v0.5.1","v0.6.0"]) {
  if (!seal.verified_release_chain.includes(rel)) fail(`MISSING_RELEASE_${rel.replaceAll(".", "_")}`);
}

if (!seal.required_commands.includes("npm run verify:index-seal")) fail("MISSING_REQUIRED_COMMAND");

console.log("TRUTHFRAMER_PUBLIC_VERIFICATION_INDEX_SEAL_PASS=true");
console.log(`SEAL_VERSION=${seal.seal_version}`);
console.log(`STATUS=${seal.status}`);
console.log(`SEALED_INDEX_SHA256=${seal.sealed_index_sha256}`);
