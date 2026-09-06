# Ballu Lagoon DC — NikaS Climate contract

Status: project contract derived from the verified function registry dated 2026-09-06.

## Source hierarchy

The panel must prefer runtime capabilities of the installed Home Assistant climate entity over family documentation or neighbouring Ballu generations. The reviewed Syncleo reference is DeKaN/ha-syncleo commit `4f9e15bdaa3d02ff0f08fb7249ac000a4cc52638`; the installed user version must be checked separately when diagnosing integration behaviour.

## Three temperature values

Never merge these values:

- `room_temperature` — selected room sensor, resolved by label/area and explicit fallback.
- `device_temperature` — `current_temperature` reported by the conditioner.
- `target_temperature` — conditioner setpoint.

If the room sensor is unavailable, show no room value. Never substitute the setpoint or device temperature silently.

## Confirmed user controls

Use only runtime-advertised values from the installed climate entity.

- HVAC: `off`, `auto`, `cool`, `dry`, `heat`, `fan_only` when present in `hvac_modes`.
- Target temperature: use entity `min_temp`, `max_temp`, `target_temp_step`.
- Fan: `auto`, `low`, `medium`, `high` when present in `fan_modes`.
- Swing: use `swing_modes` and HA support. When enabling from `off`, prefer `vertical`; do not default to `both`. Horizontal/both remain subject to physical verification on the exact unit.
- Night and Turbo are separate switch entities, not climate presets or fan speeds.

## Draft/apply contract

Blue means confirmed current state. Green means pending target state.

Changes are accumulated in the UI and sent by `Применить`. A successful service call is not sufficient by itself: the panel waits for updated HA state and reports missing local confirmation instead of presenting an unconfirmed state as current.

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

A known Syncleo reference-code concern is that `async_set_temperature()` in the reviewed revision assigns the requested setpoint to `_current_temp`. If device temperature suddenly becomes equal to the setpoint immediately after a command, compare the installed Syncleo version and fix the integration rather than hiding the issue in the UI.

## IR remote

The infrared remote is one-way. Commands sent through Wi-Fi do not update the remote display. The panel must not treat remote display state as authoritative or claim synchronisation with the remote memory.
