#!/usr/bin/env python3
"""Verify that HA, release metadata and CI target the same production panel."""
from __future__ import annotations

import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
COMPONENT = ROOT / "custom_components" / "nikas_climate"
FRONTEND = COMPONENT / "frontend"

manifest = json.loads((COMPONENT / "manifest.json").read_text(encoding="utf-8"))
standard = json.loads((ROOT / ".nikas-ui-standard.json").read_text(encoding="utf-8"))
const = (COMPONENT / "const.py").read_text(encoding="utf-8")
panel = (COMPONENT / "panel.py").read_text(encoding="utf-8")


def literal(source: str, name: str) -> str:
    match = re.search(rf'^{name}\s*=\s*["\']([^"\']+)["\']', source, re.MULTILINE)
    if match is None:
        raise SystemExit(f"Missing literal {name}")
    return match.group(1)


integration_version = literal(const, "VERSION")
ui_version = literal(const, "UI_VERSION")
bundle_name = literal(panel, "PANEL_BUNDLE")
bundle = FRONTEND / bundle_name
expected_path = bundle.relative_to(ROOT).as_posix()

assert manifest["version"] == integration_version
assert standard["integration_version"] == integration_version
assert standard["ui_version"] == ui_version
assert standard["header_title_line_2"] == f"UI v{ui_version}"
assert standard["production_entrypoint"] == expected_path
assert bundle_name == "nikas-climate-production.js"
assert bundle.is_file()

production = bundle.read_text(encoding="utf-8")
assert re.search(r"^\s*(?:import|export)\b", production, re.MULTILINE) is None
assert f'const UI158 = "{ui_version}"' in production
assert 'customElements.define("nikas-climate-panel",NikasClimatePanel)' in production
assert "nikas-climate-entry-158.js" in production
assert "nikas-climate-history-155.js" in production
assert "nikas-climate-statistics.js" in production

print(
    f"OK HA production entrypoint {expected_path}; "
    f"integration {integration_version}; UI {ui_version}; autonomous bundle"
)
