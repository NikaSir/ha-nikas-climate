import "./nikas-climate-entry-139.js?v=1.3.9";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.4.0";

const STATE_ASSETS = {
  off: "/nikas_climate_panel/assets/ballu-off.webp",
  cool: "/nikas_climate_panel/assets/ballu-cool.webp",
  heat: "/nikas_climate_panel/assets/ballu-heat.webp",
  auto: "/nikas_climate_panel/assets/ballu-auto.webp",
  dry: "/nikas_climate_panel/assets/ballu-dry.webp",
  fan_only: "/nikas_climate_panel/assets/ballu-fan_only.webp",
  unavailable: "/nikas_climate_panel/assets/ballu-unavailable.webp",
};

const ROOMS = [
  {key:"living", title:"Зал", area:"11.2 · Гостиная", climateNames:["Кондиционер в зале","Кондей в Гостиной"], explicitRoomTempEntity:"sensor.sensor_th_zb_11_temperature", explicitHumidityEntity:"sensor.sensor_th_zb_11_humidity"},
  {key:"veranda", title:"Веранда", area:"14 · Веранда", climateNames:["Кондиционер на веранде","Кондей на Веранде"], explicitRoomTempEntity:"sensor.sensor_th_zb_14_temperature", explicitHumidityEntity:"sensor.sensor_th_zb_14_humidity"},
];

if (Panel && !Panel.prototype.__nikasUi140Patched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;

  Panel.prototype.__nikasStateAsset140 = function(model) {
    if (!model?.available) return STATE_ASSETS.unavailable;
    return STATE_ASSETS[model.mode] || STATE_ASSETS.off;
  };

  Panel.prototype.__applyStateHero140 = function() {
    const root = this.shadowRoot;
    if (!root) return;

    const peers = [...root.querySelectorAll(".peer")];
    let activeIndex = peers.findIndex((peer) => peer.classList.contains("active"));
    if (activeIndex < 0) activeIndex = 0;
    const room = ROOMS[activeIndex] || ROOMS[0];
    let model = null;
    try { model = this.roomModel(room); } catch (_) { model = null; }
    const src = this.__nikasStateAsset140(model);

    root.querySelectorAll("img.u136-ac-photo").forEach((img) => {
      if (img.getAttribute("src") !== src) img.setAttribute("src", src);
      img.dataset.mode = model?.available ? (model?.mode || "off") : "unavailable";
      img.alt = `Ballu Lagoon · ${model?.available ? (model?.mode || "off") : "unavailable"}`;
    });
  };

  Panel.prototype.__installStateHeroStyle140 = function() {
    const root = this.shadowRoot;
    if (!root || root.querySelector("style[data-nikas-ui140]")) return;
    const style = document.createElement("style");
    style.dataset.nikasUi140 = "1";
    style.textContent = `
      .u136-ac-photo{
        border-radius:18px!important;
        object-fit:contain!important;
        object-position:center!important;
        background:transparent!important;
        transition:opacity .18s ease, filter .18s ease!important;
      }
      .u136-ac-photo[data-mode="unavailable"]{filter:saturate(.25) contrast(.9)!important;}
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
