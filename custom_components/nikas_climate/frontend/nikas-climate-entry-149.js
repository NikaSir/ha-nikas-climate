import "./nikas-climate-entry-148.js?v=1.4.8";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.4.9";
const ASSET_ROOT_149 = "/nikas_climate_panel/assets";
const HERO_IMAGES_149 = {
  off: `${ASSET_ROOT_149}/hero-off.webp?v=${PATCH_UI_VERSION}`,
  cool: `${ASSET_ROOT_149}/hero-cool.webp?v=${PATCH_UI_VERSION}`,
  heat: `${ASSET_ROOT_149}/hero-heat.webp?v=${PATCH_UI_VERSION}`,
  dry: `${ASSET_ROOT_149}/hero-dry.webp?v=${PATCH_UI_VERSION}`,
  fan_only: `${ASSET_ROOT_149}/hero-fan.webp?v=${PATCH_UI_VERSION}`,
  auto: `${ASSET_ROOT_149}/hero-auto.webp?v=${PATCH_UI_VERSION}`,
  unavailable: `${ASSET_ROOT_149}/hero-off.webp?v=${PATCH_UI_VERSION}`,
};
const MODE_META_149 = {
  off:["Выключен","mdi:power"], cool:["Охлаждение","mdi:snowflake"], heat:["Обогрев","mdi:fire"],
  auto:["Авто","mdi:autorenew"], dry:["Осушение","mdi:water-percent"], fan_only:["Вентиляция","mdi:fan"],
  unavailable:["Нет данных","mdi:lan-disconnect"]
};
const esc149=(v)=>String(v??"—").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

if (Panel && !Panel.prototype.__nikasUi149Patched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;

  Panel.prototype.summary = function(m) {
    const mode = MODE_META_149[m?.mode] || MODE_META_149.unavailable;
    const fan = this.fanLabel(m?.fan);
    const nightOn = m?.features?.night === "on";
    const turboOn = m?.features?.turbo === "on";
    const submode = turboOn ? "Турбо" : (nightOn ? "Ночной режим" : "");
    const delta = (m?.roomTemp != null && m?.indoor != null) ? Number(m.indoor) - Number(m.roomTemp) : null;
    const deltaText = Number.isFinite(delta) ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)} °C` : "—";
    const stateClass = `mode-${m?.mode || "unavailable"}`;
    const image = HERO_IMAGES_149[m?.mode] || HERO_IMAGES_149.unavailable;
    const metric = (icon,title,value)=>`<div class="u147-metric"><ha-icon icon="${icon}"></ha-icon><div><span>${title}</span><strong>${value}</strong></div></div>`;
    const status = (icon,title,value,active=false)=>`<div class="u147-status ${active ? "active" : ""}"><ha-icon icon="${icon}"></ha-icon><div><span>${title}</span><strong>${value}</strong></div></div>`;
    const flapValue = m?.swing === "off" ? "Неподвижен" : "Качание<br>включено";

    return `<section class="card u147-summary ${stateClass}">
      <div class="u147-hero">
        <div class="u147-headline">
          <div class="u147-mode"><ha-icon icon="${mode[1]}"></ha-icon><div><strong>${esc149(mode[0])}</strong>${submode ? `<span>${esc149(submode)}</span>` : ""}</div></div>
          ${this.connectionPlaque(m)}
        </div>
        <div class="u147-photo-wrap"><img class="u147-photo" src="${image}" alt="Ballu Lagoon" loading="eager" decoding="sync" fetchpriority="high"/></div>
      </div>

      <div class="u147-metrics">
        ${metric("mdi:thermometer","Температура",`${this.fmt(m?.roomTemp,1)}°`)}
        ${metric("mdi:water-outline","Влажность",`${this.fmt(m?.humidity,0)}%`)}
        ${metric("mdi:thermometer-check-outline","Уставка",`${this.fmt(m?.target,0)}°`)}
        ${metric("mdi:air-conditioner","У кондиционера",`${this.fmt(m?.indoor,1)}°`)}
      </div>

      <div class="u147-band">
        ${status(mode[1],"Режим",esc149(mode[0]))}
        ${status(this.fanIcon(m?.fan),"Вентилятор",esc149(fan))}
        ${status("mdi:blinds-horizontal","Створка",flapValue)}
      </div>
      <div class="u147-band">
        ${status("mdi:weather-night","Ночной",nightOn ? "Вкл." : "Выкл.",nightOn)}
        ${status("mdi:rocket-launch-outline","Турбо",turboOn ? "Вкл." : "Выкл.",turboOn)}
        ${status("mdi:thermometer-lines","Δ датчиков",deltaText)}
      </div>

      <div class="u147-note"><ha-icon icon="mdi:information-outline"></ha-icon><span>Фактическая температура берётся только с выбранного комнатного датчика; уставка не используется как измерение.</span></div>
    </section>`;
  };

  Panel.prototype.__installNikasUi149 = function() {
    const root = this.shadowRoot;
    if (!root || root.querySelector("style[data-nikas-ui149]")) return;
    const style = document.createElement("style");
    style.dataset.nikasUi149 = "1";
    style.textContent = `
      .u147-metric{justify-content:center;padding-top:12px;padding-bottom:12px}
      .u147-metric>div{justify-content:center}
      .u147-metric span{font-size:12px;line-height:1.1}
      .u147-metric strong{font-size:28px;margin-top:7px}
      .u147-status{padding-top:13px;padding-bottom:13px}
      .u147-status strong{font-size:19px;line-height:1.08;overflow-wrap:normal;word-break:normal}
      @media(max-width:520px){
        .u147-metric{padding-top:10px;padding-bottom:10px}
        .u147-metric span{font-size:10px}
        .u147-metric strong{font-size:24px;margin-top:6px}
        .u147-status{padding-top:11px;padding-bottom:11px}
        .u147-status strong{font-size:15px}
      }
    `;
    root.appendChild(style);
  };

  Panel.prototype.__fixNikasUi149 = function() {
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    this.__installNikasUi149();
  };

  Panel.prototype.render = function(...args) {
    const result = previousRender.apply(this,args);
    this.__fixNikasUi149();
    return result;
  };
  Panel.prototype.patch = function(...args) {
    const result = previousPatch.apply(this,args);
    this.__fixNikasUi149();
    return result;
  };
  Panel.prototype.__nikasUi149Patched = true;
}
