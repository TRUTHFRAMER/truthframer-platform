#!/usr/bin/env node
const https = require("node:https");

const urls = [
  ["PUBLIC_SOURCE_PROVENANCE_CERTIFICATE_LIVE", "https://truthframer.github.io/truthframer-platform/verification/PUBLIC_SOURCE_PROVENANCE_CERTIFICATE.json", "PUBLIC_SOURCE_PROVENANCE_CERTIFIED"],
  ["PUBLIC_SOURCE_PROVENANCE_CERTIFICATE_SEAL_LIVE", "https://truthframer.github.io/truthframer-platform/verification/PUBLIC_SOURCE_PROVENANCE_CERTIFICATE_SEAL.json", "PUBLIC_SOURCE_PROVENANCE_CERTIFIED_SEALED"]
];

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (d) => data += d);
      res.on("end", () => resolve({ status: res.statusCode, data }));
    }).on("error", reject);
  });
}

(async () => {
  for (const [name, url, needle] of urls) {
    const res = await get(url);
    if (res.status !== 200 || !res.data.includes(needle)) {
      console.error(`TRUTHFRAMER_PUBLIC_SOURCE_PROVENANCE_NETWORK_FAIL=${name}:${res.status}:${url}`);
      process.exit(1);
    }
    console.log(`${name}=true`);
  }
  console.log("TRUTHFRAMER_PUBLIC_SOURCE_PROVENANCE_NETWORK_PASS=true");
})().catch((e) => {
  console.error(`TRUTHFRAMER_PUBLIC_SOURCE_PROVENANCE_NETWORK_FAIL=${e.message}`);
  process.exit(1);
});
