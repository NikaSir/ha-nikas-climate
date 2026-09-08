import "./nikas-climate-entry-152.js?v=1.4.12";

import "./nikas-climate-statistics.js?v=1.4.14";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.4.14";
const ASSET_ROOT_154 = "/nikas_climate_panel/assets";
const HERO_IMAGES_154 = {
  off: `${ASSET_ROOT_154}/hero-off-v2.png?v=${PATCH_UI_VERSION}`,
  cool: `${ASSET_ROOT_154}/hero-cool.webp?v=${PATCH_UI_VERSION}`,
  heat: `${ASSET_ROOT_154}/hero-heat.webp?v=${PATCH_UI_VERSION}`,
  dry: `${ASSET_ROOT_154}/hero-dry.webp?v=${PATCH_UI_VERSION}`,
  fan_only: `${ASSET_ROOT_154}/hero-fan.webp?v=${PATCH_UI_VERSION}`,
  auto: `${ASSET_ROOT_154}/hero-auto.webp?v=${PATCH_UI_VERSION}`,
  unavailable: `${ASSET_ROOT_154}/hero-off-v2.png?v=${PATCH_UI_VERSION}`,
};
const MODE_META_154 = {
  off:["Выключен","mdi:power"], cool:["Охлаждение","mdi:snowflake"],
  heat:["Обогрев","mdi:fire"], auto:["Авто","mdi:autorenew"],
  dry:["Осушение","mdi:water-percent"], fan_only:["Вентиляция","mdi:fan"],
  unavailable:["Нет данных","mdi:lan-disconnect"]
};
const esc154=(v)=>String(v??"—").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

