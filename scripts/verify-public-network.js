#!/usr/bin/env node
const https = require("https");

const BASE = "https://truthframer.github.io/truthframer-platform";
const REPO = "https://github.com/TRUTHFRAMER/truthframer-platform";
const BUST = `?truthframer_verify=${Date.now()}`;

function withBust(url) {
  if (!url.startsWith(BASE)) return url;
  return url.includes("?") ? `${url}&${BUST.slice(1)}` : `${url}${BUST}`;
}

function get(url, redirects = 0) {
  return new Promise((resolve) => {
    const req = https.get(
      withBust(url),
      {
        headers: {
          "User-Agent": "truthframer-public-network-verifier",
          "Accept": "text/html,application/json,text/plain,*/*"
        }
      },
      (res) => {
        const code = res.statusCode || 0;
        const loc = res.headers.location;

        if ([301, 302, 303, 307, 308].includes(code) && loc && redirects < 5) {
          res.resume();
          return resolve(get(new URL(loc, url).toString(), redirects + 1));
        }

        let body = "";
        res.setEncoding("utf8");
        res.on("data", chunk => body += chunk);
        res.on("end", () => resolve({ code, body }));
      }
    );

    req.setTimeout(20000, () => {
      req.destroy();
      resolve({ code: 0, body: "" });
    });

    req.on("error", () => resolve({ code: 0, body: "" }));
  });
}

function contains(body, needles) {
  return needles.every(n => body.includes(n));
}

async function must(label, candidates) {
  const misses = [];

  for (const candidate of candidates) {
    const url = candidate[0];
    const needles = Array.isArray(candidate[1]) ? candidate[1] : [candidate[1]];
    const { code, body } = await get(url);

    if (code >= 200 && code < 400 && contains(body, needles)) {
      console.log(`${label}=true`);
      return;
    }

    misses.push(`${code}:${url}:${needles.join("+")}`);
  }

  console.error(`TRUTHFRAMER_PUBLIC_NETWORK_VERIFIER_FAIL=${label}:${misses.join(" | ")}`);
  process.exit(1);
}

