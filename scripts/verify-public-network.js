#!/usr/bin/env node
const https = require("node:https");

const PUBLIC = "https://truthframer.github.io/truthframer-platform";
const API = "https://api.github.com/repos/TRUTHFRAMER/truthframer-platform";

const frames = [
  ["tf_000001", "/render/", "/case/tf-000001/TRUTH_FRAME.json", "/proof/PUBLIC_SURFACE_PROOF.json"],
  ["tf_000002", "/render/tf-000002/", "/case/tf-000002/TRUTH_FRAME.json", "/proof/tf-000002/PUBLIC_SURFACE_PROOF.json"],
  ["tf_000003", "/render/tf-000003/", "/case/tf-000003/TRUTH_FRAME.json", "/proof/tf-000003/PUBLIC_SURFACE_PROOF.json"],
  ["tf_000004", "/render/tf-000004/", "/case/tf-000004/TRUTH_FRAME.json", "/proof/tf-000004/PUBLIC_SURFACE_PROOF.json"]
];

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        "User-Agent": "TRUTHFRAMER-public-network-verifier",
        "Accept": "application/json,text/html,text/plain,*/*"
      }
    }, res => {
      let out = "";
      res.setEncoding("utf8");
      res.on("data", x => out += x);
      res.on("end", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP_${res.statusCode}:${url}`));
          return;
        }
        resolve(out);
      });
    });
    req.on("error", reject);
    req.setTimeout(20000, () => req.destroy(new Error(`TIMEOUT:${url}`)));
  });
}

function must(label, text, terms) {
  for (const term of terms) {
    if (!text.includes(term)) throw new Error(`${label}_MISSING:${term}`);
  }
}

async function main() {
  const root = await get(`${PUBLIC}/`);
  must("ROOT", root, ["TRUTHFRAMER"]);

  const registry = await get(`${PUBLIC}/registry/TRUTH_FRAME_REGISTRY.json`);
  for (const [id] of frames) must("REGISTRY", registry, [id]);

  const status = await get(`${PUBLIC}/status/truthframer-system-status.json`);
  must("STATUS", status, ["TRUTHFRAMER"]);

  const audit = await get(`${PUBLIC}/audit/PUBLIC_SYSTEM_AUDIT_SEAL.json`);
  must("AUDIT", audit, ["v0.4.1"]);

  const hardening = await get(`${PUBLIC}/audit/REPOSITORY_HARDENING_SEAL.json`);
  must("HARDENING", hardening, ["v0.4.2", "PROTECTED_PUBLIC_SYSTEM"]);

  for (const [id, renderPath, casePath, proofPath] of frames) {
    const render = await get(`${PUBLIC}${renderPath}`);
    must(`RENDER_${id}`, render, ["TRUTHFRAMER"]);

    const object = await get(`${PUBLIC}${casePath}`);
    must(`CASE_${id}`, object, [id]);

    const proof = await get(`${PUBLIC}${proofPath}`);
    must(`PROOF_${id}`, proof, ["PUBLIC"]);

    console.log(`${id.toUpperCase()}_PUBLIC_NETWORK_PASS=true`);
  }

  for (const version of ["v0.1.0","v0.2.0","v0.3.0","v0.4.0","v0.4.1","v0.4.2"]) {
    const release = JSON.parse(await get(`${API}/releases/tags/${version}`));
    if (release.draft) throw new Error(`RELEASE_DRAFT:${version}`);
    if (release.prerelease) throw new Error(`RELEASE_PRERELEASE:${version}`);
    console.log(`RELEASE_${version.replaceAll(".", "_").toUpperCase()}_LIVE=true`);
  }

  console.log("TRUTHFRAMER_PUBLIC_NETWORK_VERIFIER_PASS=true");
}

main().catch(err => {
  console.error(`TRUTHFRAMER_PUBLIC_NETWORK_VERIFIER_FAIL=${err.message}`);
  process.exit(1);
});
