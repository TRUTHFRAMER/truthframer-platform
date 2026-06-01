#!/usr/bin/env node
const fs = require("node:fs");
const crypto = require("node:crypto");
const cp = require("node:child_process");
const path = require("node:path");

const VERSION = "v1.0.2";
const CERT = "PUBLIC_DISTRIBUTION_EGRESS_FIREWALL_CERTIFICATE";
const SEAL = "PUBLIC_DISTRIBUTION_EGRESS_FIREWALL_CERTIFICATE_SEAL";

function fail(msg) {
  console.error(`TRUTHFRAMER_PUBLIC_DISTRIBUTION_EGRESS_GENERATE_FAIL=${msg}`);
  process.exit(1);
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function writeJson(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n");
}

cp.execFileSync("node", ["scripts/verify-distribution-egress.js"], { stdio: "inherit" });

const reportPath = `reports/current/distribution-egress-${VERSION}.json`;
if (!fs.existsSync(reportPath)) fail(`MISSING_REPORT:${reportPath}`);

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
if (report.status !== "DISTRIBUTION_EGRESS_FIREWALL_PASS") fail("REPORT_STATUS_MISMATCH");

const certificate = {
  certificate_version: VERSION,
  status: "PUBLIC_DISTRIBUTION_EGRESS_FIREWALL_CERTIFIED",
  closes_over: "package, npm-pack, docker-context, tracked-file egress perimeter",
  package_private: report.package_private,
  package_license: report.package_license,
  package_name: report.package_name,
  tracked_file_count: report.tracked_file_count,
  npm_pack_file_count: report.npm_pack_file_count,
  pack_files_sha256: report.pack_files_sha256,
  report: {
    path: reportPath,
    sha256: sha256File(reportPath)
  },
  certified_ignore_files: report.ignore_files,
  deny_policy: report.deny_policy,
  public_paths: {
    certificate: `verification/${CERT}.json`,
    seal: `verification/${SEAL}.json`,
    versioned_certificate: `verification/${VERSION}/${CERT}.json`,
    versioned_seal: `verification/${VERSION}/${SEAL}.json`
  }
};

const certText = JSON.stringify(certificate, null, 2) + "\n";
const certHash = sha256Text(certText);

const seal = {
  seal_version: VERSION,
  status: "PUBLIC_DISTRIBUTION_EGRESS_FIREWALL_CERTIFIED_SEALED",
  sealed_certificate_sha256: certHash,
  certificate: `${CERT}.json`
};

writeJson(`docs/verification/${CERT}.json`, certificate);
writeJson(`verification/${VERSION}/${CERT}.json`, certificate);
writeJson(`reports/current/public-distribution-egress-firewall-certificate-${VERSION}.json`, certificate);

writeJson(`docs/verification/${SEAL}.json`, seal);
writeJson(`verification/${VERSION}/${SEAL}.json`, seal);
writeJson(`reports/current/public-distribution-egress-firewall-certificate-seal-${VERSION}.json`, seal);

console.log("TRUTHFRAMER_PUBLIC_DISTRIBUTION_EGRESS_FIREWALL_GENERATED=true");
console.log(`CERTIFICATE_VERSION=${VERSION}`);
console.log(`STATUS=${certificate.status}`);
console.log(`SEALED_CERTIFICATE_SHA256=${certHash}`);