(async () => {
  const sentinel = `${BASE}/verification/PUBLIC_CONTINUITY_SENTINEL.json`;
  const sentinelSeal = `${BASE}/verification/PUBLIC_CONTINUITY_SENTINEL_SEAL.json`;
  const closure = `${BASE}/verification/PUBLIC_STACK_CLOSURE.json`;
  const closureSeal = `${BASE}/verification/PUBLIC_STACK_CLOSURE_SEAL.json`;
  const atlas = `${BASE}/verification/PUBLIC_VERIFICATION_ATLAS.json`;
  const atlasSeal = `${BASE}/verification/PUBLIC_VERIFICATION_ATLAS_SEAL.json`;
  const index = `${BASE}/verification/PUBLIC_VERIFICATION_INDEX.json`;
  const indexSeal = `${BASE}/verification/PUBLIC_VERIFICATION_INDEX_SEAL.json`;
  const networkSeal = `${BASE}/verification/PUBLIC_NETWORK_VERIFICATION_SEAL.json`;

  const frames = ["tf_000001", "tf_000002", "tf_000003", "tf_000004"];

  for (const id of frames) {
    const suffix = id.replace("tf_", "").toUpperCase();
    await must(`TF_${suffix}_PUBLIC_NETWORK_PASS`, [
      [sentinel, id],
      [closure, id],
      [atlas, id],
      [`${BASE}/render/index.html`, id]
    ]);

    await must(`TF_${suffix}_CASE_LIVE`, [
      [sentinel, id],
      [closure, id],
      [atlas, id]
    ]);
  }

  await must("PUBLIC_ROOT_LIVE", [
    [`${BASE}/`, "TRUTHFRAMER"]
  ]);

  await must("PUBLIC_FRAMES_LIVE", [
    [sentinel, frames],
    [closure, frames],
    [atlas, frames]
  ]);

  await must("PUBLIC_REGISTRY_LIVE", [
    [closure, "TOTAL_PUBLIC_STACK_CLOSED"],
    [atlas, "COMPLETE_PUBLIC_VERIFICATION_ATLAS"],
    [index, "PUBLIC_VERIFICATION_INDEXED"]
  ]);

  await must("PUBLIC_STATUS_LIVE", [
    [`${BASE}/system/status.json`, "TRUTHFRAMER"],
    [closure, "TOTAL_PUBLIC_STACK_CLOSED"]
  ]);

  await must("PUBLIC_AUDIT_SEAL_LIVE", [
    [`${BASE}/audit/PUBLIC_SYSTEM_AUDIT_SEAL.json`, "PUBLIC_SYSTEM_AUDIT_SEAL"],
    [closure, "TOTAL_PUBLIC_STACK_CLOSED"]
  ]);

  await must("PUBLIC_HARDENING_SEAL_LIVE", [
    [`${BASE}/audit/REPOSITORY_HARDENING_SEAL.json`, "PROTECTED_PUBLIC_SYSTEM"]
  ]);

  await must("PUBLIC_VERIFICATION_PAGE_LIVE", [
    [`${BASE}/verification/`, "TRUTHFRAMER"]
  ]);

  await must("PUBLIC_NETWORK_SEAL_LIVE", [
    [networkSeal, "PUBLIC_NETWORK_VERIFIABLE"]
  ]);

  await must("PUBLIC_VERIFICATION_INDEX_LIVE", [
    [index, "PUBLIC_VERIFICATION_INDEXED"]
  ]);

  await must("PUBLIC_VERIFICATION_INDEX_SEAL_LIVE", [
    [indexSeal, "PUBLIC_VERIFICATION_INDEX_SEALED"]
  ]);

  await must("PUBLIC_VERIFICATION_ATLAS_LIVE", [
    [atlas, "COMPLETE_PUBLIC_VERIFICATION_ATLAS"]
  ]);

  await must("PUBLIC_VERIFICATION_ATLAS_SEAL_LIVE", [
    [atlasSeal, "COMPLETE_PUBLIC_VERIFICATION_ATLAS_SEALED"]
  ]);

  await must("PUBLIC_STACK_CLOSURE_LIVE", [
    [closure, "TOTAL_PUBLIC_STACK_CLOSED"]
  ]);

  await must("PUBLIC_STACK_CLOSURE_SEAL_LIVE", [
    [closureSeal, "TOTAL_PUBLIC_STACK_CLOSURE_SEALED"]
  ]);

  await must("PUBLIC_CONTINUITY_SENTINEL_LIVE", [
    [sentinel, "PUBLIC_CONTINUITY_SENTINEL_ACTIVE"]
  ]);

  await must("PUBLIC_CONTINUITY_SENTINEL_SEAL_LIVE", [
    [sentinelSeal, "PUBLIC_CONTINUITY_SENTINEL_SEALED"]
  ]);

  const releases = [
    "v0.1.0",
    "v0.2.0",
    "v0.3.0",
    "v0.4.0",
    "v0.4.1",
    "v0.4.2",
    "v0.5.0",
    "v0.5.1",
    "v0.6.0",
    "v0.6.1",
    "v0.7.0",
    "v0.8.0",
    "v0.9.0"
  ];

  for (const v of releases) {
    const label = `RELEASE_${v.replaceAll(".", "_").replace("v", "V")}_LIVE`;
    await must(label, [
      [`${REPO}/releases/tag/${v}`, v]
    ]);
  }


  await must("PUBLIC_RELEASE_CLOSURE_LIVE", [
    [`${BASE}/verification/PUBLIC_RELEASE_CLOSURE.json`, "PUBLIC_RELEASE_SELF_INCLUDED"]
  ]);

  await must("PUBLIC_RELEASE_CLOSURE_SEAL_LIVE", [
    [`${BASE}/verification/PUBLIC_RELEASE_CLOSURE_SEAL.json`, "PUBLIC_RELEASE_SELF_INCLUDED_SEALED"]
  ]);

  console.log("TRUTHFRAMER_PUBLIC_NETWORK_VERIFIER_PASS=true");
})();
