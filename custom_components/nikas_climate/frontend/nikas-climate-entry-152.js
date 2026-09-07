import "./nikas-climate-entry-151.js?v=1.4.11";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.4.12";
const ASSET_ROOT_152 = "/nikas_climate_panel/assets";
const HERO_IMAGES_152 = {
  off: `${ASSET_ROOT_152}/hero-off.webp?v=${PATCH_UI_VERSION}`,
  cool: `${ASSET_ROOT_152}/hero-cool.webp?v=${PATCH_UI_VERSION}`,
  heat: `${ASSET_ROOT_152}/hero-heat.webp?v=${PATCH_UI_VERSION}`,
  dry: `${ASSET_ROOT_152}/hero-dry.webp?v=${PATCH_UI_VERSION}`,
  fan_only: `${ASSET_ROOT_152}/hero-fan.webp?v=${PATCH_UI_VERSION}`,
  auto: `${ASSET_ROOT_152}/hero-auto.webp?v=${PATCH_UI_VERSION}`,
  unavailable: `${ASSET_ROOT_152}/hero-off.webp?v=${PATCH_UI_VERSION}`,
};
const MODE_META_152 = {
  off:["Выключен","mdi:power"],
  cool:["Охлаждение","mdi:snowflake"],
  heat:["Обогрев","mdi:fire"],
  auto:["Авто","mdi:autorenew"],
  dry:["Осушение","mdi:water-percent"],
  fan_only:["Вентиляция","mdi:fan"],
  unavailable:["Нет данных","mdi:lan-disconnect"]
};
const esc152=(v)=>String(v??"—").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

