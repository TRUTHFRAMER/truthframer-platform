#!/usr/bin/env node
const https = require("https");

const BASE = process.env.TRUTHFRAMER_PUBLIC_BASE || "https://truthframer.github.io/truthframer-platform";
const URL = `${BASE}/admission/TRUTH_FRAME_ADMISSION_GATE.json`;

function fail(message) {
  console.error(`TRUTHFRAMER_PUBLIC_TRUTH_FRAME_ADMISSION_NETWORK_FAIL=${message}`);
  process.exit(1);
}

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "truthframer-verifier" } }, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP_${res.statusCode}`));
          return;
        }
        resolve(body);
      });
    }).on("error", reject);
  });
}

(async () => {
  let json;
  try {
    json = JSON.parse(await get(URL));
  } catch (error) {
    fail(`FETCH_OR_PARSE:${error.message}`);
  }

  if (json.version !== "v1.2.0") fail(`VERSION:${json.version}`);
  if (json.status !== "TRUTH_FRAME_ADMISSION_GATE_CLOSED") fail(`STATUS:${json.status}`);
  if (!Array.isArray(json.admitted_frames) || json.admitted_frames.length < 4) fail(`ADMITTED_COUNT:${json.admitted_frames?.length}`);
  if (Array.isArray(json.admission_errors) && json.admission_errors.length !== 0) fail(`ADMISSION_ERRORS:${json.admission_errors.join(",")}`);
  if (!json.gate_sha256 || typeof json.gate_sha256 !== "string") fail("MISSING_GATE_SHA256");

  console.log("PUBLIC_TRUTH_FRAME_ADMISSION_GATE_LIVE=true");
  console.log("TRUTHFRAMER_PUBLIC_TRUTH_FRAME_ADMISSION_NETWORK_PASS=true");
  console.log(`PUBLIC_TRUTH_FRAME_ADMISSION_GATE_URL=${URL}`);
})();
