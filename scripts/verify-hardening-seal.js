const fs = require("fs");

function fail(msg) {
  console.error(`TRUTHFRAMER_HARDENING_SEAL_FAIL=${msg}`);
  process.exit(1);
}

const seal = JSON.parse(fs.readFileSync("hardening/v0.4.2/REPOSITORY_HARDENING_SEAL.json", "utf8"));

if (seal.object_type !== "TRUTHFRAMER_REPOSITORY_HARDENING_SEAL") fail("BAD_OBJECT_TYPE");
if (seal.seal_version !== "v0.4.2") fail("BAD_VERSION");
if (seal.status !== "PROTECTED_PUBLIC_SYSTEM") fail("BAD_STATUS");
if (seal.default_branch !== "main") fail("BAD_DEFAULT_BRANCH");
if (seal.frame_count !== 4) fail("BAD_FRAME_COUNT");
if (!seal.branch_protection.required_status_checks) fail("STATUS_CHECKS_FALSE");
if (!seal.branch_protection.strict_status_checks) fail("STRICT_FALSE");
if (!seal.branch_protection.enforce_admins) fail("ADMINS_FALSE");
if (!seal.branch_protection.required_pull_request_reviews) fail("REVIEWS_FALSE");
if (!seal.branch_protection.required_linear_history) fail("LINEAR_FALSE");
if (seal.branch_protection.allow_force_pushes !== false) fail("FORCE_PUSH_BAD");
if (seal.branch_protection.allow_deletions !== false) fail("DELETIONS_BAD");
if (seal.pages.source_branch !== "gh-pages") fail("BAD_PAGES_BRANCH");
if (!seal.audit_seal_url.includes("PUBLIC_SYSTEM_AUDIT_SEAL.json")) fail("BAD_AUDIT_URL");
for (const tag of ["v0.1.0", "v0.2.0", "v0.3.0", "v0.4.0", "v0.4.1"]) {
  if (!seal.release_chain.includes(tag)) fail(`MISSING_RELEASE_${tag}`);
}

console.log("TRUTHFRAMER_HARDENING_SEAL_PASS=true");
console.log("SEAL_VERSION=v0.4.2");
console.log("STATUS=PROTECTED_PUBLIC_SYSTEM");
