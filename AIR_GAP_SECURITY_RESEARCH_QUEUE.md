# Air-Gap Component Leakage and Hardware-Wallet Trust — Research Queue

## Purpose

Build a defensive research module explaining when an “air-gapped” wallet or computer can still leak data, how component and firmware trust should be evaluated, and which claims require laboratory evidence.

Use synthetic test strings only. Do not implement keylogging, seed extraction, wallet draining, covert-channel malware, or tools targeting another person’s system.

## Confirmed Coldcard incident finding

The July 2026 Coldcard theft is attributed to weak seed generation in affected firmware—not to an offline wallet transmitting its recovery phrase. Coinkite reports that affected Mk4, Q, and Mk5 seeds had about 72 bits of entropy rather than the expected 128 bits; affected Mk2/Mk3 firmware ranges are also identified. Attackers could search the reduced key space and identify funded addresses using public blockchain data without communicating with the physical wallet.

Primary advisory: https://blog.coinkite.com/coldcard-mk3-seed-generation-warning/

## Research questions

1. What protection does an air gap actually provide?
2. Which channels require prior malware, modified firmware, or implanted hardware?
3. What powered component produces the carrier?
4. What mechanism modulates data onto that carrier?
5. What sensor or receiver is required, and at what distance?
6. What bandwidth and error rate are measurable?
7. Can shielding, distance, filtered power, component removal, or procedural controls stop it?
8. How should seed-generation entropy and firmware provenance be independently verified?

## Established comparison channels

The defensive review will compare:

- RAM-bus electromagnetic emissions (RAMBO)
- display-generated acoustic leakage (PIXHELL)
- CPU-generated magnetic fields (MAGNETO/ODINI)
- power-line conducted emissions (PowerHammer)
- fan and surface-vibration channels
- optical, thermal, USB, microSD, camera, QR, and supply-chain paths

Primary research examples:

- https://arxiv.org/html/2409.02292v1
- https://arxiv.org/html/2409.04930v1
- https://arxiv.org/abs/1804.04014
- https://arxiv.org/abs/1802.02317

## Arsenic/component hypothesis

Treat arsenic as a material, not a standalone radio.

Arsenic can be a dopant or part of compound semiconductors such as gallium arsenide. Those materials can be used in powered transistors, amplifiers, oscillators, photodetectors, and RF devices. A usable covert transmitter still needs:

- an energy source;
- a time-varying or switchable signal;
- a modulation mechanism;
- coupling or antenna behavior;
- a receiver able to separate the signal from noise.

A usable receiver needs a sensor junction or circuit, gain and filtering, demodulation, and sufficient signal-to-noise ratio. The lab should test complete structures and measurable emissions; it should not infer a data transmitter from the mere presence of elemental arsenic.

## Safe laboratory phases

### Phase 1 — threat model

Create diagrams for:

data source → modulation → physical carrier → propagation → receiver → decoding

### Phase 2 — passive measurement

Measure baseline electromagnetic, magnetic, acoustic, optical, thermal, and conducted emissions from an unmodified test computer processing known synthetic patterns.

### Phase 3 — controlled modulation

On owned laboratory equipment only, deliberately alternate harmless workloads and determine whether a nearby instrument can distinguish two synthetic states. Do not process secrets.

### Phase 4 — defenses

Compare distance, shielding, randomized workloads, cable removal, filtered power, camera exclusion, signed firmware, reproducible builds, independent entropy, and multisignature procedures.

### Phase 5 — public explainer

Publish confirmed results, failed hypotheses, equipment, distance, bandwidth, error rates, and limitations. Clearly distinguish demonstrated behavior from theory.

## Planned deliverables

- `AIR_GAP_THREAT_MODEL.md`
- `COMPONENT_TRUST.md`
- `COLDCARD_INCIDENT.md`
- defensive interactive channel diagram
- countermeasure checklist
- synthetic-data experiment protocol
- evidence table: confirmed / plausible but untested / unsupported

## Current evidence classification

| Claim | Status |
|---|---|
| Affected Coldcard firmware generated weaker-than-expected seeds | Confirmed by manufacturer advisory |
| Reduced seed entropy can allow remote key search without contacting the wallet | Confirmed attack model |
| Malware can modulate emissions from powered computer components | Demonstrated in published laboratory research |
| A compromised supply chain can add hidden active circuitry | Plausible and established threat category |
| Elemental arsenic alone can transmit or receive arbitrary computer data | Unsupported |
| Arsenic-containing semiconductor devices can participate in RF or optical circuits | Established when used in complete powered devices |
