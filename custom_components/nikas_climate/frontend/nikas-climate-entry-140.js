import "./nikas-climate-entry-139.js?v=1.3.9";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.4.0";
const AC_IMAGE = "/nikas_climate_panel/assets/ballu-lagoon.svg?v=1.4.0";

const ROOMS = [
  {key:"living", title:"Зал", area:"11.2 · Гостиная", climateNames:["Кондиционер в зале","Кондей в Гостиной"], explicitRoomTempEntity:"sensor.sensor_th_zb_11_temperature", explicitHumidityEntity:"sensor.sensor_th_zb_11_humidity"},
  {key:"veranda", title:"Веранда", area:"14 · Веранда", climateNames:["Кондиционер на веранде","Кондей на Веранде"], explicitRoomTempEntity:"sensor.sensor_th_zb_14_temperature", explicitHumidityEntity:"sensor.sensor_th_zb_14_humidity"},
];

const MODE_META = {
  off: {label:"Выключен", icon:"mdi:power", cls:"off"},
  cool: {label:"Охлаждение", icon:"mdi:snowflake", cls:"cool"},
  heat: {label:"Обогрев", icon:"mdi:fire", cls:"heat"},
  auto: {label:"Авто", icon:"mdi:autorenew", cls:"auto"},
  dry: {label:"Осушение", icon:"mdi:water-percent", cls:"dry"},
  fan_only: {label:"Вентиляция", icon:"mdi:fan", cls:"fan_only"},
  unavailable: {label:"Нет данных", icon:"mdi:lan-disconnect", cls:"unavailable"},
};

if (Panel && !Panel.prototype.__nikasUi140Patched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;

  Panel.prototype.__activeModel140 = function() {
    const root = this.shadowRoot;
    const peers = root ? [...root.querySelectorAll(".peer")] : [];
    let activeIndex = peers.findIndex((peer) => peer.classList.contains("active"));
    if (activeIndex < 0) activeIndex = 0;
    const room = ROOMS[activeIndex] || ROOMS[0];
    try { return this.roomModel(room); } catch (_) { return null; }
  };

  Panel.prototype.__applyStateHero140 = function() {
    const root = this.shadowRoot;
    if (!root) return;

    const model = this.__activeModel140();
    const mode = model?.available ? (model?.mode || "off") : "unavailable";
    const meta = MODE_META[mode] || MODE_META.off;

    root.querySelectorAll("img.u136-ac-photo").forEach((img) => {
      if (img.getAttribute("src") !== AC_IMAGE) img.setAttribute("src", AC_IMAGE);
      img.dataset.mode = meta.cls;
      img.alt = `Ballu Lagoon · ${meta.label}`;

      const host = img.parentElement;
      if (!host) return;
      host.classList.add("u140-hero-host");
      let badge = host.querySelector(":scope > .u140-state-badge");
      if (!badge) {
        badge = document.createElement("div");
        badge.className = "u140-state-badge";
        badge.innerHTML = '<ha-icon></ha-icon><span></span>';
        host.appendChild(badge);
      }
      badge.dataset.mode = meta.cls;
      badge.querySelector("ha-icon")?.setAttribute("icon", meta.icon);
      const text = badge.querySelector("span");
      if (text) text.textContent = meta.label;
    });
  };

  Panel.prototype.__installStateHeroStyle140 = function() {
    const root = this.shadowRoot;
    if (!root || root.querySelector("style[data-nikas-ui140]")) return;
    const style = document.createElement("style");
    style.dataset.nikasUi140 = "1";
    style.textContent = `
      .u140-hero-host{position:relative!important;}
      .u136-ac-photo{
        border-radius:18px!important;
        object-fit:contain!important;
        object-position:center!important;
        background:transparent!important;
        transition:filter .18s ease, opacity .18s ease!important;
      }
      .u136-ac-photo[data-mode="off"]{filter:grayscale(.35) saturate(.72) brightness(.98)!important;}
      .u136-ac-photo[data-mode="cool"]{filter:saturate(1.08) drop-shadow(0 12px 18px rgba(0,169,214,.28))!important;}
      .u136-ac-photo[data-mode="heat"]{filter:sepia(.10) saturate(1.10) drop-shadow(0 12px 18px rgba(230,143,44,.24))!important;}
      .u136-ac-photo[data-mode="auto"]{filter:saturate(1.04) drop-shadow(0 12px 18px rgba(62,170,102,.22))!important;}
      .u136-ac-photo[data-mode="dry"]{filter:saturate(1.02) drop-shadow(0 12px 18px rgba(0,160,176,.22))!important;}
      .u136-ac-photo[data-mode="fan_only"]{filter:saturate(.92) drop-shadow(0 10px 16px rgba(104,121,132,.18))!important;}
      .u136-ac-photo[data-mode="unavailable"]{filter:grayscale(1) saturate(.15) contrast(.88)!important;opacity:.58!important;}

      .u140-state-badge{
        position:absolute;left:12px;bottom:8px;z-index:3;
        display:flex;align-items:center;gap:6px;
        min-height:28px;padding:4px 9px;border-radius:14px;
        border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);
        background:color-mix(in srgb,var(--card-background-color) 88%,transparent);
        box-shadow:0 4px 14px rgba(0,0,0,.08);
        font-size:11px;font-weight:700;color:var(--secondary-text-color);
        pointer-events:none;
      }
      .u140-state-badge ha-icon{--mdc-icon-size:17px;}
      .u140-state-badge[data-mode="cool"]{color:var(--primary-color);border-color:color-mix(in srgb,var(--primary-color) 48%,transparent);}
      .u140-state-badge[data-mode="heat"]{color:#d97a1d;border-color:rgba(217,122,29,.35);}
      .u140-state-badge[data-mode="auto"]{color:#3ea866;border-color:rgba(62,168,102,.35);}
      .u140-state-badge[data-mode="dry"]{color:#009faf;border-color:rgba(0,159,175,.35);}
      .u140-state-badge[data-mode="fan_only"]{color:#667985;}
      .u140-state-badge[data-mode="unavailable"]{color:var(--secondary-text-color);opacity:.7;}
    `;
    root.appendChild(style);
  };

  Panel.prototype.render = function (...args) {
    const result = previousRender.apply(this, args);
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    this.__installStateHeroStyle140();
    this.__applyStateHero140();
    return result;
  };

  Panel.prototype.patch = function (...args) {
    const result = previousPatch.apply(this, args);
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    this.__installStateHeroStyle140();
    this.__applyStateHero140();
    return result;
  };

  Panel.prototype.__nikasUi140Patched = true;
}
