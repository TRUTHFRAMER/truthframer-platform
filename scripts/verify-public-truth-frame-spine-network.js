#!/usr/bin/env node
const https = require("https");

const BASE = process.env.TRUTHFRAMER_PUBLIC_BASE || "https://truthframer.github.io/truthframer-platform";
const URL = `${BASE}/spine/TRUTH_FRAME_SYSTEM_SPINE.json`;

function fail(message) {
  console.error(`TRUTHFRAMER_PUBLIC_TRUTH_FRAME_SPINE_NETWORK_FAIL=${message}`);
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

  if (json.version !== "v1.1.0") fail(`VERSION:${json.version}`);
  if (json.status !== "TRUTH_FRAME_SYSTEM_SPINE_CANONICAL") fail(`STATUS:${json.status}`);
  if (!Array.isArray(json.frames) || json.frames.length < 4) fail(`FRAME_COUNT:${json.frames?.length}`);
  if (!json.spine_sha256 || typeof json.spine_sha256 !== "string") fail("MISSING_SPINE_SHA256");

  console.log("PUBLIC_TRUTH_FRAME_SYSTEM_SPINE_LIVE=true");
  console.log("TRUTHFRAMER_PUBLIC_TRUTH_FRAME_SPINE_NETWORK_PASS=true");
  console.log(`PUBLIC_TRUTH_FRAME_SYSTEM_SPINE_URL=${URL}`);
})();
