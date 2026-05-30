#!/usr/bin/env node
const { execFileSync } = require("node:child_process");

const ORG = "TRUTHFRAMER";
const REPO = "truthframer-platform";
const PUBLIC_URL = "https://truthframer.github.io/truthframer-platform";

function fail(code) {
  console.error(`TRUTHFRAMER_PUBLIC_NETWORK_VERIFIER_FAIL=${code}`);
  process.exit(1);
}

function token() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  try {
    return execFileSync("gh", ["auth", "token"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

const ghToken = token();

async function get(url, auth = false) {
  const headers = {
    "User-Agent": "truthframer-public-network-verifier",
    "Accept": auth ? "application/vnd.github+json" : "*/*"
  };
  if (auth && ghToken) headers.Authorization = `Bearer ${ghToken}`;

  try {
    const res = await fetch(url, { method: "GET", redirect: "follow", headers });
    const text = await res.text().catch(() => "");
    return { ok: res.status >= 200 && res.status < 300, status: res.status, url, text };
  } catch (err) {
    return { ok: false, status: `ERR_${err.name || "FETCH"}`, url, text: "" };
  }
}

async function requirePublic(name, url, contains = null) {
  const r = await get(url, false);
  if (!r.ok) fail(`HTTP_${r.status}:${url}`);
  if (contains && !r.text.includes(contains)) fail(`CONTENT_MISSING_${name}:${contains}`);
  console.log(`${name}=true`);
}

async function requireRelease(tag) {
  const api = `https://api.github.com/repos/${ORG}/${REPO}/releases/tags/${tag}`;
  const html = `https://github.com/${ORG}/${REPO}/releases/tag/${tag}`;

  const viaApi = await get(api, true);
  if (!viaApi.ok) {
    const viaHtml = await get(html, false);
    if (!viaHtml.ok) fail(`RELEASE_${tag}_UNREACHABLE:API_${viaApi.status}:HTML_${viaHtml.status}`);
  }

  const label = tag.toUpperCase().replace(/^V/, "V").replace(/[.-]/g, "_");
  console.log(`RELEASE_${label}_LIVE=true`);
}

(async () => {
  await requirePublic("TF_000001_PUBLIC_NETWORK_PASS", `${PUBLIC_URL}/render/`);
  await requirePublic("TF_000002_PUBLIC_NETWORK_PASS", `${PUBLIC_URL}/render/tf-000002/`);
  await requirePublic("TF_000003_PUBLIC_NETWORK_PASS", `${PUBLIC_URL}/render/tf-000003/`);
  await requirePublic("TF_000004_PUBLIC_NETWORK_PASS", `${PUBLIC_URL}/render/tf-000004/`);

  await requirePublic("TF_000001_CASE_LIVE", `${PUBLIC_URL}/case/tf-000001/TRUTH_FRAME.json`, "tf_000001");
  await requirePublic("TF_000002_CASE_LIVE", `${PUBLIC_URL}/case/tf-000002/TRUTH_FRAME.json`, "tf_000002");
  await requirePublic("TF_000003_CASE_LIVE", `${PUBLIC_URL}/case/tf-000003/TRUTH_FRAME.json`, "tf_000003");
  await requirePublic("TF_000004_CASE_LIVE", `${PUBLIC_URL}/case/tf-000004/TRUTH_FRAME.json`, "tf_000004");

  await requirePublic("PUBLIC_ROOT_LIVE", `${PUBLIC_URL}/`);
  await requirePublic("PUBLIC_FRAMES_LIVE", `${PUBLIC_URL}/frames/`);
  await requirePublic("PUBLIC_REGISTRY_LIVE", `${PUBLIC_URL}/registry/TRUTH_FRAME_REGISTRY.json`);
  await requirePublic("PUBLIC_STATUS_LIVE", `${PUBLIC_URL}/status/truthframer-system-status.json`);
  await requirePublic("PUBLIC_AUDIT_SEAL_LIVE", `${PUBLIC_URL}/audit/PUBLIC_SYSTEM_AUDIT_SEAL.json`, "TRUTHFRAMER");
  await requirePublic("PUBLIC_HARDENING_SEAL_LIVE", `${PUBLIC_URL}/audit/REPOSITORY_HARDENING_SEAL.json`, "v0.4.2");
  await requirePublic("PUBLIC_VERIFICATION_PAGE_LIVE", `${PUBLIC_URL}/verification/`);
  await requirePublic("PUBLIC_NETWORK_SEAL_LIVE", `${PUBLIC_URL}/verification/PUBLIC_NETWORK_VERIFICATION_SEAL.json`, "v0.5.1");
  await requirePublic("PUBLIC_VERIFICATION_INDEX_LIVE", `${PUBLIC_URL}/verification/PUBLIC_VERIFICATION_INDEX.json`, "v0.6.0");
  await requirePublic("PUBLIC_VERIFICATION_INDEX_SEAL_LIVE", `${PUBLIC_URL}/verification/PUBLIC_VERIFICATION_INDEX_SEAL.json`, "v0.6.1");
  await requirePublic("PUBLIC_VERIFICATION_ATLAS_LIVE", `${PUBLIC_URL}/verification/PUBLIC_VERIFICATION_ATLAS.json`, "v0.7.0");
  await requirePublic("PUBLIC_VERIFICATION_ATLAS_SEAL_LIVE", `${PUBLIC_URL}/verification/PUBLIC_VERIFICATION_ATLAS_SEAL.json`, "v0.7.0");
  await requirePublic("PUBLIC_STACK_CLOSURE_LIVE", `${PUBLIC_URL}/verification/PUBLIC_STACK_CLOSURE.json`, "v0.8.0");
  await requirePublic("PUBLIC_STACK_CLOSURE_SEAL_LIVE", `${PUBLIC_URL}/verification/PUBLIC_STACK_CLOSURE_SEAL.json`, "v0.8.0");

  for (const tag of [
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
    "v0.7.0"
  ]) {
    await requireRelease(tag);
  }

  console.log("TRUTHFRAMER_PUBLIC_NETWORK_VERIFIER_PASS=true");
})().catch(err => fail(`UNCAUGHT:${err && err.message ? err.message : String(err)}`));
