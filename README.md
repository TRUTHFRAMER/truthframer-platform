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

## Boundary

TRUTHFRAMER is not a broker, trading bot, investment adviser, signal seller, prediction-market exchange, or execution platform.

TRUTHFRAMER does not tell users what to trade.

TRUTHFRAMER shows replayable market structure.
