#!/usr/bin/env node
const fs = require("fs");
const https = require("https");
const crypto = require("crypto");

const VERSION = "v1.5.0";
const STATUS = "PUBLIC_VERIFICATION_CAPSULE_BOUND";
const LOCAL = "capsule/TRUTHFRAMER_PUBLIC_VERIFICATION_CAPSULE.json";
const URL = "https://truthframer.github.io/truthframer-platform/capsule/TRUTHFRAMER_PUBLIC_VERIFICATION_CAPSULE.json";

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function fail(message) {
  console.error("TRUTHFRAMER_PUBLIC_VERIFICATION_CAPSULE_NETWORK_PASS=false");
  console.error("ERROR=" + message);
  process.exit(1);
}

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchBuffer(res.headers.location));
      }
      if (res.statusCode !== 200) return reject(new Error("HTTP " + res.statusCode + " " + url));
      const chunks = [];
      res.on("data", chunk => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    }).on("error", reject);
  });
}

(async () => {
  if (!fs.existsSync(LOCAL)) fail("missing local capsule");
  const local = JSON.parse(fs.readFileSync(LOCAL, "utf8"));
  const remoteBuffer = await fetchBuffer(URL);
  const remote = JSON.parse(remoteBuffer.toString("utf8"));

  if (remote.protocol !== "TRUTHFRAMER") fail("bad remote protocol");
  if (remote.version !== VERSION) fail("bad remote version");
  if (remote.status !== STATUS) fail("bad remote status");
  if (remote.capsule_sha256 !== local.capsule_sha256) fail("remote/local capsule sha mismatch");

  const clone = JSON.parse(JSON.stringify(remote));
  const claimed = clone.capsule_sha256;
  clone.capsule_sha256 = null;
  const recomputed = sha256Text(canonical(clone));
  if (claimed !== recomputed) fail("remote self hash mismatch");

  for (const artifact of remote.artifacts.filter(a => a.public_url)) {
    const body = await fetchBuffer(artifact.public_url);
    const observed = sha256Buffer(body);
    if (observed !== artifact.sha256) fail("public artifact sha mismatch " + artifact.id);
  }

  console.log("PUBLIC_VERIFICATION_CAPSULE_LIVE=true");
  console.log("TRUTHFRAMER_PUBLIC_VERIFICATION_CAPSULE_NETWORK_PASS=true");
  console.log("PUBLIC_VERIFICATION_CAPSULE_URL=" + URL);
  console.log("CAPSULE_SHA256=" + claimed);
})().catch(err => fail(err.message));
