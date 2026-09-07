import "./nikas-climate-entry-152.js?v=1.4.12";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.4.13";
const ASSET_ROOT_153 = "/nikas_climate_panel/assets";
const HERO_IMAGES_153 = {
  off: `${ASSET_ROOT_153}/hero-off.webp?v=${PATCH_UI_VERSION}`,
  cool: `${ASSET_ROOT_153}/hero-cool.webp?v=${PATCH_UI_VERSION}`,
  heat: `${ASSET_ROOT_153}/hero-heat.webp?v=${PATCH_UI_VERSION}`,
  dry: `${ASSET_ROOT_153}/hero-dry.webp?v=${PATCH_UI_VERSION}`,
  fan_only: `${ASSET_ROOT_153}/hero-fan.webp?v=${PATCH_UI_VERSION}`,
  auto: `${ASSET_ROOT_153}/hero-auto.webp?v=${PATCH_UI_VERSION}`,
  unavailable: `${ASSET_ROOT_153}/hero-off.webp?v=${PATCH_UI_VERSION}`,
};
const MODE_META_153 = {
  off:["Выключен","mdi:power"], cool:["Охлаждение","mdi:snowflake"],
  heat:["Обогрев","mdi:fire"], auto:["Авто","mdi:autorenew"],
  dry:["Осушение","mdi:water-percent"], fan_only:["Вентиляция","mdi:fan"],
  unavailable:["Нет данных","mdi:lan-disconnect"]
};
const esc153=(v)=>String(v??"—").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

