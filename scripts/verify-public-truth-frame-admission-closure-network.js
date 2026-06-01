#!/usr/bin/env node
const https = require("https");

const BASE = process.env.TRUTHFRAMER_PUBLIC_BASE || "https://truthframer.github.io/truthframer-platform";
const URL = `${BASE}/admission/TRUTH_FRAME_ADMISSION_CLOSURE_SEAL.json`;

function fail(message) {
  console.error(`TRUTHFRAMER_PUBLIC_TRUTH_FRAME_ADMISSION_CLOSURE_NETWORK_FAIL=${message}`);
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

  if (json.version !== "v1.4.0") fail(`VERSION:${json.version}`);
  if (json.status !== "TRUTH_FRAME_ADMISSION_LAYER_CLOSED_AND_SEALED") fail(`STATUS:${json.status}`);
  if (json.primary_object !== "truth_frame") fail(`PRIMARY_OBJECT:${json.primary_object}`);
  if (json.closure_function !== "positive_admission_plus_negative_refusal") fail(`CLOSURE_FUNCTION:${json.closure_function}`);

  const gate = json.sealed_inputs && json.sealed_inputs.admission_gate;
  const refusal = json.sealed_inputs && json.sealed_inputs.admission_refusal_proof;
  if (!gate) fail("MISSING_GATE_INPUT");
  if (!refusal) fail("MISSING_REFUSAL_INPUT");

  if (gate.version !== "v1.2.0") fail(`GATE_VERSION:${gate.version}`);
  if (gate.status !== "TRUTH_FRAME_ADMISSION_GATE_CLOSED") fail(`GATE_STATUS:${gate.status}`);
  if (refusal.version !== "v1.3.0") fail(`REFUSAL_VERSION:${refusal.version}`);
  if (refusal.status !== "TRUTH_FRAME_ADMISSION_REFUSAL_PROVEN") fail(`REFUSAL_STATUS:${refusal.status}`);
  if (refusal.failed_scenario_count !== 0) fail(`REFUSAL_FAILED_SCENARIO_COUNT:${refusal.failed_scenario_count}`);
  if (!json.closure_seal_sha256) fail("MISSING_CLOSURE_SEAL_SHA256");

  console.log("PUBLIC_TRUTH_FRAME_ADMISSION_CLOSURE_SEAL_LIVE=true");
  console.log("TRUTHFRAMER_PUBLIC_TRUTH_FRAME_ADMISSION_CLOSURE_NETWORK_PASS=true");
  console.log(`PUBLIC_TRUTH_FRAME_ADMISSION_CLOSURE_SEAL_URL=${URL}`);
})();
