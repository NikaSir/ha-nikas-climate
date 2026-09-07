import "./nikas-climate-entry-150.js?v=1.4.10";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.4.11";
const ASSET_ROOT_151 = "/nikas_climate_panel/assets";
const HERO_IMAGES_151 = {
  off: `${ASSET_ROOT_151}/hero-off.webp?v=${PATCH_UI_VERSION}`,
  cool: `${ASSET_ROOT_151}/hero-cool.webp?v=${PATCH_UI_VERSION}`,
  heat: `${ASSET_ROOT_151}/hero-heat.webp?v=${PATCH_UI_VERSION}`,
  dry: `${ASSET_ROOT_151}/hero-dry.webp?v=${PATCH_UI_VERSION}`,
  fan_only: `${ASSET_ROOT_151}/hero-fan.webp?v=${PATCH_UI_VERSION}`,
  auto: `${ASSET_ROOT_151}/hero-auto.webp?v=${PATCH_UI_VERSION}`,
  unavailable: `${ASSET_ROOT_151}/hero-off.webp?v=${PATCH_UI_VERSION}`,
};
const MODE_META_151 = {
  off:["Выключен","mdi:power"],
  cool:["Охлаждение","mdi:snowflake"],
  heat:["Обогрев","mdi:fire"],
  auto:["Авто","mdi:autorenew"],
  dry:["Осушение","mdi:water-percent"],
  fan_only:["Вентиляция","mdi:fan"],
  unavailable:["Нет данных","mdi:lan-disconnect"]
};
const esc151=(v)=>String(v??"—").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

if (Panel && !Panel.prototype.__nikasUi151Patched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;

  Panel.prototype.summary = function(m) {
    const mode = MODE_META_151[m?.mode] || MODE_META_151.unavailable;
    const fan = this.fanLabel(m?.fan);
    const nightOn = m?.features?.night === "on";
    const turboOn = m?.features?.turbo === "on";
    const submode = turboOn ? "Турбо" : (nightOn ? "Ночной режим" : "");
    const delta = (m?.roomTemp != null && m?.indoor != null) ? Number(m.indoor) - Number(m.roomTemp) : null;
    const deltaText = Number.isFinite(delta) ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)} °C` : "—";
    const stateClass = `mode-${m?.mode || "unavailable"}`;
    const image = HERO_IMAGES_151[m?.mode] || HERO_IMAGES_151.unavailable;
    const metric = (icon,title,value)=>`<div class="u147-metric"><ha-icon icon="${icon}"></ha-icon><div><span>${title}</span><strong>${value}</strong></div></div>`;
    const status = (icon,title,value,active=false)=>`<div class="u147-status ${active ? "active" : ""}"><ha-icon icon="${icon}"></ha-icon><div><span>${title}</span><strong>${value}</strong></div></div>`;
    const swingValue = m?.swing === "off" ? "Выкл." : "Вкл.";
    const modeStatus = m?.mode === "off" ? "Выкл." : esc151(mode[0]);

    return `<section class="card u147-summary u151-summary ${stateClass}">
      <div class="u151-statusrow">
        <div class="u147-mode u151-mode"><ha-icon icon="${mode[1]}"></ha-icon><div><strong>${esc151(mode[0])}</strong>${submode ? `<span>${esc151(submode)}</span>` : ""}</div></div>
        <div class="u151-connection">${this.connectionPlaque(m)}</div>
      </div>

      <div class="u151-photo-wrap"><img class="u151-photo" src="${image}" alt="Ballu Lagoon" loading="eager" decoding="sync" fetchpriority="high"/></div>

      <div class="u147-metrics">
        ${metric("mdi:thermometer","Температура",`${this.fmt(m?.roomTemp,1)}°`)}
        ${metric("mdi:water-outline","Влажность",`${this.fmt(m?.humidity,0)}%`)}
        ${metric("mdi:thermometer","Уставка",`${this.fmt(m?.target,0)}°`)}
        ${metric("mdi:air-conditioner","У блока",`${this.fmt(m?.indoor,1)}°`)}
      </div>

      <div class="u147-band">
        ${status(mode[1],"Режим",modeStatus)}
        ${status(this.fanIcon(m?.fan),"Вентилятор",esc151(fan))}
        ${status("mdi:blinds-horizontal","Качание",swingValue,m?.swing !== "off")}
      </div>
      <div class="u147-band">
        ${status("mdi:weather-night","Ночной",nightOn ? "Вкл." : "Выкл.",nightOn)}
        ${status("mdi:rocket-launch-outline","Турбо",turboOn ? "Вкл." : "Выкл.",turboOn)}
        ${status("mdi:thermometer-lines","Δ датчиков",deltaText)}
      </div>

      <div class="u147-note"><ha-icon icon="mdi:information-outline"></ha-icon><span>Фактическая температура берётся только с выбранного комнатного датчика; уставка не используется как измерение.</span></div>
    </section>`;
  };

  Panel.prototype.__installNikasUi151 = function() {
    const root = this.shadowRoot;
    if (!root || root.querySelector("style[data-nikas-ui151]")) return;
    const style = document.createElement("style");
    style.dataset.nikasUi151 = "1";
    style.textContent = `
      .u151-summary{height:auto!important;min-height:0!important;align-self:flex-start;overflow:hidden;gap:9px!important}
      .u151-statusrow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:start;padding:7px 4px 3px;min-height:78px;box-sizing:border-box}
      .u151-mode{padding-top:6px;min-width:0}
      .u151-mode strong{white-space:nowrap}
      .u151-connection{justify-self:end;align-self:start;min-width:0}
      .u151-connection .connection-plaque,.u151-connection .conn-plaque,.u151-connection [class*="connection"]{margin:0!important;transform:none!important}
      .u151-photo-wrap{position:relative;width:100%;height:285px;border-radius:24px;overflow:hidden;background:linear-gradient(180deg,#f8fafb,#eef4f6)}
      .u151-photo{width:100%;height:100%;object-fit:cover;object-position:center;display:block}
      .u151-summary.mode-off .u151-photo{filter:none;opacity:1}
      .u151-summary.mode-cool .u151-photo{filter:saturate(1.05)}
      .u151-summary.mode-heat .u151-photo{filter:sepia(.12) saturate(.92) hue-rotate(-12deg)}
      .u151-summary.mode-dry .u151-photo{filter:saturate(.82) contrast(.98)}
      .u151-summary .u147-note{margin-bottom:0}
      @media(max-width:520px){
        .u151-statusrow{grid-template-columns:minmax(0,1fr) auto;gap:10px;min-height:72px;padding:5px 2px 2px}
        .u151-mode{padding-top:5px}
        .u151-mode strong{font-size:26px}
        .u151-mode ha-icon{--mdc-icon-size:32px}
        .u151-photo-wrap{height:250px;border-radius:20px}
      }
    `;
    root.appendChild(style);
  };

  Panel.prototype.__fixNikasUi151 = function() {
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    this.__installNikasUi151();
  };

  Panel.prototype.render = function(...args) {
    const result = previousRender.apply(this,args);
    this.__fixNikasUi151();
    return result;
  };
  Panel.prototype.patch = function(...args) {
    const result = previousPatch.apply(this,args);
    this.__fixNikasUi151();
    return result;
  };
  Panel.prototype.__nikasUi151Patched = true;
}