if (Panel && !Panel.prototype.__nikasUi153Patched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;

  Panel.prototype.summary = function(m) {
    const modeKey=m?.mode||"unavailable";
    const mode=MODE_META_153[modeKey]||MODE_META_153.unavailable;
    const nightOn=m?.features?.night==="on";
    const turboOn=m?.features?.turbo==="on";
    const submode=turboOn?"Турбо":(nightOn?"Ночной режим":"");
    const delta=(m?.roomTemp!=null&&m?.indoor!=null)?Number(m.indoor)-Number(m.roomTemp):null;
    const deltaText=Number.isFinite(delta)?`${delta>0?"+":""}${delta.toFixed(1)} °C`:"—";
    const image=HERO_IMAGES_153[modeKey]||HERO_IMAGES_153.unavailable;
    const metric=(icon,title,value)=>`<div class="u153-metric"><ha-icon icon="${icon}"></ha-icon><div><span>${title}</span><strong>${value}</strong></div></div>`;
    const status=(icon,title,value,active=false)=>`<div class="u153-status ${active?"active":""}"><ha-icon icon="${icon}"></ha-icon><div><span>${title}</span><strong>${value}</strong></div></div>`;
    const modeStatus=modeKey==="off"?"Выкл.":esc153(mode[0]);
    const swingValue=m?.swing==="off"?"Выкл.":"Вкл.";

    return `<div class="u153-summary-wrap mode-${modeKey}">
      <section class="card u153-summary">
        <div class="u153-hero">
          <div class="u153-corner" aria-hidden="true"></div>
          <div class="u153-head">
            <div class="u153-mode"><ha-icon icon="${mode[1]}"></ha-icon><div><strong>${esc153(mode[0])}</strong>${submode?`<span>${esc153(submode)}</span>`:""}</div></div>
            <div class="u153-connection">${this.connectionPlaque(m)}</div>
          </div>
          <div class="u153-photo-wrap"><img class="u153-photo" src="${image}" alt="Ballu Lagoon" loading="eager" decoding="sync" fetchpriority="high"/></div>
        </div>
        <div class="u153-metrics">
          ${metric("mdi:thermometer","Температура",`${this.fmt(m?.roomTemp,1)}°`)}
          ${metric("mdi:water-outline","Влажность",`${this.fmt(m?.humidity,0)}%`)}
          ${metric("mdi:thermometer","Уставка",`${this.fmt(m?.target,0)}°`)}
          ${metric("mdi:air-conditioner","У блока",`${this.fmt(m?.indoor,1)}°`)}
        </div>
        <div class="u153-band">
          ${status(mode[1],"Режим",modeStatus,!["off","unavailable"].includes(modeKey))}
          ${status(this.fanIcon(m?.fan),"Вентилятор",esc153(this.fanLabel(m?.fan)))}
          ${status("mdi:blinds-horizontal","Качание",swingValue,m?.swing!=="off")}
        </div>
        <div class="u153-band u153-band-secondary">
          ${status("mdi:weather-night","Ночной",nightOn?"Вкл.":"Выкл.",nightOn)}
          ${status("mdi:rocket-launch-outline","Турбо",turboOn?"Вкл.":"Выкл.",turboOn)}
          ${status("mdi:thermometer-lines","Δ датчиков",deltaText)}
        </div>
      </section>
      <aside class="u153-note"><ha-icon icon="mdi:information-outline"></ha-icon><span>Фактическая температура берётся только с выбранного комнатного датчика; уставка не используется как измерение.</span></aside>
    </div>`;
  };

  Panel.prototype.__installNikasUi153=function(){
    const root=this.shadowRoot;
    if(!root||root.querySelector("style[data-nikas-ui153]"))return;
    const style=document.createElement("style");
    style.dataset.nikasUi153="1";
    style.textContent=`
      .u153-summary-wrap{--mode-accent:var(--primary-text-color);display:flex;flex-direction:column;gap:16px;min-height:100%}
      .u153-summary-wrap.mode-cool{--mode-accent:#079ed0}.u153-summary-wrap.mode-heat{--mode-accent:#d47b2d}.u153-summary-wrap.mode-auto{--mode-accent:#43a85b}.u153-summary-wrap.mode-dry{--mode-accent:#18a6b6}.u153-summary-wrap.mode-fan_only{--mode-accent:#607d8b}
      .u153-summary{height:auto!important;min-height:0!important;overflow:hidden;display:flex;flex-direction:column;gap:10px!important;padding:14px!important;margin:0!important;border-radius:24px}
      .u153-hero{position:relative;overflow:hidden;border-radius:22px;background:var(--card-background-color);padding:10px 10px 12px}
      .u153-corner{position:absolute;width:220px;height:220px;right:-78px;top:-102px;border-radius:50%;background:color-mix(in srgb,var(--primary-color) 7%,transparent);pointer-events:none;z-index:0}
      .u153-head{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1fr) minmax(142px,34%);gap:18px;align-items:start;min-height:102px;padding:8px 4px 12px}
      .u153-mode{display:flex;gap:12px;align-items:flex-start;min-width:0;padding-top:9px}.u153-mode ha-icon{--mdc-icon-size:38px;color:var(--mode-accent)}.u153-mode>div{min-width:0;display:flex;flex-direction:column}.u153-mode strong{font-size:34px;line-height:1;font-weight:800;color:var(--mode-accent);white-space:nowrap}.u153-mode span{font-size:18px;line-height:1.08;font-weight:700;margin-top:7px;color:var(--primary-text-color)}
      .u153-connection{justify-self:stretch;align-self:start;min-width:0}.u153-connection .connection-indicator{margin:0!important;width:100%!important;box-sizing:border-box}
      .u153-photo-wrap{position:relative;z-index:1;width:100%;height:286px;border-radius:22px;overflow:hidden;background:linear-gradient(180deg,#f8fafb,#eef4f6)}.u153-photo{width:100%;height:100%;object-fit:cover;object-position:center;display:block}
      .u153-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--divider-color);border-radius:22px;background:var(--card-background-color);overflow:hidden}.u153-metric{min-width:0;display:flex;align-items:center;justify-content:center;gap:7px;padding:14px 8px;position:relative}.u153-metric+.u153-metric:before{content:"";position:absolute;left:0;top:13px;bottom:13px;width:1px;background:var(--divider-color)}.u153-metric ha-icon{flex:0 0 auto;color:var(--primary-color);--mdc-icon-size:24px}.u153-metric>div{min-width:0;display:flex;flex-direction:column}.u153-metric span{font-size:12px;line-height:1.08;color:var(--secondary-text-color)}.u153-metric strong{font-size:28px;line-height:1;font-weight:800;margin-top:6px;white-space:nowrap}
      .u153-band{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border:1px solid var(--divider-color);border-radius:22px;background:var(--card-background-color);overflow:hidden;min-height:88px}.u153-status{min-width:0;display:flex;align-items:center;gap:11px;padding:15px 14px;position:relative}.u153-status+.u153-status:before{content:"";position:absolute;left:0;top:13px;bottom:13px;width:1px;background:var(--divider-color)}.u153-status ha-icon{flex:0 0 auto;--mdc-icon-size:31px;color:var(--primary-text-color)}.u153-status>div{min-width:0;display:flex;flex-direction:column}.u153-status span{font-size:12px;color:var(--secondary-text-color);line-height:1.05}.u153-status strong{font-size:19px;line-height:1.08;font-weight:800;margin-top:5px;white-space:normal}.u153-status.active ha-icon,.u153-status.active strong{color:var(--primary-color)}.u153-band:first-of-type .u153-status:first-child.active ha-icon,.u153-band:first-of-type .u153-status:first-child.active strong{color:var(--mode-accent)}
      .u153-band-secondary{min-height:84px}
      .u153-note{display:flex;align-items:center;gap:12px;margin:0 14px 24px;border:1px solid var(--divider-color);border-radius:18px;background:rgba(0,169,214,.08);padding:12px 14px;color:var(--secondary-text-color);font-size:11px;line-height:1.3}.u153-note ha-icon{--mdc-icon-size:26px;color:var(--primary-color);flex:0 0 auto}
      @media(max-width:520px){
        .u153-summary-wrap{gap:14px;min-height:calc(100dvh - 208px)}.u153-summary{gap:9px!important;padding:11px 12px 13px!important}.u153-hero{padding:9px 9px 10px}.u153-corner{width:188px;height:188px;right:-66px;top:-90px}
        .u153-head{grid-template-columns:minmax(0,1fr) minmax(140px,35%);gap:12px;min-height:92px;padding:6px 2px 11px}.u153-mode{padding-top:8px;gap:9px}.u153-mode ha-icon{--mdc-icon-size:34px}.u153-mode strong{font-size:30px}.u153-mode span{font-size:16px}
        .u153-connection .connection-indicator{min-height:64px!important}
        .u153-photo-wrap{height:252px;border-radius:20px}
        .u153-metric{padding:12px 6px;gap:5px}.u153-metric ha-icon{--mdc-icon-size:21px}.u153-metric span{font-size:10px}.u153-metric strong{font-size:24px;margin-top:5px}
        .u153-band{min-height:80px}.u153-status{padding:13px 9px;gap:8px}.u153-status ha-icon{--mdc-icon-size:26px}.u153-status span{font-size:10px}.u153-status strong{font-size:16px}.u153-band-secondary{min-height:78px}
        .u153-note{font-size:10px;margin:0 12px 24px;padding:10px 12px}
      }
    `;
    root.appendChild(style);
  };

  Panel.prototype.__fixNikasUi153=function(){
    const version=this.shadowRoot?.querySelector(".header-title span");
    if(version)version.textContent=`UI v${PATCH_UI_VERSION}`;
    this.__installNikasUi153();
  };
  Panel.prototype.render=function(...args){const r=previousRender.apply(this,args);this.__fixNikasUi153();return r;};
  Panel.prototype.patch=function(...args){const r=previousPatch.apply(this,args);this.__fixNikasUi153();return r;};
  Panel.prototype.__nikasUi153Patched=true;
}