if (Panel && !Panel.prototype.__nikasUi154Patched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;

  Panel.prototype.summary = function(m) {
    const modeKey=m?.available === false ? "unavailable" : (m?.mode||"unavailable");
    const mode=MODE_META_154[modeKey]||MODE_META_154.unavailable;
    const nightOn=m?.features?.night==="on";
    const turboOn=m?.features?.turbo==="on";
    const submode=["off","unavailable"].includes(modeKey)?"":(turboOn?"Турбо":(nightOn?"Ночной режим":""));
    const delta=(m?.roomTemp!=null&&m?.indoor!=null)?Number(m.indoor)-Number(m.roomTemp):null;
    const deltaText=Number.isFinite(delta)?`${delta>0?"+":""}${delta.toFixed(1)} °C`:"—";
    const image=HERO_IMAGES_154[modeKey]||HERO_IMAGES_154.unavailable;
    const metric=(icon,title,value)=>`<div class="u154-metric"><ha-icon icon="${icon}"></ha-icon><div><span>${title}</span><strong>${value}</strong></div></div>`;
    const status=(icon,title,value,active=false)=>`<div class="u154-status ${active?"active":""}"><ha-icon icon="${icon}"></ha-icon><div><span>${title}</span><strong>${value}</strong></div></div>`;
    const modeStatus=modeKey==="off"?"Выкл.":esc154(mode[0]);
    const swingKnown=["off","vertical","horizontal","both","on"].includes(m?.swing);
    const swingValue=swingKnown?(m.swing==="off"?"Выкл.":"Вкл."):"—";

    return `<div class="u154-summary-wrap mode-${modeKey}">
      <section class="card u154-summary">
        <div class="u154-decoration" aria-hidden="true"><div class="u154-corner"></div></div>
        ${this.connectionPlaque(m)}
        <div class="u154-hero">
          <div class="u154-head">
            <div class="u154-mode"><ha-icon icon="${mode[1]}"></ha-icon><div><strong>${esc154(mode[0])}</strong>${submode?`<span>${esc154(submode)}</span>`:""}</div></div>
          </div>
          <div class="u154-photo-wrap"><img class="u154-photo" src="${image}" alt="Ballu Lagoon" loading="eager" decoding="sync" fetchpriority="high"/></div>
        </div>
        <div class="u154-metrics">
          ${metric("mdi:thermometer","Температура",`${this.fmt(m?.roomTemp,1)}°`)}
          ${metric("mdi:water-outline","Влажность",`${this.fmt(m?.humidity,0)}%`)}
          ${metric("mdi:thermometer","Уставка",`${this.fmt(m?.target,0)}°`)}
          ${metric("mdi:air-conditioner","У блока",`${this.fmt(m?.indoor,1)}°`)}
        </div>
        <div class="u154-band">
          ${status(mode[1],"Режим",modeStatus,!["off","unavailable"].includes(modeKey))}
          ${status(this.fanIcon(m?.fan),"Вентилятор",esc154(this.fanLabel(m?.fan)))}
          ${status("mdi:blinds-horizontal","Качание",swingValue,swingKnown&&m.swing!=="off")}
        </div>
        <div class="u154-band u154-band-secondary">
          ${status("mdi:weather-night","Ночной",this.boolLabel(m?.features?.night),nightOn)}
          ${status("mdi:rocket-launch-outline","Турбо",this.boolLabel(m?.features?.turbo),turboOn)}
          ${status("mdi:thermometer-lines","Δ датчиков",deltaText)}
        </div>
      </section>
      <aside class="u154-note"><ha-icon icon="mdi:information-outline"></ha-icon><span>Фактическая температура берётся только с выбранного комнатного датчика; уставка не используется как измерение.</span></aside>
    </div>`;
  };

  Panel.prototype.__installNikasUi154=function(){
    const root=this.shadowRoot;
    if(!root||root.querySelector("style[data-nikas-ui154]"))return;
    const style=document.createElement("style");
    style.dataset.nikasUi154="1";
    style.textContent=`
      .statistics-periods{display:flex;gap:8px;margin:16px 0}.statistics-periods button{border:1px solid var(--divider-color);border-radius:14px;padding:12px 18px;background:var(--card-background-color);color:var(--primary-text-color)}.statistics-periods button[aria-pressed="true"]{color:var(--primary-color);border-color:var(--primary-color)}[data-history-chart]{display:block;margin-bottom:14px;min-height:80px}
      .u154-summary-wrap{--mode-accent:var(--primary-text-color);display:flex;flex-direction:column;gap:16px;min-height:100%}
      .u154-summary-wrap.mode-cool{--mode-accent:#079ed0}.u154-summary-wrap.mode-heat{--mode-accent:#d47b2d}.u154-summary-wrap.mode-auto{--mode-accent:#43a85b}.u154-summary-wrap.mode-dry{--mode-accent:#18a6b6}.u154-summary-wrap.mode-fan_only{--mode-accent:#607d8b}
      /* NikaS 2.2 connection/decor contract v1.1: one card coordinate system. */
      .u154-summary{position:relative;isolation:isolate;box-sizing:border-box;border:1px solid var(--divider-color);padding:16px!important;container:nikas-card / inline-size;height:auto!important;min-height:0!important;overflow:visible;display:flex;flex-direction:column;gap:10px!important;margin:0!important;border-radius:24px}
      .u154-decoration{position:absolute;inset:0;border-radius:inherit;overflow:hidden;z-index:0;pointer-events:none}
      .u154-corner{position:absolute;width:205px;height:205px;right:-70px;top:-92px;border:0;border-radius:50%;background:rgba(3,169,217,0.07);opacity:1;box-shadow:none;filter:none;transform:none;animation:none;pointer-events:none}
      .u154-hero,.u154-metrics,.u154-band{position:relative;z-index:1;min-width:0}
      .u154-head{box-sizing:border-box;min-height:58px;padding:0 177px 0 0}
      .u154-mode{display:flex;flex-direction:column;gap:6px;align-items:flex-start;min-width:0}.u154-mode ha-icon{--mdc-icon-size:38px;color:var(--mode-accent);flex-shrink:0}.u154-mode>div{min-width:0;max-width:100%;display:flex;flex-direction:column}.u154-mode strong{font-size:34px;line-height:1;font-weight:800;color:var(--mode-accent);white-space:normal;overflow-wrap:anywhere;word-break:normal}.u154-mode span{font-size:18px;line-height:1.08;font-weight:700;margin-top:7px;color:var(--primary-text-color)}
      @container nikas-card (width < 326px){.u154-head{padding-right:0;padding-top:67px}}
      .u154-photo-wrap{position:relative;z-index:1;margin-top:12px;width:100%;height:clamp(150px,calc(100dvh - 625px),286px);border-radius:22px;overflow:hidden;background:linear-gradient(180deg,#f8fafb,#eef4f6)}.u154-photo{width:100%;height:100%;object-fit:cover;object-position:center;display:block}
      .u154-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--divider-color);border-radius:22px;background:var(--card-background-color);overflow:hidden}.u154-metric{min-width:0;display:flex;align-items:center;justify-content:center;gap:7px;padding:14px 8px;position:relative}.u154-metric+.u154-metric:before{content:"";position:absolute;left:0;top:13px;bottom:13px;width:1px;background:var(--divider-color)}.u154-metric ha-icon{flex:0 0 auto;color:var(--primary-color);--mdc-icon-size:24px}.u154-metric>div{min-width:0;display:flex;flex-direction:column}.u154-metric span{font-size:12px;line-height:1.08;color:var(--secondary-text-color)}.u154-metric strong{font-size:28px;line-height:1;font-weight:800;margin-top:6px;white-space:nowrap}
      .u154-band{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border:1px solid var(--divider-color);border-radius:22px;background:var(--card-background-color);overflow:hidden;min-height:88px}.u154-status{min-width:0;display:flex;align-items:center;gap:11px;padding:15px 14px;position:relative}.u154-status+.u154-status:before{content:"";position:absolute;left:0;top:13px;bottom:13px;width:1px;background:var(--divider-color)}.u154-status ha-icon{flex:0 0 auto;--mdc-icon-size:31px;color:var(--primary-text-color)}.u154-status>div{min-width:0;display:flex;flex-direction:column}.u154-status span{font-size:12px;color:var(--secondary-text-color);line-height:1.05}.u154-status strong{font-size:19px;line-height:1.08;font-weight:800;margin-top:5px;white-space:normal}.u154-status.active ha-icon,.u154-status.active strong{color:var(--primary-color)}.u154-metrics + .u154-band .u154-status:first-child.active ha-icon,.u154-metrics + .u154-band .u154-status:first-child.active strong{color:var(--mode-accent)}
      .u154-band-secondary{min-height:84px}
      .u154-note{display:flex;align-items:center;gap:12px;margin:0 14px 24px;border:1px solid var(--divider-color);border-radius:18px;background:rgba(0,169,214,.08);padding:12px 14px;color:var(--secondary-text-color);font-size:11px;line-height:1.3}.u154-note ha-icon{--mdc-icon-size:26px;color:var(--primary-color);flex:0 0 auto}
      @media(max-width:520px){
        .header-title strong{font-size:clamp(15px,4.3vw,22px)!important}.u154-summary-wrap{gap:14px;min-height:calc(100dvh - 208px)}.u154-summary{gap:9px!important}
        .u154-mode{padding-top:0;gap:6px;flex-direction:column}.u154-mode ha-icon{--mdc-icon-size:24px;flex:0 0 24px}.u154-mode strong{white-space:normal;overflow-wrap:anywhere;font-size:clamp(16px,4.5vw,23px)}.u154-mode span{font-size:16px}
        .u154-photo-wrap{height:clamp(64px,calc(100dvh - 625px),252px);border-radius:20px}
        .u154-metric{padding:12px 3px;gap:5px;flex-direction:column;text-align:center}.u154-metric ha-icon{--mdc-icon-size:21px}.u154-metric span{font-size:10px}.u154-metric strong{font-size:24px;margin-top:5px}
        .u154-band{min-height:80px}.u154-status{padding:10px 5px;gap:5px;flex-direction:column;text-align:center}.u154-status ha-icon{--mdc-icon-size:26px}.u154-status span{font-size:10px}.u154-status strong{font-size:16px}.u154-band-secondary{min-height:78px}
        .u154-note{font-size:10px;margin:0 12px 24px;padding:10px 12px}
      }
      @media(max-width:520px) and (max-height:720px){
        .u154-summary{gap:7px!important}
        .u154-metric{padding:7px 3px}.u154-metric strong{font-size:21px}
        .u154-band,.u154-band-secondary{min-height:64px}.u154-status{padding:7px 4px;gap:3px}
        .u154-status ha-icon{--mdc-icon-size:21px}.u154-status strong{font-size:14px;margin-top:3px}
        .u154-photo{object-fit:contain}
      }
    `;
    root.appendChild(style);
  };

  Panel.prototype.__fixNikasUi154=function(){
    const version=this.shadowRoot?.querySelector(".header-title span");
    if(version)version.textContent=`UI v${PATCH_UI_VERSION}`;
    this.__installNikasUi154();
    const fit=()=>{
      const viewport=this.shadowRoot?.querySelector(".viewport");
      const card=this.shadowRoot?.querySelector(".u154-summary");
      const photo=this.shadowRoot?.querySelector(".u154-photo-wrap");
      if(!viewport||!card||!photo)return;
      const chrome=card.offsetHeight-photo.offsetHeight;
      photo.style.height=`${Math.max(80,Math.min(252,viewport.clientHeight-24-chrome))}px`;
      const note=this.shadowRoot.querySelector(".u154-note");
      if(note)note.style.marginTop=`${Math.max(0,viewport.clientHeight-card.offsetHeight-8)}px`;
    };
    fit();
    if(!this.__summaryResize154 && typeof ResizeObserver!=="undefined"){
      this.__summaryResize154=new ResizeObserver(fit);
      const viewport=this.shadowRoot?.querySelector(".viewport");
      if(viewport)this.__summaryResize154.observe(viewport);
    }
  };
  Panel.prototype.render=function(...args){const r=previousRender.apply(this,args);this.__fixNikasUi154();return r;};
  Panel.prototype.patch=function(...args){const r=previousPatch.apply(this,args);this.__fixNikasUi154();return r;};
  Panel.prototype.__nikasUi154Patched=true;
}
