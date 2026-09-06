import "./nikas-climate-entry-146.js?v=1.4.6";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.4.7";
const MODE_META_147 = {
  off:["Выключен","mdi:power"], cool:["Охлаждение","mdi:snowflake"], heat:["Обогрев","mdi:fire"],
  auto:["Авто","mdi:autorenew"], dry:["Осушение","mdi:water-percent"], fan_only:["Вентиляция","mdi:fan"],
  unavailable:["Нет данных","mdi:lan-disconnect"]
};
const esc147=(v)=>String(v??"—").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

if (Panel && !Panel.prototype.__nikasUi147Patched) {
  const previousRender=Panel.prototype.render;
  const previousPatch=Panel.prototype.patch;

  Panel.prototype.summary=function(m){
    const mode=MODE_META_147[m?.mode]||MODE_META_147.unavailable;
    const fan=this.fanLabel(m?.fan);
    const flap=this.flapLabel(m?.swing);
    const nightOn=m?.features?.night==="on";
    const turboOn=m?.features?.turbo==="on";
    const submode=turboOn?"Турбо":(nightOn?"Ночной режим":"");
    const delta=(m?.roomTemp!=null&&m?.indoor!=null)?Number(m.indoor)-Number(m.roomTemp):null;
    const deltaText=Number.isFinite(delta)?`${delta>0?"+":""}${delta.toFixed(1)} °C`:"—";
    const stateClass=`mode-${m?.mode||"unavailable"}`;
    const metric=(icon,title,value,sub)=>`<div class="u147-metric"><ha-icon icon="${icon}"></ha-icon><div><span>${title}</span><strong>${value}</strong><small>${sub}</small></div></div>`;
    const status=(icon,title,value,sub="",active=false)=>`<div class="u147-status ${active?"active":""}"><ha-icon icon="${icon}"></ha-icon><div><span>${title}</span><strong>${value}</strong>${sub?`<small>${sub}</small>`:""}</div></div>`;

    return `<section class="card u147-summary ${stateClass}">
      <div class="u147-hero">
        <div class="u147-headline">
          <div class="u147-mode"><ha-icon icon="${mode[1]}"></ha-icon><div><strong>${esc147(mode[0])}</strong>${submode?`<span>${esc147(submode)}</span>`:""}</div></div>
          ${this.connectionPlaque(m)}
        </div>
        <div class="u147-photo-wrap"><img class="u147-photo" src="/nikas_climate_panel/assets/ballu-lagoon.svg" alt="Ballu Lagoon"/></div>
      </div>

      <div class="u147-metrics">
        ${metric("mdi:thermometer","Температура помещения",`${this.fmt(m?.roomTemp,1)}°`,"Комнатный датчик")}
        ${metric("mdi:water-outline","Влажность",`${this.fmt(m?.humidity,0)}%`,"Комнатный датчик")}
        ${metric("mdi:thermometer-check-outline","Уставка",`${this.fmt(m?.target,0)}°`,"Целевая температура")}
        ${metric("mdi:air-conditioner","У кондиционера",`${this.fmt(m?.indoor,1)}°`,"Датчик внутреннего блока")}
      </div>

      <div class="u147-band">
        ${status(mode[1],"Режим",esc147(mode[0]),m?.mode==="off"?"Не работает":"Работает")}
        ${status(this.fanIcon(m?.fan),"Вентилятор",esc147(fan),"Текущая скорость")}
        ${status("mdi:blinds-horizontal","Створка",esc147(flap),m?.swing==="off"?"Качание выключено":"Качание включено")}
      </div>
      <div class="u147-band">
        ${status("mdi:weather-night","Ночной",nightOn?"Вкл.":"Выкл.","",nightOn)}
        ${status("mdi:rocket-launch-outline","Турбо",turboOn?"Вкл.":"Выкл.","",turboOn)}
        ${status("mdi:thermometer-lines","Δ датчиков",deltaText)}
      </div>

      <div class="u147-note"><ha-icon icon="mdi:information-outline"></ha-icon><span>Фактическая температура берётся только с выбранного комнатного датчика; уставка не используется как измерение.</span></div>
    </section>`;
  };

  Panel.prototype.__installNikasUi147=function(){
    const root=this.shadowRoot;
    if(!root||root.querySelector("style[data-nikas-ui147]"))return;
    const style=document.createElement("style");
    style.dataset.nikasUi147="1";
    style.textContent=`
      .u147-summary{height:100%;min-height:0;overflow:hidden;box-sizing:border-box;display:flex;flex-direction:column;gap:9px;padding:12px 14px!important;margin:0!important}
      .u147-hero{position:relative;height:350px;min-height:350px;border-radius:24px;overflow:hidden;background:#f7fafb}
      .u147-headline{position:absolute;z-index:5;left:18px;right:18px;top:16px;display:grid;grid-template-columns:minmax(0,1fr) 174px;gap:12px;align-items:start}
      .u147-mode{display:flex;gap:10px;align-items:flex-start;min-width:0;padding-top:3px}.u147-mode ha-icon{--mdc-icon-size:38px;color:var(--primary-color);margin-top:1px}.u147-mode>div{min-width:0;display:flex;flex-direction:column}.u147-mode strong{font-size:31px;line-height:1;font-weight:800;color:var(--primary-color);white-space:nowrap}.u147-mode span{font-size:19px;line-height:1.1;font-weight:700;margin-top:6px;color:var(--primary-text-color)}
      .u147-headline .connection-plaque,.u147-headline .conn-plaque,.u147-headline [class*="connection"]{justify-self:end}
      .u147-photo-wrap{position:absolute;left:0;right:0;top:88px;bottom:0;display:flex;align-items:stretch;justify-content:center;overflow:hidden;background:linear-gradient(180deg,#f8fafb,#eef4f6)}
      .u147-photo{width:100%;height:100%;object-fit:cover;object-position:center;display:block;transform:scale(1.02)}
      .u147-summary.mode-off .u147-photo{filter:grayscale(.88) saturate(.35) brightness(1.04);opacity:.72}
      .u147-summary.mode-cool .u147-photo{filter:saturate(1.05)}
      .u147-summary.mode-heat .u147-photo{filter:sepia(.12) saturate(.92) hue-rotate(-12deg)}
      .u147-summary.mode-dry .u147-photo{filter:saturate(.82) contrast(.98)}
      .u147-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--divider-color);border-radius:22px;background:var(--card-background-color);overflow:hidden}
      .u147-metric{min-width:0;display:flex;align-items:center;gap:7px;padding:11px 9px;position:relative}.u147-metric+.u147-metric:before{content:"";position:absolute;left:0;top:12px;bottom:12px;width:1px;background:var(--divider-color)}.u147-metric ha-icon{flex:0 0 auto;color:var(--primary-color);--mdc-icon-size:24px}.u147-metric>div{min-width:0;display:flex;flex-direction:column}.u147-metric span{font-size:12px;line-height:1.1;color:var(--secondary-text-color);white-space:normal}.u147-metric strong{font-size:26px;line-height:1;font-weight:800;margin-top:5px;white-space:nowrap}.u147-metric small{font-size:10px;line-height:1.12;color:var(--secondary-text-color);margin-top:5px;white-space:normal}
      .u147-band{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border:1px solid var(--divider-color);border-radius:22px;background:var(--card-background-color);overflow:hidden}.u147-status{min-width:0;display:flex;align-items:center;gap:10px;padding:12px 13px;position:relative}.u147-status+.u147-status:before{content:"";position:absolute;left:0;top:12px;bottom:12px;width:1px;background:var(--divider-color)}.u147-status ha-icon{flex:0 0 auto;--mdc-icon-size:30px;color:var(--primary-text-color)}.u147-status>div{min-width:0;display:flex;flex-direction:column}.u147-status span{font-size:12px;color:var(--secondary-text-color)}.u147-status strong{font-size:18px;line-height:1.08;font-weight:800;margin-top:3px;white-space:normal;overflow-wrap:anywhere}.u147-status small{font-size:10px;line-height:1.15;color:var(--secondary-text-color);margin-top:4px;white-space:normal}.u147-status.active ha-icon,.u147-status.active strong{color:var(--primary-color)}
      .u147-note{display:flex;align-items:center;gap:12px;border-radius:18px;background:rgba(0,169,214,.08);padding:10px 14px;color:var(--secondary-text-color);font-size:11px;line-height:1.25}.u147-note ha-icon{--mdc-icon-size:26px;color:var(--primary-color);flex:0 0 auto}
      @media(max-width:520px){
        .u147-summary{gap:8px;padding:10px 12px!important}.u147-hero{height:330px;min-height:330px}.u147-headline{left:14px;right:14px;top:14px;grid-template-columns:minmax(0,1fr) 154px}.u147-mode ha-icon{--mdc-icon-size:34px}.u147-mode strong{font-size:28px}.u147-mode span{font-size:17px}.u147-photo-wrap{top:82px}
        .u147-metric{padding:9px 6px;gap:5px}.u147-metric ha-icon{--mdc-icon-size:21px}.u147-metric span{font-size:10px}.u147-metric strong{font-size:22px}.u147-metric small{font-size:9px}
        .u147-status{padding:10px 8px;gap:7px}.u147-status ha-icon{--mdc-icon-size:25px}.u147-status span{font-size:10px}.u147-status strong{font-size:14px}.u147-status small{font-size:9px}.u147-note{font-size:10px;padding:9px 11px}
      }
    `;
    root.appendChild(style);
  };

  Panel.prototype.__fixNikasUi147=function(){
    const version=this.shadowRoot?.querySelector(".header-title span");
    if(version)version.textContent=`UI v${PATCH_UI_VERSION}`;
    this.__installNikasUi147();
  };
  Panel.prototype.render=function(...args){const r=previousRender.apply(this,args);this.__fixNikasUi147();return r;};
  Panel.prototype.patch=function(...args){const r=previousPatch.apply(this,args);this.__fixNikasUi147();return r;};
  Panel.prototype.__nikasUi147Patched=true;
}
