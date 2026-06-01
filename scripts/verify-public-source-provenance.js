#!/usr/bin/env node
const fs = require("node:fs");

const VERSION = "v1.0.3";
const CERT = "PUBLIC_SOURCE_PROVENANCE_CERTIFICATE";

function fail(msg) {
  console.error(`TRUTHFRAMER_PUBLIC_SOURCE_PROVENANCE_FAIL=${msg}`);
  process.exit(1);
}

const certPath = `docs/verification/${CERT}.json`;
const versionedPath = `verification/${VERSION}/${CERT}.json`;

for (const file of [certPath, versionedPath]) {
  if (!fs.existsSync(file)) fail(`MISSING_CERTIFICATE:${file}`);
}

const cert = JSON.parse(fs.readFileSync(certPath, "utf8"));
const versioned = JSON.parse(fs.readFileSync(versionedPath, "utf8"));

if (JSON.stringify(cert) !== JSON.stringify(versioned)) fail("VERSIONED_CERTIFICATE_MISMATCH");
if (cert.certificate_version !== VERSION) fail("VERSION_MISMATCH");
if (cert.status !== "PUBLIC_SOURCE_PROVENANCE_CERTIFIED") fail("STATUS_MISMATCH");
if (cert.repository !== "TRUTHFRAMER/truthframer-platform") fail("REPOSITORY_MISMATCH");
if (cert.base_release !== "v1.0.2") fail("BASE_RELEASE_MISMATCH");
if (cert.package_private !== true) fail("PACKAGE_PRIVATE_NOT_TRUE");
if (cert.package_license !== "UNLICENSED") fail("PACKAGE_LICENSE_MISMATCH");
if (cert.forbidden_tracked_file_count !== 0) fail("FORBIDDEN_TRACKED_FILES_PRESENT");
if (!Array.isArray(cert.certified_objects) || cert.certified_objects.length < 10) fail("CERTIFIED_OBJECTS_INCOMPLETE");
if (!Array.isArray(cert.npm_pack_files) || cert.npm_pack_files.length !== cert.npm_pack_file_count) fail("NPM_PACK_LIST_MISMATCH");
if (!cert.main_commit_sha || !cert.main_tree_sha) fail("GIT_PROVENANCE_MISSING");

console.log("TRUTHFRAMER_PUBLIC_SOURCE_PROVENANCE_PASS=true");
console.log(`CERTIFICATE_VERSION=${VERSION}`);
console.log(`STATUS=${cert.status}`);
console.log(`TRACKED_FILE_COUNT=${cert.tracked_file_count}`);
console.log(`NPM_PACK_FILE_COUNT=${cert.npm_pack_file_count}`);
