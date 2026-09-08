# Ballu Lagoon DC — NikaS Climate contract

Status: project contract derived from the function registry dated 2026-09-06, refined by the source audit dated 2026-09-07. Requirements below are not a claim that every requirement is already implemented.

See [the implementation review and acceptance plan](BALLU_LOCAL_IMPLEMENTATION_REVIEW.md) for the current gaps, source references and proposed development stages. Audited panel baseline: `1c556be8`, integration `0.1.41`, UI `1.4.13`.

## Source hierarchy

The panel must require both runtime capabilities of the installed Home Assistant entity and any known exact-device restrictions. Family documentation or neighbouring Ballu generations must not enable controls. The reviewed Syncleo reference is DeKaN/ha-syncleo commit `4f9e15bdaa3d02ff0f08fb7249ac000a4cc52638`, still upstream HEAD on 2026-09-07, with `pysyncleo==0.3.7`; the installed user version must be checked separately when diagnosing integration behaviour.

## Three temperature values

Never merge these values:

- `room_temperature` — selected room sensor, resolved by label/area and explicit fallback.
- `device_temperature` — `current_temperature` reported by the conditioner.
- `target_temperature` — conditioner setpoint.

If the room sensor is unavailable, show no room value. Never substitute the setpoint or device temperature silently.

Reject null, empty and non-numeric values before numeric conversion. Select only the correct measurement type: a percentage battery sensor is not humidity. Resolve the designated label and effective area, including device-area fallback; report ambiguous matches instead of selecting the first sensor. Preserve the established label → area → explicit fallback priority without silently replacing an unavailable bound sensor.

Displaying a room sensor does not activate FOLLOW ME or transfer its temperature to the conditioner. The reviewed type 8 profile does not advertise the external data-source selector. External regulation is a separate unimplemented task.

## Confirmed user controls

Use only runtime-advertised values from the installed climate entity.

- HVAC: `off`, `auto`, `cool`, `dry`, `heat`, `fan_only` when present in `hvac_modes`.
- Target temperature: use entity `min_temp`, `max_temp`, `target_temp_step`.
- Fan: `auto`, `low`, `medium`, `high` when present in `fan_modes`.
- Swing: use `swing_modes` and HA support. When enabling from `off`, prefer `vertical`; do not default to `both`. Horizontal/both remain subject to physical verification on the exact unit.
- Night and Turbo are separate switch entities, not climate presets or fan speeds.

Revalidate availability, capability lists, feature flags, units and limits immediately before sending a command. An absent or empty capability list is not permission to use all hard-coded controls. Standard Syncleo `turn_on` selects AUTO; restoring a previous non-off mode requires explicit per-device policy and memory, not an assumed default.

## Draft/apply contract

Blue is intended to mean confirmed current state. Green means pending target state. Current Syncleo HA states can be optimistic; until incoming telemetry is distinguishable, the panel must not claim blue is confirmed by the appliance.

Changes are accumulated in the UI and sent by `Применить`. Distinguish service acceptance, an HA state match, and a new appliance report containing the requested values. A successful service call or an optimistic HA state match is not appliance confirmation. Record partial results per field and retain unconfirmed targets visibly.

The pinned transport does not await completion of commands. Strict confirmation requires receive timestamps/generations and reported values exported by Syncleo; these are proposed integration changes, not existing attributes. A transport ACK alone does not establish physical completion. Until receive evidence exists, use honest service/HA-level result wording.

Preserve the existing direct-control staged Apply workflow. The requested confirmation step for future saved bundles, schedule changes and CLEAN applies to those new workflows. Scheduled execution uses the previously saved instruction and must not depend on an open browser or a fresh interactive prompt.

## Summary contract

Summary is an operational report, not a duplicate control surface. It shows:

- state-driven conditioner visual;
- canonical NikaS two-level connection plaque;
- room temperature and its entity source;
- room humidity when available;
- target temperature;
- device temperature;
- current HVAC mode;
- fan speed;
- flap state;
- Night and Turbo;
- delta between room and device temperature.

Do not add ECO, GEAR, +8 °C heat, Quiet, Breeze Away, target humidity, arbitrary fan percentages, fixed flap angles, power consumption or compressor frequency without exact-device evidence.

Preserve the approved four tabs and the connection plaque on Summary only. The new capability registry is not an instruction to replace Statistics or redesign the approved Summary/Control layouts. Known runtime unknown/unavailable states must remain unknown throughout Summary and Diagnostics, including flap, Night and Turbo.

## Functions not yet active

Keep these out of active controls until command/profile support is verified on the exact unit:

- FRESH / ionisation;
- CLEAN / self-cleaning;
- FOLLOW ME;
- indoor-unit display control;
- native timers;
- native SHORT CUT synchronisation.

These may be listed in diagnostics as unverified/not active.

## Diagnostics

Diagnostics must expose runtime capability lists (`hvac_modes`, `fan_modes`, `swing_modes`, `supported_features`), temperature sources, local availability, last update, RSSI when present, relevant binary states, and a short command journal with confirmation result.

Device availability, actual local transport, browser connection and per-measurement freshness are separate. `last_changed`, `last_updated`, `last_reported` and transport last activity do not by themselves prove recent incoming device telemetry. Do not call data fresh solely because climate is available. Off mode can remain connected. Default false values before the first received report are not evidence of inactive functions or absence of faults. RSSI is diagnostic and disabled by default in the reviewed integration.

Until Syncleo exposes evidence of an accepted incoming sample, the connection plaque reports freshness as «Нет данных». Populated HA attributes may be restored or updated optimistically by command handlers, so they do not prove device reception. Available Syncleo (including OFF) is «Локально» with a neutral unknown-freshness surface; explicit Syncleo `unavailable` is «Нет связи»; `unknown`, missing entity or unverified platform is «Нет данных». Neither a fresh HA timestamp nor successful Refresh changes this evidence. Fresh/stale states require an accepted device sample and remain unverified for the current integration interface.

`hvac_mode` describes the selected mode. The reviewed Syncleo class has no `hvac_action`; never infer compressor activity from HEAT/COOL, a state image or the room/setpoint difference.

A known Syncleo reference-code concern is that `async_set_temperature()` in the reviewed revision assigns the requested setpoint to `_current_temp`. If device temperature suddenly becomes equal to the setpoint immediately after a command, compare the installed Syncleo version and fix the integration rather than hiding the issue in the UI.

## Planned HA features

Favorites and schedules are not currently implemented. Persist them server-side per verified device, label them as executed by Home Assistant, and keep them separate from the remote SHORT CUT memory and native Rusclimate schedules. Define restart, missed-run, cancellation, concurrent-edit and partial-failure behavior before enabling execution. Use the same validated command path as manual control.

## IR remote

The infrared remote is one-way. Commands sent through Wi-Fi do not update the remote display. The panel must not treat remote display state as authoritative or claim synchronisation with the remote memory.
