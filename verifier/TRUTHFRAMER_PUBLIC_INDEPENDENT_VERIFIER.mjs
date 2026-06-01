const DEFAULTS = Object.freeze({
  version: "v1.7.0",
  capsuleUrl: "https://truthframer.github.io/truthframer-platform/capsule/TRUTHFRAMER_PUBLIC_VERIFICATION_CAPSULE.json",
  receiptUrl: "https://truthframer.github.io/truthframer-platform/receipt/TRUTHFRAMER_PUBLIC_CAPSULE_CONSUMPTION_RECEIPT.json"
});

export function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  const keys = Object.keys(value).sort();
  return "{" + keys.map((key) => JSON.stringify(key) + ":" + stableStringify(value[key])).join(",") + "}";
}

export async function sha256Hex(input) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;

  if (globalThis.crypto && globalThis.crypto.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(Buffer.from(bytes)).digest("hex");
}

function normalizeKey(key) {
  return String(key).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);
}

function asString(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function asBool(value) {
  if (value === true) return true;
  if (value === false) return false;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
}

function walk(value, path = [], out = []) {
  if (!value || typeof value !== "object") return out;

  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, path.concat(String(index)), out));
    return out;
  }

  for (const [key, child] of Object.entries(value)) {
    const itemPath = path.concat(key);
    out.push({
      key,
      normalizedKey: normalizeKey(key),
      normalizedPath: itemPath.map(normalizeKey).join("."),
      value: child
    });
    walk(child, itemPath, out);
  }

  return out;
}

function firstBoolBySemanticKey(root, names) {
  const wanted = new Set(names.map(normalizeKey));
  const hit = walk(root).find((entry) => wanted.has(entry.normalizedKey));
  return hit ? asBool(hit.value) : false;
}

function firstStringBySemanticKey(root, names) {
  const wanted = new Set(names.map(normalizeKey));
  const hit = walk(root).find((entry) => wanted.has(entry.normalizedKey));
  return hit ? asString(hit.value) : "";
}

function shaCandidates(root, predicate) {
  return walk(root)
    .filter((entry) => isSha256(entry.value))
    .filter(predicate)
    .map((entry) => ({
      key: entry.key,
      path: entry.normalizedPath,
      value: String(entry.value).toLowerCase()
    }));
}

function preferredSha(root, predicate) {
  const hits = shaCandidates(root, predicate);
  if (!hits.length) return "";
  const exact = hits.find((hit) => hit.path.split(".").length <= 3);
  return (exact || hits[0]).value;
}

function capsuleShaFromCapsule(capsuleJson) {
  return preferredSha(capsuleJson, (entry) => {
    const k = entry.normalizedKey;
    const p = entry.normalizedPath;
    return (
      k.endsWith("CAPSULESHA256") &&
      !p.includes("RAWBYTES") &&
      !p.includes("CANONICALJSON") &&
      !p.includes("WITHOUTSHAFIELDS") &&
      !p.includes("RECEIPT")
    );
  });
}

function capsuleShaFromReceipt(receiptJson) {
  return preferredSha(receiptJson, (entry) => {
    const k = entry.normalizedKey;
    const p = entry.normalizedPath;
    return (
      k.endsWith("CAPSULESHA256") &&
      !p.includes("RAWBYTES") &&
      !p.includes("CANONICALJSON") &&
      !p.includes("WITHOUTSHAFIELDS") &&
      !p.includes("RECEIPT")
    );
  });
}

function receiptShaFromReceipt(receiptJson) {
  return preferredSha(receiptJson, (entry) => {
    const k = entry.normalizedKey;
    const p = entry.normalizedPath;
    return (
      k.endsWith("RECEIPTSHA256") ||
      k.endsWith("CONSUMPTIONRECEIPTSHA256") ||
      p.endsWith("RECEIPTSHA256") ||
      p.endsWith("CONSUMPTIONRECEIPTSHA256")
    );
  });
}

async function fetchPublicJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`PUBLIC_FETCH_FAILED url=${url} status=${response.status}`);
  }

  return {
    url,
    status: response.status,
    text,
    json: JSON.parse(text),
    raw_bytes_sha256: await sha256Hex(text),
    canonical_json_sha256: await sha256Hex(stableStringify(JSON.parse(text)))
  };
}

