#!/usr/bin/env node
'use strict';

const fs = require('fs');
const crypto = require('crypto');

const VERSION = 'v1.6.0';
const STATUS = 'PUBLIC_CAPSULE_CONSUMPTION_RECEIPT_BOUND';
const EXPECTED_CAPSULE_SHA256 = '957b92e87d6e6ca0f341702e367cb454347b66eba143e4046e3f0e4a8489fe17';

const PATHS = [
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const texts = PATHS.map(path => {
  assert(fs.existsSync(path), `MISSING_RECEIPT_PATH ${path}`);
  return fs.readFileSync(path, 'utf8');
});

assert(texts.every(text => text === texts[0]), 'RECEIPT_COPIES_DIVERGE');

const receipt = JSON.parse(texts[0]);
const { receipt_payload_sha256, ...payload } = receipt;
const recalculated = sha256(stableStringify(payload));

assert(receipt.version === VERSION, 'RECEIPT_VERSION_MISMATCH');
assert(receipt.status === STATUS, 'RECEIPT_STATUS_MISMATCH');
assert(receipt_payload_sha256 === recalculated, 'RECEIPT_PAYLOAD_SHA256_MISMATCH');

assert(receipt.consumed_public_capsule.fetched_from_public_url === true, 'CAPSULE_NOT_FETCHED_FROM_PUBLIC_URL');
assert(receipt.consumed_public_capsule.expected_capsule_sha256 === EXPECTED_CAPSULE_SHA256, 'EXPECTED_CAPSULE_SHA256_MISMATCH');
assert(receipt.consumed_public_capsule.capsule_sha256_match === true, 'CAPSULE_SHA256_MATCH_FALSE');

assert(receipt.release_binding.release_tag === 'v1.5.0', 'RELEASE_TAG_MISMATCH');
assert(receipt.release_binding.release_tag_bound === true, 'RELEASE_TAG_NOT_BOUND');

assert(receipt.public_artifact_liveness.capsule_artifacts_live === true, 'CAPSULE_ARTIFACTS_NOT_LIVE');
assert(receipt.public_artifact_liveness.checked_url_count >= 2, 'INSUFFICIENT_PUBLIC_CHECKS');

assert(receipt.assertions.no_private_source_required === true, 'PRIVATE_SOURCE_REQUIRED');
assert(receipt.assertions.truth_claim_not_created === true, 'TRUTH_CLAIM_CREATED');
assert(receipt.assertions.admission_claim_not_created === true, 'ADMISSION_CLAIM_CREATED');
assert(receipt.assertions.external_reality_claim_not_created === true, 'EXTERNAL_REALITY_CLAIM_CREATED');

console.log('TRUTHFRAMER_PUBLIC_CAPSULE_CONSUMPTION_RECEIPT_PASS=true');
console.log(`VERSION=${VERSION}`);
console.log(`STATUS=${STATUS}`);
console.log(`CAPSULE_SHA256=${EXPECTED_CAPSULE_SHA256}`);
console.log(`RECEIPT_SHA256=${receipt_payload_sha256}`);
console.log('CAPSULE_FETCHED_FROM_PUBLIC_URL=true');
console.log('CAPSULE_SHA256_MATCH=true');
console.log('CAPSULE_ARTIFACTS_LIVE=true');
console.log('RELEASE_TAG_BOUND=true');
console.log('NO_PRIVATE_SOURCE_REQUIRED=true');
