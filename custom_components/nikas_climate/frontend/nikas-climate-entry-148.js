import "./nikas-climate-entry-147.js?v=1.4.7";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.4.8";
const ASSET_ROOT_148 = "/nikas_climate_panel/assets";
const HERO_IMAGES_148 = {
  off: `${ASSET_ROOT_148}/hero-off.webp?v=${PATCH_UI_VERSION}`,
  cool: `${ASSET_ROOT_148}/hero-cool.webp?v=${PATCH_UI_VERSION}`,
  heat: `${ASSET_ROOT_148}/hero-heat.webp?v=${PATCH_UI_VERSION}`,
  dry: `${ASSET_ROOT_148}/hero-dry.webp?v=${PATCH_UI_VERSION}`,
  fan_only: `${ASSET_ROOT_148}/hero-fan.webp?v=${PATCH_UI_VERSION}`,
  auto: `${ASSET_ROOT_148}/hero-auto.webp?v=${PATCH_UI_VERSION}`,
  unavailable: `${ASSET_ROOT_148}/hero-off.webp?v=${PATCH_UI_VERSION}`,
};

if (typeof Image !== "undefined") {
  for (const src of new Set(Object.values(HERO_IMAGES_148))) {
    const image = new Image();
    image.decoding = "async";
    image.src = src;
  }
}

if (Panel && !Panel.prototype.__nikasUi148Patched) {
  const previousSummary = Panel.prototype.summary;
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;

  Panel.prototype.summary = function(m) {
    const image = HERO_IMAGES_148[m?.mode] || HERO_IMAGES_148.unavailable;
    const html = previousSummary.call(this, m);
    return html.replace(
      'src="/nikas_climate_panel/assets/ballu-lagoon.svg"',
      `src="${image}" loading="eager" decoding="sync" fetchpriority="high"`,
    );
  };

  Panel.prototype.__fixNikasUi148 = function() {
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
  };

  Panel.prototype.render = function(...args) {
    const result = previousRender.apply(this, args);
    this.__fixNikasUi148();
    return result;
  };

  Panel.prototype.patch = function(...args) {
    const result = previousPatch.apply(this, args);
    this.__fixNikasUi148();
    return result;
  };

  Panel.prototype.__nikasUi148Patched = true;
}
