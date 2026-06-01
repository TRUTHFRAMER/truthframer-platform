#!/usr/bin/env node
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");

function fail(msg) {
  console.error(`TRUTHFRAMER_PRIVACY_PERIMETER_FAIL=${msg}`);
  process.exit(1);
}

const required = [
  "LICENSE.md",
  "NOTICE.md",
  "PRIVACY.md",
  "SECURITY.md",
  "CONTRIBUTING.md",
  ".gitignore",
  ".npmignore",
  ".dockerignore",
];

for (const file of required) {
  if (!fs.existsSync(file)) fail(`MISSING_REQUIRED_FILE:${file}`);
}

const license = fs.readFileSync("LICENSE.md", "utf8");
for (const phrase of [
  "Proprietary Source-Available License",
  "This project is not open source.",
  "No permission is granted",
  "No AI / Dataset / Model Training Grant",
  "All rights not expressly granted are reserved",
]) {
  if (!license.includes(phrase)) fail(`LICENSE_MISSING_PHRASE:${phrase}`);
}

let pkg = {};
try {
  pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
} catch {
  fail("PACKAGE_JSON_INVALID");
}

if (pkg.private !== true) fail("PACKAGE_NOT_PRIVATE_TRUE");
if (pkg.license !== "UNLICENSED") fail("PACKAGE_LICENSE_NOT_UNLICENSED");
if (!pkg.scripts || !pkg.scripts["verify:privacy-perimeter"]) {
  fail("PACKAGE_MISSING_VERIFY_PRIVACY_SCRIPT");
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);

const allowedEnvExamples = new Set([".env.example", ".env.template"]);

const forbiddenPathPatterns = [
  /(^|\/)\.env($|[.-])/i,
  /(^|\/)(secrets?|credentials?|creds?|vault|private|_private|confidential|classified)(\/|$)/i,
  /(^|\/)(id_rsa|id_dsa|id_ecdsa|id_ed25519)$/i,
  /\.(pem|key|p8|p12|pfx|jks|keystore|kdbx|ovpn|mobileprovision)$/i,
  /\.(sqlite|sqlite3|db|dump|bak|backup|bkp)$/i,
  /(^|\/)(\.aws|\.gcp|\.azure|\.kube|\.terraform)(\/|$)/i,
  /(^|\/)(terraform\.tfvars|terraform\.tfvars\.json|kubeconfig)$/i,
  /\.(tfstate|tfstate\..*)$/i,
];

for (const file of tracked) {
  if (allowedEnvExamples.has(file)) continue;
  for (const pattern of forbiddenPathPatterns) {
    if (pattern.test(file)) fail(`FORBIDDEN_TRACKED_PATH:${file}`);
  }
}

const secretPatterns = [
  [/-----BEGIN (RSA |DSA |EC |OPENSSH |)PRIVATE KEY-----/, "PRIVATE_KEY"],
  [/\bghp_[A-Za-z0-9_]{30,}\b/, "GITHUB_CLASSIC_TOKEN"],
  [/\bgithub_pat_[A-Za-z0-9_]{50,}\b/, "GITHUB_FINE_GRAINED_TOKEN"],
  [/\bAKIA[0-9A-Z]{16}\b/, "AWS_ACCESS_KEY_ID"],
  [/\bASIA[0-9A-Z]{16}\b/, "AWS_TEMP_ACCESS_KEY_ID"],
  [/\bsk-[A-Za-z0-9]{32,}\b/, "OPENAI_STYLE_SECRET"],
  [/\bxox[baprs]-[A-Za-z0-9-]{20,}\b/, "SLACK_TOKEN"],
  [/\bAIza[0-9A-Za-z\-_]{35}\b/, "GOOGLE_API_KEY"],
];

const skipContent = new Set(["scripts/verify-privacy-perimeter.js"]);

for (const file of tracked) {
  if (skipContent.has(file)) continue;
  let stat;
  try {
    stat = fs.statSync(file);
  } catch {
    continue;
  }
  if (!stat.isFile() || stat.size > 1024 * 1024) continue;

  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    continue;
  }

  for (const [pattern, name] of secretPatterns) {
    if (pattern.test(text)) fail(`SECRET_PATTERN:${name}:${file}`);
  }
}

console.log("TRUTHFRAMER_PRIVACY_PERIMETER_PASS=true");
console.log("LICENSE_POSTURE=PROPRIETARY_SOURCE_AVAILABLE_ALL_RIGHTS_RESERVED");
console.log(`TRACKED_FILE_COUNT=${tracked.length}`);
