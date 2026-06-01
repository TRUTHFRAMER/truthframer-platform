# TRUTHFRAMER

TRUTHFRAMER is the visual truth engine for market reality.

It converts fragmented market signals into one replayable `TRUTH_FRAME`.

```text
TRUTHFRAMER turns markets into evidence.
````

## Live public system

| Surface              | URL                                                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Visual surface       | [https://truthframer.github.io/truthframer-platform/render/](https://truthframer.github.io/truthframer-platform/render/)                                                             |
| Frame index          | [https://truthframer.github.io/truthframer-platform/frames/](https://truthframer.github.io/truthframer-platform/frames/)                                                             |
| TRUTH_FRAME registry | [https://truthframer.github.io/truthframer-platform/registry/TRUTH_FRAME_REGISTRY.json](https://truthframer.github.io/truthframer-platform/registry/TRUTH_FRAME_REGISTRY.json)       |
| System status        | [https://truthframer.github.io/truthframer-platform/status/truthframer-system-status.json](https://truthframer.github.io/truthframer-platform/status/truthframer-system-status.json) |
| Public proof         | [https://truthframer.github.io/truthframer-platform/proof/PUBLIC_SURFACE_PROOF.json](https://truthframer.github.io/truthframer-platform/proof/PUBLIC_SURFACE_PROOF.json)             |
| Case object          | [https://truthframer.github.io/truthframer-platform/case/tf-000001/TRUTH_FRAME.json](https://truthframer.github.io/truthframer-platform/case/tf-000001/TRUTH_FRAME.json)             |

## Current frame

```text
tf_000001 — Cross-Venue Prediction Lag
```

Status:

```text
LIVE_PUBLIC_TRUTH_FRAME
```

Release:

```text
v0.1.0 — First Public Truth Frame
```

## Core object

```text
TRUTH_FRAME
```

A `TRUTH_FRAME` binds source manifests, clock alignment, venue state, order flow, market depth, cross-venue dislocation, prediction probability, correlation structure, latency boundaries, replay evidence, and visual projection boundaries.

## Closed public loop

```text
TRUTH_FRAME object
→ local visual render
→ render verifier
→ public readiness verifier
→ static public surface
→ live proof object
→ release ledger
→ public registry
→ system status
```

## Operating law

```text
No visual without source.
No source without clock.
No clock without replay.
No replay without boundary.
No boundary without TRUTH_FRAME.
```

## Verification

Run:

```bash
npm run verify:all
```

Expected:

```text
TRUTHFRAMER_VERIFY_PASS=true
TF-000001_RENDER_PASS=true
TF-000001_PUBLIC_SURFACE_READY=true
TRUTHFRAMER_REGISTRY_PASS=true
TRUTHFRAMER_README_PUBLIC_ENTRY_PASS=true
```

## Object paths

```text
cases/tf-000001-cross-venue-prediction-lag/TRUTH_FRAME.json
cases/tf-000001-cross-venue-prediction-lag/SOURCE_MANIFEST.json
cases/tf-000001-cross-venue-prediction-lag/REPLAY_MANIFEST.json
apps/terminal/tf-000001.html
registry/TRUTH_FRAME_REGISTRY.json
reports/current/truthframer-system-status.json
reports/current/tf-000001-public-surface-live.json
reports/current/truthframer-registry-live-proof.json
releases/v0.1.0/RELEASE_LEDGER.json
```


## Public network verification

TRUTHFRAMER includes a public network verifier.

```bash
npm run verify:network
```

It checks the public root, registry, system status, rendered truth frames, proof objects, audit seal, repository hardening seal, and release chain from public URLs.

Public verification page:

```text
https://truthframer.github.io/truthframer-platform/verification/
```


## Public network verification seal

The public verifier is sealed by a machine-readable verification seal.

```text
https://truthframer.github.io/truthframer-platform/verification/PUBLIC_NETWORK_VERIFICATION_SEAL.json
```

Local seal check:

```bash
npm run verify:network-seal
```

## Public verification index

TRUTHFRAMER exposes a public machine-readable verification index binding the public root, frame registry, system status, truth-frame surfaces, release chain, audit seals, hardening seal, network verifier, and network verification seal.

```text
https://truthframer.github.io/truthframer-platform/verification/PUBLIC_VERIFICATION_INDEX.json
```

Local index check:

```bash
npm run verify:verification-index
```

## Public verification index seal

TRUTHFRAMER exposes a public verification index seal that binds the public verification index to the release chain and verification perimeter.

```text
https://truthframer.github.io/truthframer-platform/verification/PUBLIC_VERIFICATION_INDEX_SEAL.json
```

Local seal check:

```bash
npm run verify:index-seal
```

## Boundary

TRUTHFRAMER is not a broker, trading bot, investment adviser, signal seller, prediction-market exchange, or execution platform.

TRUTHFRAMER does not tell users what to trade.

TRUTHFRAMER shows replayable market structure.


## Complete Public Verification Atlas

TRUTHFRAMER publishes a machine-readable public verification atlas covering all current public artifact classes:

- render surfaces
- frame case objects
- replay/source/truth-frame manifests
- public surface proofs
- frame index
- registry
- system status
- audit seal
- repository hardening seal
- public network verification seal
- public verification index
- public verification index seal
- release ledgers

Atlas:

https://truthframer.github.io/truthframer-platform/verification/PUBLIC_VERIFICATION_ATLAS.json

Atlas seal:

https://truthframer.github.io/truthframer-platform/verification/PUBLIC_VERIFICATION_ATLAS_SEAL.json



## Total Public Stack Closure

TRUTHFRAMER publishes a total public stack closure:

- Closure: https://truthframer.github.io/truthframer-platform/verification/PUBLIC_STACK_CLOSURE.json
- Closure seal: https://truthframer.github.io/truthframer-platform/verification/PUBLIC_STACK_CLOSURE_SEAL.json

This closes the public verification stack from the initial truth-frame spine through the v0.7.0 complete public verification atlas.


## Public continuity sentinel

TRUTHFRAMER v0.9.0 adds a public continuity sentinel for the complete public verification stack.

- https://truthframer.github.io/truthframer-platform/verification/PUBLIC_CONTINUITY_SENTINEL.json
- https://truthframer.github.io/truthframer-platform/verification/PUBLIC_CONTINUITY_SENTINEL_SEAL.json


## Public Release Closure

TRUTHFRAMER v0.9.1 adds a public release self-inclusion closure. It records that v0.9.0 is no longer merely produced by the stack, but is itself included as live public release evidence.

- Public release closure: https://truthframer.github.io/truthframer-platform/verification/PUBLIC_RELEASE_CLOSURE.json
- Public release closure seal: https://truthframer.github.io/truthframer-platform/verification/PUBLIC_RELEASE_CLOSURE_SEAL.json


## Public Root Finality Certificate

- `docs/verification/PUBLIC_ROOT_FINALITY_CERTIFICATE.json`
- `docs/verification/PUBLIC_ROOT_FINALITY_CERTIFICATE_SEAL.json`

## Legal / License Perimeter

TRUTHFRAMER is proprietary source-available material. It is not open source. No use, modification, redistribution, commercial deployment, package reuse, AI-training use, scraping, mirroring, or derivative work is permitted except by separate written agreement. See `LICENSE.md`, `NOTICE.md`, `PRIVACY.md`, and `SECURITY.md`.

## Public Legal / Privacy Certificate

The proprietary license and privacy perimeter are locally verified and publicly certified by `PUBLIC_LEGAL_PRIVACY_PERIMETER_CERTIFICATE.json` with a sealed SHA-256 readback artifact.

## Public Distribution Egress Firewall

TRUTHFRAMER verifies that proprietary/private source posture is not weakened by accidental npm package egress, Docker-context egress, tracked secret paths, credential files, or missing ignore boundaries.


### TRUTHFRAMER v1.0.3 — Public Source Provenance Certificate

TRUTHFRAMER publishes a source provenance certificate binding the protected main commit, tree SHA, legal/privacy perimeter, public finality perimeter, npm-pack surface, forbidden tracked-file absence, and distribution egress firewall into one sealed public provenance object.

### TRUTHFRAMER v1.0.4 — Verification Immutability Certificate

TRUTHFRAMER now certifies that verification is observational, not mutational. `verify:all` includes a purity guard that snapshots repository state, runs the full verification stack, and fails if verification rewrites tracked or untracked repository state.


<!-- TRUTHFRAME_SYSTEM_SPINE_V110 -->
## Truth Frame System Spine

TRUTHFRAMER v1.1.0 makes the truth frame the canonical system spine.

Certificates, seals, release ledgers, reports, and public pages are subordinate evidence surfaces. The system spine verifies that every truth frame has its case object, source manifest, replay manifest, terminal render, public render, and registry presence.


<!-- TRUTHFRAME_ADMISSION_GATE_V120 -->
## Truth Frame Admission Gate

TRUTHFRAMER v1.2.0 closes admission around the truth-frame object.

A frame cannot appear as a terminal render, public render, registry entry, or spine entry unless it is backed by a canonical case with TRUTH_FRAME.json, SOURCE_MANIFEST.json, and REPLAY_MANIFEST.json.


<!-- TRUTHFRAME_ADMISSION_REFUSAL_PROOF_V130 -->
## Truth Frame Admission Refusal Proof

TRUTHFRAMER v1.3.0 proves the admission gate is not merely descriptive.

The proof injects adversarial orphan and incomplete truth-frame surfaces in temporary worktrees and requires admission verification to fail.