if (Panel && !Panel.prototype.__nikasUi152Patched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;

  Panel.prototype.summary = function(m) {
    const modeKey = m?.mode || "unavailable";
    const mode = MODE_META_152[modeKey] || MODE_META_152.unavailable;
    const fan = this.fanLabel(m?.fan);
    const nightOn = m?.features?.night === "on";
    const turboOn = m?.features?.turbo === "on";
    const submode = turboOn ? "Турбо" : (nightOn ? "Ночной режим" : "");
    const delta = (m?.roomTemp != null && m?.indoor != null) ? Number(m.indoor) - Number(m.roomTemp) : null;
    const deltaText = Number.isFinite(delta) ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)} °C` : "—";
    const stateClass = `mode-${modeKey}`;
    const image = HERO_IMAGES_152[modeKey] || HERO_IMAGES_152.unavailable;
    const metric = (icon,title,value)=>`<div class="u152-metric"><ha-icon icon="${icon}"></ha-icon><div><span>${title}</span><strong>${value}</strong></div></div>`;
    const status = (icon,title,value,active=false)=>`<div class="u152-status ${active ? "active" : ""}"><ha-icon icon="${icon}"></ha-icon><div><span>${title}</span><strong>${value}</strong></div></div>`;
    const swingValue = m?.swing === "off" ? "Выкл." : "Вкл.";
    const modeStatus = modeKey === "off" ? "Выкл." : esc152(mode[0]);
    const modeActive = !["off","unavailable"].includes(modeKey);

    return `<section class="card u152-summary ${stateClass}">
      <div class="u152-hero-shell">
        <div class="u152-corner" aria-hidden="true"></div>
        <div class="u152-statusrow">
          <div class="u152-mode"><ha-icon icon="${mode[1]}"></ha-icon><div><strong>${esc152(mode[0])}</strong>${submode ? `<span>${esc152(submode)}</span>` : ""}</div></div>
          <div class="u152-connection">${this.connectionPlaque(m)}</div>
        </div>
        <div class="u152-photo-wrap"><img class="u152-photo" src="${image}" alt="Ballu Lagoon" loading="eager" decoding="sync" fetchpriority="high"/></div>
      </div>

      <div class="u152-metrics">
        ${metric("mdi:thermometer","Температура",`${this.fmt(m?.roomTemp,1)}°`)}
        ${metric("mdi:water-outline","Влажность",`${this.fmt(m?.humidity,0)}%`)}
        ${metric("mdi:thermometer-check-outline","Уставка",`${this.fmt(m?.target,0)}°`)}
        ${metric("mdi:air-conditioner","У блока",`${this.fmt(m?.indoor,1)}°`)}
      </div>

      <div class="u152-band">
        ${status(mode[1],"Режим",modeStatus,modeActive)}
        ${status(this.fanIcon(m?.fan),"Вентилятор",esc152(fan))}
        ${status("mdi:blinds-horizontal","Качание",swingValue,m?.swing !== "off")}
      </div>
      <div class="u152-band u152-band-secondary">
        ${status("mdi:weather-night","Ночной",nightOn ? "Вкл." : "Выкл.",nightOn)}
        ${status("mdi:rocket-launch-outline","Турбо",turboOn ? "Вкл." : "Выкл.",turboOn)}
        ${status("mdi:thermometer-lines","Δ датчиков",deltaText)}
      </div>

      <div class="u152-note"><ha-icon icon="mdi:information-outline"></ha-icon><span>Фактическая температура берётся только с выбранного комнатного датчика; уставка не используется как измерение.</span></div>
    </section>`;
  };

  Panel.prototype.__installNikasUi152 = function() {
    const root = this.shadowRoot;
    if (!root || root.querySelector("style[data-nikas-ui152]")) return;
    const style = document.createElement("style");
    style.dataset.nikasUi152 = "1";
    style.textContent = `
      .u152-summary{--mode-accent:var(--primary-text-color);height:auto!important;min-height:0!important;overflow:hidden;display:flex;flex-direction:column;gap:10px!important;padding:12px 14px 14px!important;margin:0!important}
      .u152-summary.mode-cool{--mode-accent:#079ed0}.u152-summary.mode-heat{--mode-accent:#d47b2d}.u152-summary.mode-auto{--mode-accent:#43a85b}.u152-summary.mode-dry{--mode-accent:#18a6b6}.u152-summary.mode-fan_only{--mode-accent:#607d8b}.u152-summary.mode-off,.u152-summary.mode-unavailable{--mode-accent:var(--primary-text-color)}
      .u152-hero-shell{position:relative;overflow:hidden;border-radius:24px;background:linear-gradient(135deg,var(--card-background-color) 63%,color-mix(in srgb,var(--primary-color) 6%,var(--card-background-color)) 100%);padding:14px 12px 12px}
      .u152-corner{position:absolute;width:220px;height:220px;right:-78px;top:-105px;border-radius:50%;background:color-mix(in srgb,var(--primary-color) 7%,transparent);pointer-events:none;z-index:0}
      .u152-statusrow{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1fr) 176px;gap:14px;align-items:start;min-height:80px;padding:2px 2px 8px}
      .u152-mode{display:flex;gap:10px;align-items:flex-start;min-width:0;padding-top:7px}.u152-mode ha-icon{--mdc-icon-size:36px;color:var(--mode-accent);margin-top:0}.u152-mode>div{min-width:0;display:flex;flex-direction:column}.u152-mode strong{font-size:31px;line-height:1;font-weight:800;color:var(--mode-accent);white-space:nowrap}.u152-mode span{font-size:18px;line-height:1.08;font-weight:700;margin-top:6px;color:var(--primary-text-color)}
      .u152-connection{justify-self:end;align-self:start;width:176px;min-width:176px;max-width:176px;overflow:visible}.u152-connection>*{box-sizing:border-box;max-width:100%!important}
      .u152-connection .connection-plaque,.u152-connection .conn-plaque,.u152-connection [class*="connection"]{width:176px!important;min-width:176px!important;max-width:176px!important;margin:0!important;transform:none!important;white-space:normal!important;overflow:visible!important}
      .u152-photo-wrap{position:relative;z-index:1;width:100%;height:286px;border-radius:22px;overflow:hidden;background:linear-gradient(180deg,#f8fafb,#eef4f6)}
      .u152-photo{width:100%;height:100%;object-fit:cover;object-position:center;display:block}
      .u152-summary.mode-off .u152-photo{filter:none;opacity:1}.u152-summary.mode-cool .u152-photo{filter:saturate(1.06)}.u152-summary.mode-heat .u152-photo{filter:sepia(.10) saturate(.94) hue-rotate(-10deg)}.u152-summary.mode-dry .u152-photo{filter:saturate(.84) contrast(.99)}
      .u152-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--divider-color);border-radius:22px;background:var(--card-background-color);overflow:hidden}
      .u152-metric{min-width:0;display:flex;align-items:center;justify-content:center;gap:7px;padding:13px 8px;position:relative}.u152-metric+.u152-metric:before{content:"";position:absolute;left:0;top:13px;bottom:13px;width:1px;background:var(--divider-color)}.u152-metric ha-icon{flex:0 0 auto;color:var(--primary-color);--mdc-icon-size:24px}.u152-metric>div{min-width:0;display:flex;flex-direction:column;justify-content:center}.u152-metric span{font-size:12px;line-height:1.08;color:var(--secondary-text-color);white-space:normal}.u152-metric strong{font-size:28px;line-height:1;font-weight:800;margin-top:6px;white-space:nowrap}
      .u152-band{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border:1px solid var(--divider-color);border-radius:22px;background:var(--card-background-color);overflow:hidden;min-height:84px}.u152-status{min-width:0;display:flex;align-items:center;gap:10px;padding:14px 13px;position:relative}.u152-status+.u152-status:before{content:"";position:absolute;left:0;top:13px;bottom:13px;width:1px;background:var(--divider-color)}.u152-status ha-icon{flex:0 0 auto;--mdc-icon-size:30px;color:var(--primary-text-color)}.u152-status>div{min-width:0;display:flex;flex-direction:column}.u152-status span{font-size:12px;color:var(--secondary-text-color);line-height:1.05}.u152-status strong{font-size:19px;line-height:1.08;font-weight:800;margin-top:4px;white-space:normal;overflow-wrap:normal;word-break:normal}.u152-status.active ha-icon,.u152-status.active strong{color:var(--primary-color)}
      .u152-band:first-of-type .u152-status:first-child.active ha-icon,.u152-band:first-of-type .u152-status:first-child.active strong{color:var(--mode-accent)}
      .u152-band-secondary{min-height:82px}
      .u152-note{display:flex;align-items:center;gap:12px;border-radius:18px;background:rgba(0,169,214,.08);padding:11px 14px;color:var(--secondary-text-color);font-size:11px;line-height:1.28}.u152-note ha-icon{--mdc-icon-size:26px;color:var(--primary-color);flex:0 0 auto}
      @media(max-width:520px){
        .u152-summary{gap:9px!important;padding:10px 12px 12px!important}.u152-hero-shell{padding:12px 10px 10px;border-radius:22px}.u152-corner{width:188px;height:188px;right:-68px;top:-93px}
        .u152-statusrow{grid-template-columns:minmax(0,1fr) 154px;gap:10px;min-height:72px;padding:0 0 7px}.u152-mode{padding-top:6px;gap:8px}.u152-mode strong{font-size:28px}.u152-mode span{font-size:16px}.u152-mode ha-icon{--mdc-icon-size:33px}
        .u152-connection{width:154px;min-width:154px;max-width:154px}.u152-connection .connection-plaque,.u152-connection .conn-plaque,.u152-connection [class*="connection"]{width:154px!important;min-width:154px!important;max-width:154px!important}
        .u152-photo-wrap{height:252px;border-radius:20px}
        .u152-metric{padding:11px 6px;gap:5px}.u152-metric ha-icon{--mdc-icon-size:21px}.u152-metric span{font-size:10px}.u152-metric strong{font-size:24px;margin-top:5px}
        .u152-band{min-height:76px}.u152-status{padding:12px 8px;gap:7px}.u152-status ha-icon{--mdc-icon-size:25px}.u152-status span{font-size:10px}.u152-status strong{font-size:15px}.u152-band-secondary{min-height:74px}.u152-note{font-size:10px;padding:9px 11px}
      }
    `;
    root.appendChild(style);
  };

  Panel.prototype.__fixNikasUi152 = function() {
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    this.__installNikasUi152();
  };

  Panel.prototype.render = function(...args) {
    const result = previousRender.apply(this,args);
    this.__fixNikasUi152();
    return result;
  };
  Panel.prototype.patch = function(...args) {
    const result = previousPatch.apply(this,args);
    this.__fixNikasUi152();
    return result;
  };
  Panel.prototype.__nikasUi152Patched = true;
}
