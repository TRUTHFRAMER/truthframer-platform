#!/usr/bin/env node
const https = require("node:https");

const BASE = process.env.PUBLIC_URL || "https://truthframer.github.io/truthframer-platform";

const checks = [
  {
    name: "PUBLIC_DISTRIBUTION_EGRESS_FIREWALL_CERTIFICATE_LIVE",
    url: `${BASE}/verification/PUBLIC_DISTRIBUTION_EGRESS_FIREWALL_CERTIFICATE.json`,
    mustContain: "PUBLIC_DISTRIBUTION_EGRESS_FIREWALL_CERTIFIED"
  },
  {
    name: "PUBLIC_DISTRIBUTION_EGRESS_FIREWALL_CERTIFICATE_SEAL_LIVE",
    url: `${BASE}/verification/PUBLIC_DISTRIBUTION_EGRESS_FIREWALL_CERTIFICATE_SEAL.json`,
    mustContain: "PUBLIC_DISTRIBUTION_EGRESS_FIREWALL_CERTIFIED_SEALED"
  }
];

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "truthframer-public-distribution-egress-network-verifier" } }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => resolve({ statusCode: res.statusCode, body }));
    }).on("error", reject);
  });
}

(async () => {
  for (const check of checks) {
    const res = await get(check.url);
    if (res.statusCode !== 200 || !res.body.includes(check.mustContain)) {
      console.error(`TRUTHFRAMER_PUBLIC_DISTRIBUTION_EGRESS_NETWORK_FAIL=${check.name}:${res.statusCode}:${check.url}`);
      process.exit(1);
    }
    console.log(`${check.name}=true`);
  }

  console.log("TRUTHFRAMER_PUBLIC_DISTRIBUTION_EGRESS_NETWORK_PASS=true");
})().catch((err) => {
  console.error(`TRUTHFRAMER_PUBLIC_DISTRIBUTION_EGRESS_NETWORK_FAIL=${err.message}`);
  process.exit(1);
});