export async function verifyTruthframerPublicIndependently(config = {}) {
  const capsuleUrl = config.capsuleUrl || DEFAULTS.capsuleUrl;
  const receiptUrl = config.receiptUrl || DEFAULTS.receiptUrl;

  const capsule = await fetchPublicJson(capsuleUrl);
  const receipt = await fetchPublicJson(receiptUrl);

  const capsuleDeclaredSha = capsuleShaFromCapsule(capsule.json);
  const receiptCapsuleSha = capsuleShaFromReceipt(receipt.json);
  const receiptDeclaredSha = receiptShaFromReceipt(receipt.json);
  const receiptObservedSha = receiptDeclaredSha || receipt.canonical_json_sha256;

  const claims = {
    capsule_sha256: capsuleDeclaredSha,
    receipt_sha256: receiptObservedSha,
    receipt_sha256_basis: receiptDeclaredSha ? "declared_inside_public_receipt_json" : "computed_public_receipt_canonical_json_sha256",
    receipt_capsule_sha256: receiptCapsuleSha,
    capsule_fetched_from_public_url: firstBoolBySemanticKey(receipt.json, ["CAPSULE_FETCHED_FROM_PUBLIC_URL"]),
    capsule_sha256_match: firstBoolBySemanticKey(receipt.json, ["CAPSULE_SHA256_MATCH"]),
    capsule_sha256_match_basis: firstStringBySemanticKey(receipt.json, ["CAPSULE_SHA256_MATCH_BASIS"]),
    capsule_artifacts_live: firstBoolBySemanticKey(receipt.json, ["CAPSULE_ARTIFACTS_LIVE"]),
    release_tag_bound: firstBoolBySemanticKey(receipt.json, ["RELEASE_TAG_BOUND"]),
    no_private_source_required: firstBoolBySemanticKey(receipt.json, ["NO_PRIVATE_SOURCE_REQUIRED"])
  };

  const assertions = {
    capsule_public_fetch_ok: capsule.status === 200,
    receipt_public_fetch_ok: receipt.status === 200,
    capsule_declares_sha256: isSha256(claims.capsule_sha256),
    receipt_has_public_sha256_basis: isSha256(claims.receipt_sha256),
    receipt_capsule_sha256_matches_capsule: claims.receipt_capsule_sha256 === claims.capsule_sha256,
    receipt_claims_capsule_public_fetch: claims.capsule_fetched_from_public_url === true,
    receipt_claims_capsule_sha256_match: claims.capsule_sha256_match === true,
    receipt_claims_capsule_artifacts_live: claims.capsule_artifacts_live === true,
    receipt_claims_release_tag_bound: claims.release_tag_bound === true,
    receipt_claims_no_private_source_required: claims.no_private_source_required === true,
    receipt_sha_basis_is_public_capsule_internal_digest:
      claims.capsule_sha256_match_basis === "expected_sha256_found_inside_public_capsule_json"
  };

  const pass = Object.values(assertions).every(Boolean);

  const result = {
    protocol: "TRUTHFRAMER_PUBLIC_INDEPENDENT_VERIFIER",
    version: DEFAULTS.version,
    status: pass ? "PUBLIC_INDEPENDENT_VERIFICATION_PASS" : "PUBLIC_INDEPENDENT_VERIFICATION_FAIL",
    public_inputs: {
      public_verification_capsule_url: capsuleUrl,
      public_capsule_consumption_receipt_url: receiptUrl
    },
    public_object_digests: {
      capsule_raw_bytes_sha256: capsule.raw_bytes_sha256,
      capsule_canonical_json_sha256: capsule.canonical_json_sha256,
      receipt_raw_bytes_sha256: receipt.raw_bytes_sha256,
      receipt_canonical_json_sha256: receipt.canonical_json_sha256
    },
    observed_public_claims: claims,
    assertions
  };

  result.verifier_result_sha256 = await sha256Hex(stableStringify(result));
  return result;
}

if (typeof window !== "undefined") {
  window.TRUTHFRAMER_PUBLIC_INDEPENDENT_VERIFIER = {
    verifyTruthframerPublicIndependently,
    stableStringify,
    sha256Hex
  };
}
