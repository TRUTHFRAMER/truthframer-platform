#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const VERSION = 'v1.6.0';
const STATUS = 'PUBLIC_CAPSULE_CONSUMPTION_RECEIPT_BOUND';

const CAPSULE_URL = 'https://truthframer.github.io/truthframer-platform/capsule/TRUTHFRAMER_PUBLIC_VERIFICATION_CAPSULE.json';
const RELEASE_URL = 'https://github.com/TRUTHFRAMER/truthframer-platform/releases/tag/v1.5.0';
const EXPECTED_CAPSULE_SHA256 = '957b92e87d6e6ca0f341702e367cb454347b66eba143e4046e3f0e4a8489fe17';

const OUT_PATHS = [
  'receipts/TRUTHFRAMER_PUBLIC_CAPSULE_CONSUMPTION_RECEIPT.json',
  'docs/receipt/TRUTHFRAMER_PUBLIC_CAPSULE_CONSUMPTION_RECEIPT.json',
  'reports/current/public-capsule-consumption-receipt-v1.6.0.json',
];

function sha256(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((acc, key) => {
      acc[key] = sortValue(value[key]);
      return acc;
    }, {});
  }
  return value;
}

function stableStringify(value) {
  return JSON.stringify(sortValue(value), null, 2) + '\n';
}

function collectUrls(value, out = new Set()) {
  if (typeof value === 'string') {
    const matches = value.match(/https?:\/\/[^\s"'<>),]+/g) || [];
    for (const match of matches) out.add(match);
  } else if (Array.isArray(value)) {
    for (const item of value) collectUrls(item, out);
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectUrls(item, out);
  }
  return out;
}

function collectSha256Values(value, out = new Set()) {
  if (typeof value === 'string') {
    const matches = value.match(/\b[a-f0-9]{64}\b/gi) || [];
    for (const match of matches) out.add(match.toLowerCase());
  } else if (Array.isArray(value)) {
    for (const item of value) collectSha256Values(item, out);
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectSha256Values(item, out);
  }
  return out;
}

async function fetchText(url) {
  let last = '';
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        headers: {
          'user-agent': 'TRUTHFRAMER-public-capsule-consumption-receipt/1.6.0',
          'cache-control': 'no-cache',
        },
      });
      const text = await res.text();
      if (res.ok) return { url, ok: true, status: res.status, text };
      last = `HTTP_${res.status}`;
    } catch (err) {
      last = err && err.message ? err.message : String(err);
    }
    await new Promise(resolve => setTimeout(resolve, attempt * 1000));
  }
  throw new Error(`FETCH_FAILED ${url} ${last}`);
}

async function probeUrl(url) {
  try {
    const result = await fetchText(url);
    return {
      url,
      live: true,
      http_status: result.status,
      bytes: Buffer.byteLength(result.text),
      sha256: sha256(result.text),
    };
  } catch (err) {
    return {
      url,
      live: false,
      error: err && err.message ? err.message : String(err),
    };
  }
}

async function main() {
  const capsuleFetch = await fetchText(CAPSULE_URL);

  let capsule;
  try {
    capsule = JSON.parse(capsuleFetch.text);
  } catch (err) {
    throw new Error(`PUBLIC_CAPSULE_JSON_PARSE_FAILED ${err.message}`);
  }

  const observedPublicCapsuleFileSha256 = {
    raw_bytes_sha256: sha256(capsuleFetch.text),
    canonical_json_sha256: sha256(stableStringify(capsule)),
  };

  const declaredCapsuleSha256Values = Array.from(collectSha256Values(capsule)).sort();
  const capsuleSha256Match = declaredCapsuleSha256Values.includes(EXPECTED_CAPSULE_SHA256);

  if (!capsuleSha256Match) {
    throw new Error(`DECLARED_CAPSULE_SHA256_NOT_FOUND expected=${EXPECTED_CAPSULE_SHA256} declared=${JSON.stringify(declaredCapsuleSha256Values)} observed_file_hashes=${JSON.stringify(observedPublicCapsuleFileSha256)}`);
  }

  const urls = Array.from(collectUrls(capsule));
  urls.push(CAPSULE_URL, RELEASE_URL);

  const checkedUrls = Array.from(new Set(urls))
    .filter(url => url.startsWith('https://'))
    .sort();

  if (checkedUrls.length < 2) {
    throw new Error('PUBLIC_CAPSULE_CONSUMPTION_RECEIPT_INSUFFICIENT_PUBLIC_URLS');
  }

  const publicChecks = [];
  for (const url of checkedUrls) {
    publicChecks.push(await probeUrl(url));
  }

  const allPublicArtifactsLive = publicChecks.every(check => check.live === true);
  if (!allPublicArtifactsLive) {
    throw new Error(`PUBLIC_ARTIFACT_LIVENESS_FAILED ${JSON.stringify(publicChecks.filter(check => !check.live), null, 2)}`);
  }

  const releaseCheck = publicChecks.find(check => check.url === RELEASE_URL);
  const releaseTagBound = !!releaseCheck && releaseCheck.live === true;

  if (!releaseTagBound) {
    throw new Error('RELEASE_TAG_BOUND_FAILED');
  }

  const payload = {
    system: 'TRUTHFRAMER',
    artifact: 'PUBLIC_CAPSULE_CONSUMPTION_RECEIPT',
    version: VERSION,
    status: STATUS,
    issued_at: new Date().toISOString(),
    consumed_public_capsule: {
      public_url: CAPSULE_URL,
      fetched_from_public_url: true,
      expected_capsule_sha256: EXPECTED_CAPSULE_SHA256,
      declared_capsule_sha256_values: declaredCapsuleSha256Values,
      observed_public_capsule_file_sha256: observedPublicCapsuleFileSha256,
      capsule_sha256_match: true,
      capsule_sha256_match_basis: 'expected_sha256_found_inside_public_capsule_json',
    },
    release_binding: {
      release_tag: 'v1.5.0',
      release_url: RELEASE_URL,
      release_tag_bound: true,
    },
    public_artifact_liveness: {
      capsule_artifacts_live: true,
      checked_url_count: publicChecks.length,
      checked_urls: publicChecks,
    },
    assertions: {
      public_capsule_consumed: true,
      capsule_fetched_from_public_url: true,
      capsule_sha256_match: true,
      capsule_artifacts_live: true,
      release_tag_bound: true,
      no_private_source_required: true,
      truth_claim_not_created: true,
      admission_claim_not_created: true,
      external_reality_claim_not_created: true,
    },
  };

  const receiptPayloadSha256 = sha256(stableStringify(payload));
  const receipt = {
    ...payload,
    receipt_payload_sha256: receiptPayloadSha256,
  };

  const serialized = stableStringify(receipt);

  for (const outPath of OUT_PATHS) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, serialized);
  }

  console.log('TRUTHFRAMER_PUBLIC_CAPSULE_CONSUMPTION_RECEIPT_GENERATED=true');
  console.log(`VERSION=${VERSION}`);
  console.log(`STATUS=${STATUS}`);
  console.log(`CAPSULE_SHA256=${EXPECTED_CAPSULE_SHA256}`);
  console.log('CAPSULE_SHA256_MATCH_BASIS=expected_sha256_found_inside_public_capsule_json');
  console.log(`PUBLIC_CHECKED_URL_COUNT=${publicChecks.length}`);
  console.log(`RECEIPT_SHA256=${receiptPayloadSha256}`);
  console.log('NO_PRIVATE_SOURCE_REQUIRED=true');
}

main().catch(err => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
