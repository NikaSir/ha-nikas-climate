import "./nikas-climate-entry-131.js?v=1.3.1";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.3.4";
const HOURS = 24;

if (Panel && !Panel.prototype.__nikasUi134Patched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;
  const previousRoomModel = Panel.prototype.roomModel;

  Panel.prototype.isHumidityEntity = function (state) {
    return Boolean(state?.entity_id?.startsWith("sensor.") && (state.attributes?.device_class === "humidity" || state.attributes?.unit_of_measurement === "%"));
  };

  Panel.prototype.resolveRoomHumidityEntity = function (room, climate) {
    if (!this._hass) return null;
    const explicit = `sensor.sensor_th_zb_${room.key === "living" ? "11" : "14"}_humidity`;
    const candidates = Object.values(this._hass.states).filter((s) => this.isHumidityEntity(s));
    if (!Array.isArray(this._entityRegistry) || !climate?.entity_id) return this._hass.states[explicit] ? explicit : null;
    const climateReg = this.registryEntry(climate.entity_id);
    const climateLabels = new Set(climateReg?.labels || []);
    const shared = candidates.filter((s) => (this.registryEntry(s.entity_id)?.labels || []).some((label) => climateLabels.has(label)));
    if (shared.length) return (shared.find((s) => s.entity_id === explicit) || shared[0]).entity_id;
    if (climateReg?.area_id) {
      const sameArea = candidates.filter((s) => this.registryEntry(s.entity_id)?.area_id === climateReg.area_id);
      if (sameArea.length) return (sameArea.find((s) => s.entity_id === explicit) || sameArea[0]).entity_id;
    }
    return this._hass.states[explicit] ? explicit : null;
  };

  Panel.prototype.roomModel = function (room) {
    const m = previousRoomModel.call(this, room);
    const humidityEntity = this.resolveRoomHumidityEntity(room, m.climate);
    const state = humidityEntity ? this._hass?.states?.[humidityEntity] : null;
    const raw = Number(state?.state);
    return {...m, humidityEntity, humidity: Number.isFinite(raw) ? raw : null};
  };

  Panel.prototype.peerStateIcon = function (m) {
    return !m?.available ? "mdi:lan-disconnect" : this.modeIcon(m.mode);
  };

  Panel.prototype.summary = function (m) {
    const night = this.boolLabel(m.features?.night);
    const turbo = this.boolLabel(m.features?.turbo);
    const delta = m.roomTemp != null && m.indoor != null ? m.indoor - m.roomTemp : null;
    const deltaText = delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} °C`;
    const modes = [["off","Выкл.","mdi:power"],["cool","Холод","mdi:snowflake"],["heat","Тепло","mdi:fire"],["auto","Авто","mdi:autorenew"],["dry","Сушка","mdi:water-percent"],["fan_only","Вент.","mdi:fan"]];
    const mode = ([v,label,icon]) => `<div class="s134-mode ${m.mode===v?"active":""}"><ha-icon icon="${icon}"></ha-icon><strong>${label}</strong><span><i></i>${m.mode===v?"Активен":""}</span></div>`;
    const extra = (icon,title,value,active=false) => `<div class="s134-extra ${active?"active":""}"><ha-icon icon="${icon}"></ha-icon><div><strong>${title}</strong><span><i></i>${value}</span></div></div>`;
    return `<style>
      .s134{height:100%;min-height:0;margin:0!important;padding:12px 14px!important;overflow:hidden;display:flex;flex-direction:column;gap:8px}
      .s134-top{display:grid;grid-template-columns:minmax(0,1fr) minmax(168px,35%);gap:10px;align-items:center;height:150px;min-height:150px}.s134-photo{height:150px;display:flex;align-items:center;justify-content:center;overflow:hidden}.s134-photo img{width:100%;height:100%;object-fit:contain}.s134 .connection-indicator{min-height:64px}
      .s134-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.s134-metric{min-height:96px;border:1px solid color-mix(in srgb,var(--primary-color) 22%,var(--divider-color));border-radius:18px;background:color-mix(in srgb,var(--primary-color) 5%,var(--card-background-color));padding:9px 7px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center}.s134-metric ha-icon{--mdc-icon-size:24px;color:var(--primary-color)}.s134-metric span{font-size:11px;color:var(--secondary-text-color);margin-top:2px}.s134-metric strong{font-size:28px;line-height:1.05;margin-top:5px}.s134-metric small{font-size:10.5px;color:var(--secondary-text-color);margin-top:4px}.s134-metric.fan strong{font-size:16px}
      .s134-title{font-size:12px;font-weight:800;color:var(--secondary-text-color);text-transform:uppercase;letter-spacing:.05em;margin-top:1px}.s134-modes{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px}.s134-mode{min-height:74px;border:1px solid color-mix(in srgb,var(--divider-color) 72%,transparent);border-radius:16px;padding:6px 3px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px}.s134-mode ha-icon{--mdc-icon-size:25px}.s134-mode strong{font-size:11.5px}.s134-mode span{min-height:13px;display:flex;align-items:center;gap:4px;font-size:9px;color:var(--secondary-text-color)}.s134-mode i,.s134-extra i{width:7px;height:7px;border-radius:50%;background:var(--disabled-text-color);display:inline-block}.s134-mode.active{color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 10%,var(--card-background-color));border-color:color-mix(in srgb,var(--primary-color) 55%,var(--divider-color))}.s134-mode.active i{background:var(--primary-color)}
      .s134-extras{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.s134-extra{min-height:72px;border:1px solid color-mix(in srgb,var(--divider-color) 72%,transparent);border-radius:16px;padding:7px;display:flex;align-items:center;justify-content:center;gap:7px}.s134-extra ha-icon{--mdc-icon-size:27px}.s134-extra strong{display:block;font-size:11.5px}.s134-extra span{display:flex;align-items:center;gap:4px;margin-top:4px;font-size:10px;color:var(--secondary-text-color)}.s134-extra.active{color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 9%,var(--card-background-color));border-color:color-mix(in srgb,var(--primary-color) 50%,var(--divider-color))}.s134-extra.active i{background:var(--primary-color)}
      @media(max-width:480px){.s134-top{height:136px;min-height:136px;grid-template-columns:minmax(0,1fr) minmax(150px,36%)}.s134-photo{height:136px}.s134-metric{min-height:90px}.s134-metric strong{font-size:25px}}
    </style><section class="card hero s134">
      <div class="s134-top"><div class="s134-photo"><img src="/nikas_climate_panel/assets/ballu-lagoon.svg" alt="Ballu Lagoon"/></div>${this.connectionPlaque(m)}</div>
      <div class="s134-metrics"><div class="s134-metric"><ha-icon icon="mdi:thermometer"></ha-icon><span>Температура</span><strong>${this.fmt(m.roomTemp,1)}°</strong><small>В помещении</small></div><div class="s134-metric"><ha-icon icon="mdi:water-outline"></ha-icon><span>Влажность</span><strong>${this.fmt(m.humidity,0)}%</strong><small>В помещении</small></div><div class="s134-metric"><ha-icon icon="mdi:thermometer-check-outline"></ha-icon><span>Уставка</span><strong>${this.fmt(m.target,0)}°</strong><small>Целевая</small></div><div class="s134-metric fan"><ha-icon icon="${this.fanIcon(m.fan)}"></ha-icon><span>Вентилятор</span><strong>${this.fanLabel(m.fan)}</strong><small>Текущая скорость</small></div></div>
      <div class="s134-title">Режим работы</div><div class="s134-modes">${modes.map(mode).join("")}</div>
      <div class="s134-title">Дополнительно</div><div class="s134-extras">${extra("mdi:weather-night","Ночной",night,m.features?.night==="on")}${extra("mdi:rocket-launch-outline","Турбо",turbo,m.features?.turbo==="on")}${extra(this.flapIcon(m.swing),"Створка",this.flapLabel(m.swing),m.swing!=="off"&&m.swing!=="—")}${extra("mdi:thermometer-lines","Δ датчиков",deltaText)}</div>
    </section>`;
  };

  Panel.prototype.control = function (m) {
    if (!m.climate) return `<section class="card"><div class="section-title">Управление</div><p class="notice">Climate-сущность выбранного кондиционера не найдена.</p></section>`;
    const d=this.draftFor(m); d.dirty=d.dirty||this.draftChanged(m,d);
    const modes=[["off","Выкл.","mdi:power"],["cool","Холод","mdi:snowflake"],["heat","Тепло","mdi:fire"],["auto","Авто","mdi:autorenew"],["dry","Сушка","mdi:water-percent"],["fan_only","Вент.","mdi:fan"]];
    const fans=[["auto","Авто","mdi:fan-auto"],["low","Низкая","mdi:fan-speed-1"],["medium","Средняя","mdi:fan-speed-2"],["high","Высокая","mdi:fan-speed-3"]];
    const changed=m.target!=null&&Number(d.target)!==Number(m.target);
    const action=(cur,target,attr,v,icon,label)=>`<button class="c134-action ${cur===v?"current":""} ${target===v&&target!==cur?"target":""}" data-${attr}="${v}" ${d.applying?"disabled":""}><ha-icon icon="${icon}"></ha-icon><span>${label}</span></button>`;
    const swingKnown=d.swing&&!['—','unknown','unavailable'].includes(d.swing);
    const flapCurrent=this.flapLabel(m.swing), flapTarget=this.flapLabel(d.swing);
    const feature=(key,icon,title)=>m.features?.[key]==null?"":`<button class="c134-feature ${m.features[key]!==d[key]?"target":(d[key]==="on"?"current":"")}" data-feature="${key}" ${d.applying?"disabled":""}><ha-icon icon="${icon}"></ha-icon><span>${title}</span><strong>${this.boolLabel(d[key])}</strong></button>`;
    return `<style>
      .c134{height:100%;min-height:0;margin:0!important;padding:9px 13px 10px!important;overflow:hidden;display:flex;flex-direction:column}.c134-head{height:30px}.c134-head .room-title{font-size:24px}.c134-visual{height:116px;display:grid;grid-template-columns:minmax(0,1.45fr) minmax(185px,.8fr);gap:10px;align-items:center}.c134-photo{height:116px;display:flex;align-items:center;justify-content:center;overflow:hidden}.c134-photo img{width:100%;height:100%;object-fit:contain}.c134-roomtemp{height:94px;border:1px solid color-mix(in srgb,var(--primary-color) 22%,var(--divider-color));border-radius:18px;background:color-mix(in srgb,var(--primary-color) 5%,var(--card-background-color));padding:9px 12px;display:flex;flex-direction:column;justify-content:center}.c134-roomtemp span{text-transform:uppercase;font-size:10px;font-weight:800;color:var(--secondary-text-color)}.c134-roomtemp strong{font-size:38px;line-height:1.05}.c134-roomtemp small{font-size:10px;color:var(--secondary-text-color)}
      .c134-setrow{display:grid;grid-template-columns:minmax(0,1fr) 92px;gap:10px;margin-top:6px}.c134-set{height:64px;border:1px solid color-mix(in srgb,var(--primary-color) 55%,var(--divider-color));border-radius:18px;background:color-mix(in srgb,var(--primary-color) 10%,var(--card-background-color));display:grid;grid-template-columns:58px 1fr 58px;overflow:hidden;color:var(--primary-color)}.c134-set.target{color:var(--success-color,#43a047);border-color:color-mix(in srgb,var(--success-color,#43a047) 55%,var(--divider-color));background:color-mix(in srgb,var(--success-color,#43a047) 12%,var(--card-background-color))}.c134-set button{border:0;background:transparent;color:inherit;font-size:25px;font-weight:800}.c134-set button:first-child{border-right:1px solid color-mix(in srgb,var(--primary-color) 18%,transparent)}.c134-set button:last-child{border-left:1px solid color-mix(in srgb,var(--primary-color) 18%,transparent)}.c134-set div{display:flex;flex-direction:column;align-items:center;justify-content:center}.c134-set strong{font-size:38px;line-height:.95}.c134-set span{font-size:10px;font-weight:700}.c134-flap{height:64px;border-radius:18px;border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);background:var(--card-background-color);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px}.c134-flap ha-icon{--mdc-icon-size:24px}.c134-flap span{font-size:11px;font-weight:750}.c134-flap strong{font-size:9.5px;color:var(--secondary-text-color)}.c134-flap.current{color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 10%,var(--card-background-color));border-color:color-mix(in srgb,var(--primary-color) 55%,var(--divider-color))}.c134-flap.target{color:var(--success-color,#43a047);background:color-mix(in srgb,var(--success-color,#43a047) 12%,var(--card-background-color));border-color:color-mix(in srgb,var(--success-color,#43a047) 55%,var(--divider-color))}.c134-flap:disabled{color:var(--disabled-text-color);background:var(--secondary-background-color)}
      .c134-section{margin-top:7px}.c134-label{font-size:11.5px;font-weight:800;color:var(--secondary-text-color);text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px}.c134-modes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.c134-fans{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.c134-action{height:68px;border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);border-radius:17px;background:var(--card-background-color);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:11.5px;font-weight:750}.c134-action ha-icon{--mdc-icon-size:27px}.c134-action.current,.c134-feature.current{color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 10%,var(--card-background-color));border-color:color-mix(in srgb,var(--primary-color) 55%,var(--divider-color))}.c134-action.target,.c134-feature.target{color:var(--success-color,#43a047);background:color-mix(in srgb,var(--success-color,#43a047) 12%,var(--card-background-color));border-color:color-mix(in srgb,var(--success-color,#43a047) 55%,var(--divider-color))}.c134-features{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.c134-feature{height:62px;border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);border-radius:17px;background:var(--card-background-color);display:grid;grid-template-columns:auto auto;grid-template-rows:auto auto;column-gap:8px;align-content:center;justify-content:center}.c134-feature ha-icon{grid-row:1/3;--mdc-icon-size:29px;align-self:center}.c134-feature span{font-size:11.5px;font-weight:750}.c134-feature strong{font-size:10.5px}.c134-bottom{margin-top:auto}.c134 .legend{margin-top:7px}.c134 .apply{margin-top:7px;min-height:50px}
      @media(max-width:480px){.c134-visual{grid-template-columns:minmax(0,1.4fr) minmax(160px,.8fr)}.c134-roomtemp strong{font-size:34px}.c134-action{height:65px}.c134-feature{height:58px}}
    </style><section class="card control-card c134">
      <div class="c134-head"><div class="room-title">${m.room.title}</div></div>
      <div class="c134-visual"><div class="c134-photo"><img src="/nikas_climate_panel/assets/ballu-lagoon.svg" alt="Ballu Lagoon"/></div><div class="c134-roomtemp"><span>Температура помещения</span><strong>${this.fmt(m.roomTemp,1)}°</strong><small>Контрольный датчик помещения</small></div></div>
      <div class="c134-setrow"><div class="c134-set ${changed?"target":""}"><button data-delta="-1" ${d.applying?"disabled":""}>−</button><div><strong>${this.fmt(d.target,0)}°</strong><span>Сейчас ${this.fmt(m.target,0)}°</span></div><button data-delta="1" ${d.applying?"disabled":""}>+</button></div><button class="c134-flap ${!swingKnown?"":(flapCurrent===flapTarget?"current":"target")}" data-flap ${(!swingKnown||d.applying)?"disabled":""}><ha-icon icon="${this.flapIcon(d.swing)}"></ha-icon><span>Створка</span><strong>${swingKnown?flapTarget:"н/д"}</strong></button></div>
      <div class="c134-section"><div class="c134-label">Режим работы</div><div class="c134-modes">${modes.map(([v,t,i])=>action(m.mode,d.mode,"mode",v,i,t)).join("")}</div></div>
      <div class="c134-section"><div class="c134-label">Вентилятор</div><div class="c134-fans">${fans.map(([v,t,i])=>action(m.fan,d.fan,"fan",v,i,t)).join("")}</div></div>
      ${(m.features?.night!=null||m.features?.turbo!=null)?`<div class="c134-section"><div class="c134-label">Дополнительно</div><div class="c134-features">${feature("night","mdi:weather-night","Ночной")}${feature("turbo","mdi:rocket-launch-outline","Турбо")}</div></div>`:""}
      <div class="c134-bottom"><div class="legend"><span><i class="current-dot"></i>Текущее</span><span><i class="target-dot"></i>Целевое</span></div><button class="apply" data-apply ${(!d.dirty||d.applying)?"disabled":""}>${d.applying?"Применяется…":"Применить"}</button>${d.error?`<p class="notice error">${d.error}</p>`:""}</div>
    </section>`;
  };

  Panel.prototype.ensureHistory = async function (m, force=false) {
    if(!m?.roomTempEntity||!m?.climate?.entity_id||!this._hass?.callApi)return;
    const key=m.room.key; if(this._historyLoading[key]||(!force&&this._history[key]))return; this._historyLoading[key]=true;
    try { const end=new Date(), start=new Date(end.getTime()-HOURS*3600000); const ids=[m.roomTempEntity,m.climate.entity_id,m.humidityEntity].filter(Boolean); const filter=encodeURIComponent(ids.join(",")); const path=`history/period/${encodeURIComponent(start.toISOString())}?end_time=${encodeURIComponent(end.toISOString())}&filter_entity_id=${filter}&minimal_response=false&no_attributes=false`; const raw=await this._hass.callApi("GET",path); this._history[key]=this.parseHistory(raw,m); }
    catch(_err){this._history[key]={room:[],target:[],humidity:[]};} finally{this._historyLoading[key]=false;if(this._rendered&&this._selected===key&&this._tab==="statistics")this.patch();}
  };

  Panel.prototype.parseHistory = function(raw,m){const groups=Array.isArray(raw)?raw:[],room=[],target=[],humidity=[];for(const group of groups){for(const item of(Array.isArray(group)?group:[])){const ts=Date.parse(item.last_changed||item.last_updated);if(!Number.isFinite(ts))continue;if(item.entity_id===m.roomTempEntity){const v=Number(item.state);if(Number.isFinite(v))room.push([ts,v]);}else if(item.entity_id===m.climate?.entity_id){const v=Number(item.attributes?.temperature);if(Number.isFinite(v))target.push([ts,v]);}else if(item.entity_id===m.humidityEntity){const v=Number(item.state);if(Number.isFinite(v))humidity.push([ts,v]);}}}return{room,target,humidity};};
  Panel.prototype.statsChart=function(title,current,series,target=null){const all=[...(series||[]),...(target||[])];if(!all.length)return`<div class="chart-card"><div class="chart-head"><strong>${title}</strong><small>${current}</small></div><div class="chart-empty">История пока недоступна</div></div>`;const minT=Math.min(...all.map(p=>p[0])),maxT=Math.max(...all.map(p=>p[0]));let minV=Math.min(...all.map(p=>p[1])),maxV=Math.max(...all.map(p=>p[1]));const pad=Math.max(1,(maxV-minV)*.12);minV-=pad;maxV+=pad;const path=a=>a.map(([t,v],i)=>`${i?"L":"M"}${this.scale(t,minT,maxT,4,96).toFixed(1)},${this.scale(v,minV,maxV,82,8).toFixed(1)}`).join(" ");return`<div class="chart-card"><div class="chart-head"><strong>${title}</strong><small>${current}</small></div><div class="chart-wrap"><svg viewBox="0 0 100 90" preserveAspectRatio="none"><line class="chart-grid" x1="4" y1="8" x2="96" y2="8"/><line class="chart-grid" x1="4" y1="45" x2="96" y2="45"/><line class="chart-grid" x1="4" y1="82" x2="96" y2="82"/><path class="chart-room" d="${path(series)}"/>${target?.length?`<path class="chart-target" d="${path(target)}"/>`:""}</svg></div></div>`;};
  Panel.prototype.statistics=function(m){const data=this._history[m.room.key],loading=this._historyLoading[m.room.key];if(!data&&!loading)queueMicrotask(()=>this.ensureHistory(m));return`<section class="card"><div class="section-title">Статистика</div><div class="row"><span>Температура</span><strong>${this.fmt(m.roomTemp,1)} °C</strong></div><div class="row"><span>Влажность</span><strong>${this.fmt(m.humidity,0)} %</strong></div>${loading&&!data?`<div class="chart-card"><div class="chart-empty">Получаем историю Recorder…</div></div>`:this.statsChart("Температура · 24 ч",`Сейчас ${this.fmt(m.roomTemp,1)}° · Уставка ${this.fmt(m.target,0)}°`,data?.room||[],data?.target||[])}${this.statsChart("Влажность · 24 ч",`Сейчас ${this.fmt(m.humidity,0)} %`,data?.humidity||[])}</section>`;};

  Panel.prototype.render = function (...args) { const result=previousRender.apply(this,args); const v=this.shadowRoot?.querySelector(".header-title span"); if(v)v.textContent=`UI v${PATCH_UI_VERSION}`; return result; };
  Panel.prototype.patch = function (...args) { const result=previousPatch.apply(this,args); const root=this.shadowRoot; const v=root?.querySelector(".header-title span"); if(v)v.textContent=`UI v${PATCH_UI_VERSION}`; const models=[{key:"living",title:"Зал"},{key:"veranda",title:"Веранда"}].map(r=>this.roomModel(r)); root?.querySelectorAll(".peer").forEach((b)=>{const m=models.find(x=>x.room.key===b.dataset.room);if(!m)return;let icon=b.querySelector(".peer-state-icon");if(!icon){icon=document.createElement("ha-icon");icon.className="peer-state-icon";b.insertBefore(icon,b.querySelector("span"));}icon.setAttribute("icon",this.peerStateIcon(m));icon.style.setProperty("--mdc-icon-size","18px");icon.style.color=b.classList.contains("active")?"var(--primary-color)":"var(--primary-text-color)";}); return result; };
  Panel.prototype.__nikasUi134Patched = true;
}
