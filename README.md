
# truthframer-platform

`truthframer-platform` is the first implementation spine of TRUTHFRAMER.

It builds the object layer behind the visual truth engine for market reality.

## Root sentence

TRUTHFRAMER converts fragmented market signals into one replayable `TRUTH_FRAME`.

## What this repo owns

This repo owns the first executable structure for:

* `TRUTH_FRAME` objects
* source manifests
* clock and sequence policies
* market-state graph construction
* order-flow projections
* market-depth projections
* level 3 order-flow projections
* cross-venue mispricing views
* prediction-market probability views
* options-implied distribution views
* correlation matrix views
* ML attention views
* latency-boundary views
* deterministic replay
* truth-score calculation
* visual projection contracts

## What this repo does not own

TRUTHFRAMER is not:

* a broker
* a trading bot
* an investment adviser
* a signal seller
* an execution system
* a prediction-market exchange
* a portfolio manager
* a Bloomberg clone
* a TradingView clone
* an AI content toy

## Operating law

```text
No visual without source.
No source without clock.
No clock without replay.
No replay without boundary.
No boundary without TRUTH_FRAME.
```

## First case

```text
TF-000001 — Cross-Venue Prediction Lag
```

Question:

```text
Which venue absorbed information late, under the declared replay window and liquidity boundary?
```

Output:

```text
cases/tf-000001-cross-venue-prediction-lag/TRUTH_FRAME.json
```


## Boundary

TRUTHFRAMER is not a broker, trading bot, investment adviser, signal seller, execution platform, prediction-market exchange, or portfolio manager.

TRUTHFRAMER does not tell users what to trade.

TRUTHFRAMER shows replayable market structure.

## First public surface

```text
TF-000001_PUBLIC_SURFACE_READY=true
```

Rendered source:

```text
apps/terminal/tf-000001.html
```

Public docs surface:

```text
docs/render/index.html
```

Readiness object:

```text
reports/current/tf-000001-public-surface-readiness.json
```

Closed loop:

```text
TRUTH_FRAME object
→ visual surface
→ render verification
→ public docs surface
→ CI verification
→ GitHub Pages deployment
```

