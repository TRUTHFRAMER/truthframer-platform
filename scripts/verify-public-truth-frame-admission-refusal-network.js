#!/usr/bin/env node
const https = require("https");

const BASE = process.env.TRUTHFRAMER_PUBLIC_BASE || "https://truthframer.github.io/truthframer-platform";
const URL = `${BASE}/admission/TRUTH_FRAME_ADMISSION_REFUSAL_PROOF.json`;

function fail(message) {
  console.error(`TRUTHFRAMER_PUBLIC_TRUTH_FRAME_ADMISSION_REFUSAL_NETWORK_FAIL=${message}`);
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

  if (json.version !== "v1.3.0") fail(`VERSION:${json.version}`);
  if (json.status !== "TRUTH_FRAME_ADMISSION_REFUSAL_PROVEN") fail(`STATUS:${json.status}`);
  if (json.scenario_count !== 5) fail(`SCENARIO_COUNT:${json.scenario_count}`);
  if (json.failed_scenario_count !== 0) fail(`FAILED_SCENARIO_COUNT:${json.failed_scenario_count}`);
  if (!Array.isArray(json.scenarios)) fail("SCENARIOS_NOT_ARRAY");
  for (const scenario of json.scenarios) {
    if (scenario.refusal_pass !== true) fail(`REFUSAL_NOT_PROVEN:${scenario.id}`);
  }
  if (!json.proof_sha256 || typeof json.proof_sha256 !== "string") fail("MISSING_PROOF_SHA256");

  console.log("PUBLIC_TRUTH_FRAME_ADMISSION_REFUSAL_PROOF_LIVE=true");
  console.log("TRUTHFRAMER_PUBLIC_TRUTH_FRAME_ADMISSION_REFUSAL_NETWORK_PASS=true");
  console.log(`PUBLIC_TRUTH_FRAME_ADMISSION_REFUSAL_PROOF_URL=${URL}`);
})();
