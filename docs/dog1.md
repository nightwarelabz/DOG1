# DOG1 model

DOG1 is a fictional tabletop game on a cyclic 42 × 32 grid. Its geography, allegiances, power points, distances and fuel quantities have no real-world calibration. The world is a flat periodic map, not an Earth coordinate system. R0 is the connecting space between three invented regions, R1–R3. Plateau terrain is labelled P1–P3.

## Cell and object identifiers

| Identifier | Meaning |
| --- | --- |
| A1–AP32 | Exact grid addresses: 42 lettered columns and 32 rows |
| A-cell | An area cell with no currently identified active token |
| T-cell | A cell occupied by an identified active synthetic token |
| T1–T13 | Synthetic token identifiers; each has a separate grid address |
| M1–M4 | Moving game units |
| F1–F3 | Fictional allegiance labels |
| N1–N7 | Network nodes; each has a separate grid address |
| P1–P3 | Plateau terrain within R1–R3 |

A hidden token is not exposed as a T-cell on the public map. A neutralized token leaves an A-cell and a history marker. “Neutralized” means removal of an abstract game token. Terrain does not establish allegiance or opposition. The current public count of A-cells plus T-cells always equals 1,344. Exported state also contains the synthetic scenario's hidden tokens, so it is an inspection/debugging export rather than a competitive hidden-information protocol.

## Position and power rule

A token may clear only when it is identified, has a different allegiance from the acting unit, is within one tile (including diagonals and the global seam), and the unit's power points meet or exceed its defense points. These are arbitrary integer game scores from 0 to 9. No ballistic calculations, real sensor capabilities, weapons hardware or engagement instructions are included.

The two-cell circular reveal radius is a fixed visibility rule. Scans and interaction checks occur along motion in spatial increments no longer than 0.15 cells, so an update cannot jump past a contact. The fixed circulation route does not change in response to tokens or allegiances.

## Continuous travel and refuelling

All units travel the same eastbound circuit through B14, H9, N12, U17, AB21, AI16 and AO12. They begin at different refuelling nodes. Each route segment is a straight line between two cell centres. East–west position is stored as an unwrapped coordinate; only the display wraps at AP/A. Latitude does not wrap. Circuit counts measure accumulated progress through an entire 42-column circumference rather than counting a single seam crossing as a full circuit.

Movement is integrated through waypoint and refuelling boundaries. A unit cannot cover more than its speed times elapsed step duration. Positions are never replaced with a destination or a base. Exhausting fuel strands a unit at its current location.

| Unit | Allegiance | Base speed, cells/step | Initial power points |
| --- | --- | ---: | ---: |
| M1 | F1 | 0.56 | 4 |
| M2 | F2 | 0.70 | 6 |
| M3 | F3 | 0.84 | 3 |
| M4 | F1 | 0.98 | 5 |

The speed allocation multiplier ranges from 0.5× to 2× and changes movement rate. Playback speed only changes viewing pace. Each unit has 34 fuel points and spends one point per cell actually travelled. N1/B14, N3/N12, N5/AB21 and N7/AO12 supply fuel at five points per step while the unit remains stopped at the node. There is no instantaneous refill, no fuel delivered remotely, and no automatic relocation after exhaustion.

The displayed leg distance is the remaining distance to the next route node. Travel totals include every segment and every completed circuit. The model ignores acceleration, real aircraft altitude, weather, obstacles, collisions and real geography.

## Demonstration and verification

The default 240-step run identifies 13 tokens and clears 12. T5 remains active: M2 has sufficient power but shares its allegiance, while the opposing units have insufficient power. The MP4 visibly demonstrates a scripted allocation of M1's game power from four to six at step 120; T5 then clears when M1 next reaches an adjacent tile. It does not clear at the moment power changes while M1 is elsewhere.

The video uses the actual model at 0.2-step integration intervals, with three seconds of introduction and seven seconds of final review. Its notification tones represent identify, token-clear, refuel and allocation events. They are abstract game cues.

`npm test` verifies all 1,344 addresses, continuous seam crossings, speed bounds, fuel conservation, refuelling time and location, exhaustion without relocation, allegiance/position/power requirements, and A-/T-cell transitions. The interface provides cell lookup, speed and power allocations, a token ledger and JSON state export.
