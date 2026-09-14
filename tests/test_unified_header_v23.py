from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PANEL = (ROOT / "custom_components/nikas_climate/frontend/nikas-climate-panel.js").read_text(encoding="utf-8")


def test_refresh_action_is_black_at_rest():
    assert ".header-action#refresh{color:var(--primary-text-color)!important}" in PANEL


def test_peer_selector_is_between_viewport_and_bottom_navigation():
    header = PANEL.index('<header class="app-header">')
    viewport = PANEL.index('<main class="viewport">', header)
    selector = PANEL.index('<div class="peer-selector"', viewport)
    navigation = PANEL.index('<nav class="bottom-nav">', selector)
    assert header < viewport < selector < navigation
    assert "grid-template-rows:calc(60px + env(safe-area-inset-top)) minmax(0,1fr) 52px calc(64px + env(safe-area-inset-bottom))" in PANEL

HERO_SOURCE = (ROOT / "custom_components/nikas_climate/frontend/nikas-climate-entry-154.js").read_text(encoding="utf-8")
PRODUCTION = (ROOT / "custom_components/nikas_climate/frontend/nikas-climate-production.js").read_text(encoding="utf-8")


def test_hero_accent_uses_canonical_density():
    canonical = ".u154-corner{position:absolute;width:205px;height:205px;right:-70px;top:-92px;border:0;border-radius:50%;background:color-mix(in srgb,var(--primary-color,#03a9d9) 12%,var(--card-background-color,#fff))"
    for artifact in (HERO_SOURCE, PRODUCTION):
        assert canonical in artifact
        assert "background:rgba(3,169,217,0.07)" not in artifact

