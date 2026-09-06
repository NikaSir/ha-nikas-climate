"""Register the integration-owned NikaS Climate panel."""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import DOMAIN, UI_VERSION, VERSION

_LOGGER = logging.getLogger(__name__)

PANEL_ID = "climate_v1"
PANEL_TITLE = "Кондиционирование"
PANEL_SIDEBAR_TITLE = "Кондиционирование"
PANEL_URL_PATH = "dashboard-climate-v1"
PANEL_ENTRY_ROUTE = "/dashboard-climate-v1/home"
PANEL_PARENT_ROUTE = "/dashboard-house-v13/home"
PANEL_ICON = "mdi:air-conditioner"
PANEL_WEB_COMPONENT = "nikas-climate-panel"
PANEL_STATIC_URL = "/nikas_climate_panel"
PANEL_STATIC_REGISTERED = "panel_static_registered"
PANEL_ROUTE_OWNER = "panel_route_owner"
PANEL_DIRECTORY = Path(__file__).parent / "frontend"
PANEL_BUNDLE = "nikas-climate-entry-136.js"

PANEL_METADATA = {
    "id": PANEL_ID,
    "title": PANEL_TITLE,
    "path": f"/{PANEL_URL_PATH}",
    "entry_route": PANEL_ENTRY_ROUTE,
    "parent_route": PANEL_PARENT_ROUTE,
    "icon": PANEL_ICON,
    "owner": DOMAIN,
    "preferred_view": "home",
    "ui_version": UI_VERSION,
    "frontend_bundle": PANEL_BUNDLE,
}


async def async_register_panel(hass: HomeAssistant, entry_id: str) -> bool:
    """Register the route if it does not already belong to another panel."""
    domain_data = hass.data.setdefault(DOMAIN, {})

    if not domain_data.get(PANEL_STATIC_REGISTERED):
        await hass.http.async_register_static_paths(
            [StaticPathConfig(PANEL_STATIC_URL, str(PANEL_DIRECTORY), cache_headers=False)]
        )
        domain_data[PANEL_STATIC_REGISTERED] = True

    if frontend.async_panel_exists(hass, PANEL_URL_PATH):
        _LOGGER.warning(
            "Route /%s already has an owner; NikaS Climate preserves it unchanged",
            PANEL_URL_PATH,
        )
        return False

    await panel_custom.async_register_panel(
        hass=hass,
        frontend_url_path=PANEL_URL_PATH,
        webcomponent_name=PANEL_WEB_COMPONENT,
        sidebar_title=PANEL_SIDEBAR_TITLE,
        sidebar_icon=PANEL_ICON,
        module_url=f"{PANEL_STATIC_URL}/{PANEL_BUNDLE}?v={VERSION}",
        embed_iframe=False,
        require_admin=False,
        handle_safe_area=True,
        config=PANEL_METADATA,
    )
    domain_data[PANEL_ROUTE_OWNER] = entry_id
    return True


def async_unregister_panel(hass: HomeAssistant, entry_id: str) -> None:
    """Remove only the route registered by this exact config entry."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    if domain_data.get(PANEL_ROUTE_OWNER) != entry_id:
        return
    domain_data.pop(PANEL_ROUTE_OWNER, None)
    frontend.async_remove_panel(hass, PANEL_URL_PATH, warn_if_unknown=False)
