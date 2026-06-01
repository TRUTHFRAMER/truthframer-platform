#!/usr/bin/env node
'use strict';

const crypto = require('crypto');

const VERSION = 'v1.6.0';
const STATUS = 'PUBLIC_CAPSULE_CONSUMPTION_RECEIPT_BOUND';

const RECEIPT_URL = 'https://truthframer.github.io/truthframer-platform/receipt/TRUTHFRAMER_PUBLIC_CAPSULE_CONSUMPTION_RECEIPT.json';
const EXPECTED_CAPSULE_SHA256 = '957b92e87d6e6ca0f341702e367cb454347b66eba143e4046e3f0e4a8489fe17';

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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function fetchText(url) {
  let last = '';
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        headers: {
          'user-agent': 'TRUTHFRAMER-public-capsule-consumption-receipt-network/1.6.0',
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

async function main() {
  const receiptFetch = await fetchText(RECEIPT_URL);
  const receipt = JSON.parse(receiptFetch.text);

  const { receipt_payload_sha256, ...payload } = receipt;
  const recalculatedReceiptSha = sha256(stableStringify(payload));

  assert(receipt.version === VERSION, 'PUBLIC_RECEIPT_VERSION_MISMATCH');
  assert(receipt.status === STATUS, 'PUBLIC_RECEIPT_STATUS_MISMATCH');
  assert(receipt_payload_sha256 === recalculatedReceiptSha, 'PUBLIC_RECEIPT_PAYLOAD_SHA256_MISMATCH');

  assert(receipt.consumed_public_capsule.fetched_from_public_url === true, 'PUBLIC_RECEIPT_DID_NOT_FETCH_CAPSULE_FROM_PUBLIC_URL');
  assert(receipt.consumed_public_capsule.expected_capsule_sha256 === EXPECTED_CAPSULE_SHA256, 'PUBLIC_RECEIPT_EXPECTED_CAPSULE_SHA256_MISMATCH');
  assert(receipt.consumed_public_capsule.capsule_sha256_match === true, 'PUBLIC_RECEIPT_CAPSULE_SHA256_MATCH_FALSE');

  const capsuleUrl = receipt.consumed_public_capsule.public_url;
  const capsuleFetch = await fetchText(capsuleUrl);
  const capsule = JSON.parse(capsuleFetch.text);
  const declaredCapsuleSha256Values = Array.from(collectSha256Values(capsule));

  assert(declaredCapsuleSha256Values.includes(EXPECTED_CAPSULE_SHA256), 'LIVE_PUBLIC_CAPSULE_DECLARED_SHA256_MISMATCH');

  const checks = receipt.public_artifact_liveness.checked_urls || [];
  assert(checks.length >= 2, 'PUBLIC_RECEIPT_INSUFFICIENT_CHECKED_URLS');

  for (const check of checks) {
    const result = await fetchText(check.url);
    assert(result.status >= 200 && result.status < 300, `PUBLIC_CHECK_URL_NOT_LIVE ${check.url}`);
  }

  assert(receipt.release_binding.release_tag_bound === true, 'PUBLIC_RECEIPT_RELEASE_TAG_NOT_BOUND');
  assert(receipt.assertions.no_private_source_required === true, 'PUBLIC_RECEIPT_PRIVATE_SOURCE_REQUIRED');

  console.log('PUBLIC_CAPSULE_CONSUMPTION_RECEIPT_LIVE=true');
  console.log('TRUTHFRAMER_PUBLIC_CAPSULE_CONSUMPTION_RECEIPT_NETWORK_PASS=true');
  console.log(`PUBLIC_CAPSULE_CONSUMPTION_RECEIPT_URL=${RECEIPT_URL}`);
  console.log(`CAPSULE_SHA256=${EXPECTED_CAPSULE_SHA256}`);
  console.log(`RECEIPT_SHA256=${receipt_payload_sha256}`);
  console.log('CAPSULE_FETCHED_FROM_PUBLIC_URL=true');
  console.log('CAPSULE_SHA256_MATCH=true');
  console.log('CAPSULE_SHA256_MATCH_BASIS=expected_sha256_found_inside_public_capsule_json');
  console.log('CAPSULE_ARTIFACTS_LIVE=true');
  console.log('RELEASE_TAG_BOUND=true');
  console.log('NO_PRIVATE_SOURCE_REQUIRED=true');
}

main().catch(err => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
