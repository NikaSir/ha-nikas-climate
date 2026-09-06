import "./nikas-climate-entry-129.js?v=1.2.9";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.3.6";
const AC_IMAGE = "/nikas_climate_panel/assets/ballu-lagoon-approved.png";

const PEERS = [
  {key:"living", title:"Зал", area:"11.2 · Гостиная", climateNames:["Кондиционер в зале","Кондей в Гостиной"], explicitRoomTempEntity:"sensor.sensor_th_zb_11_temperature", explicitHumidityEntity:"sensor.sensor_th_zb_11_humidity"},
  {key:"veranda", title:"Веранда", area:"14 · Веранда", climateNames:["Кондиционер на веранде","Кондей на Веранде"], explicitRoomTempEntity:"sensor.sensor_th_zb_14_temperature", explicitHumidityEntity:"sensor.sensor_th_zb_14_humidity"}
];

if (Panel && !Panel.prototype.__nikasUi136Patched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;
  const previousRoomModel = Panel.prototype.roomModel;
  const previousEnsureRegistries = Panel.prototype.ensureRegistries;

  Panel.prototype.isHumidityEntity = function(state) {
    return Boolean(state?.entity_id?.startsWith("sensor.") && (state.attributes?.device_class === "humidity" || state.attributes?.unit_of_measurement === "%"));
  };

  Panel.prototype.resolveRoomHumidityEntity = function(room, climate) {
    if (!this._hass) return room.explicitHumidityEntity || null;
    const candidates = Object.values(this._hass.states).filter((s) => this.isHumidityEntity(s));
    if (Array.isArray(this._entityRegistry) && climate?.entity_id) {
      const climateReg = this.registryEntry(climate.entity_id);
      const labels = new Set(climateReg?.labels || []);
      const shared = candidates.filter((s) => (this.registryEntry(s.entity_id)?.labels || []).some((l) => labels.has(l)));
      if (shared.length) return (shared.find((s) => s.entity_id === room.explicitHumidityEntity) || shared[0]).entity_id;
      if (climateReg?.area_id) {
        const sameArea = candidates.filter((s) => this.registryEntry(s.entity_id)?.area_id === climateReg.area_id);
        if (sameArea.length) return (sameArea.find((s) => s.entity_id === room.explicitHumidityEntity) || sameArea[0]).entity_id;
      }
    }
    return this._hass.states[room.explicitHumidityEntity] ? room.explicitHumidityEntity : null;
  };

  Panel.prototype.roomModel = function(room) {
    const expanded = PEERS.find((p) => p.key === room.key) || room;
    const m = previousRoomModel.call(this, expanded);
    const humidityEntity = this.resolveRoomHumidityEntity(expanded, m.climate);
    const raw = Number(humidityEntity ? this._hass?.states?.[humidityEntity]?.state : NaN);
    return {...m, room:expanded, humidityEntity, humidity:Number.isFinite(raw)?raw:null};
  };

  Panel.prototype.decoratePeers136 = function() {
    const root = this.shadowRoot;
    if (!root) return;
    [...root.querySelectorAll(".peer")].forEach((button, index) => {
      button.querySelector(".peer-mode-icon")?.remove();
      const room = PEERS[index];
      if (!room) return;
      const m = this.roomModel(room);
      const icon = document.createElement("ha-icon");
      icon.className = "peer-mode-icon";
      icon.setAttribute("icon", m.available ? this.modeIcon(m.mode) : "mdi:lan-disconnect");
      const lamp = button.querySelector(".lamp");
      if (lamp) lamp.insertAdjacentElement("afterend", icon); else button.prepend(icon);
    });
  };

  Panel.prototype.summary = function(m) {
    const modes = [["off","Выкл.","mdi:power"],["cool","Холод","mdi:snowflake"],["heat","Тепло","mdi:white-balance-sunny"],["auto","Авто","mdi:autorenew"],["dry","Сушка","mdi:water-percent"],["fan_only","Вент.","mdi:fan"]];
    const modeCard = ([value,label,icon]) => `<div class="u136-mode ${m.mode===value?"current":""}"><ha-icon icon="${icon}"></ha-icon><span><i></i>${label}</span></div>`;
    const extra = (icon,title,value,active=false,placeholder=false) => `<div class="u136-extra ${active?"current":""} ${placeholder?"placeholder":""}"><ha-icon icon="${icon}"></ha-icon><div><strong>${title}</strong><span><i></i>${value}</span></div></div>`;
    const fanBars = [0,1,2,3].map((n)=>`<i class="${m.fan==="auto" || m.fan==="high" || (m.fan==="medium"&&n<3) || (m.fan==="low"&&n<2) ? "on":""}"></i>`).join("");
    return `<section class="card u136-summary">
      <div class="u136-summary-top"><img class="u136-ac-photo" src="${AC_IMAGE}" alt="Ballu Lagoon">${this.connectionPlaque(m)}</div>
      <div class="u136-metrics">
        <div class="u136-metric"><ha-icon icon="mdi:thermometer"></ha-icon><span>Температура</span><strong>${this.fmt(m.roomTemp,1)}°</strong><small>В помещении</small></div>
        <div class="u136-metric"><ha-icon icon="mdi:water-outline"></ha-icon><span>Влажность</span><strong>${this.fmt(m.humidity,0)}%</strong><small>В помещении</small></div>
        <div class="u136-metric"><ha-icon icon="mdi:thermometer-check-outline"></ha-icon><span>Уставка</span><strong>${this.fmt(m.target,0)}°</strong><small>Целевая</small></div>
        <div class="u136-metric fan"><ha-icon icon="${this.fanIcon(m.fan)}"></ha-icon><span>Вентилятор</span><div class="u136-fanbars">${fanBars}</div><small>${this.fanLabel(m.fan)}</small></div>
      </div>
      <div class="u136-title">Режим работы</div><div class="u136-modes">${modes.map(modeCard).join("")}</div>
      <div class="u136-title">Дополнительно</div><div class="u136-extras">
        ${extra("mdi:weather-night","Ночной",this.boolLabel(m.features?.night),m.features?.night==="on")}
        ${extra("mdi:rocket-launch-outline","Турбо",this.boolLabel(m.features?.turbo),m.features?.turbo==="on")}
        ${extra("mdi:leaf-outline","Эко","—",false,true)}
        ${extra(this.flapIcon(m.swing),"Створка",this.flapLabel(m.swing),m.swing!=="off"&&m.swing!=="—")}
      </div>
      <div class="u136-info"><ha-icon icon="mdi:information-outline"></ha-icon><span>Локальное управление Syncleo UDP / LAN</span></div>
    </section>`;
  };

  Panel.prototype.control = function(m) {
    if (!m.climate) return `<section class="card"><div class="section-title">Управление</div><p class="notice">Climate-сущность выбранного кондиционера не найдена.</p></section>`;
    const d=this.draftFor(m); d.dirty=d.dirty||this.draftChanged(m,d);
    const modes=[["off","Выкл.","mdi:power"],["cool","Холод","mdi:snowflake"],["heat","Тепло","mdi:fire"],["auto","Авто","mdi:autorenew"],["dry","Сушка","mdi:water-percent"],["fan_only","Вент.","mdi:fan"]];
    const fans=[["auto","Авто","mdi:fan-auto"],["low","Низкая","mdi:fan-speed-1"],["medium","Средняя","mdi:fan-speed-2"],["high","Высокая","mdi:fan-speed-3"]];
    const action=(current,target,attr,value,icon,label)=>{const cls=["u136-action"];if(current===value)cls.push("current");if(target===value&&target!==current)cls.push("target");return `<button class="${cls.join(" ")}" data-${attr}="${value}" ${d.applying?"disabled":""}><ha-icon icon="${icon}"></ha-icon><span>${label}</span></button>`;};
    const tempChanged=m.target!=null&&Number(d.target)!==Number(m.target);
    const flapKnown=d.swing&&!["—","unavailable","unknown"].includes(d.swing);
    const flapChanged=d.swing!==m.swing;
    const flapClass=!flapKnown?"unsupported":(flapChanged?"target":"current");
    const feature=(key,icon,title)=>m.features?.[key]==null?"":`<button class="u136-feature ${m.features[key]!==d[key]?"target":(d[key]==="on"?"current":"")}" data-feature="${key}" ${d.applying?"disabled":""}><span><ha-icon icon="${icon}"></ha-icon><strong>${title}</strong></span><small>${this.boolLabel(d[key])}</small></button>`;
    return `<section class="card u136-control">
      <div class="u136-control-head"><div class="u136-room-id"><div class="room-title">${m.room.title}</div></div><div class="u136-visual-row"><img class="u136-ac-photo" src="${AC_IMAGE}" alt="Ballu Lagoon"><div class="u136-roomtemp"><span>Температура помещения</span><strong>${this.fmt(m.roomTemp,1)}°</strong><small>Контрольный датчик помещения</small></div></div></div>
      <div class="u136-setrow"><div class="u136-set ${tempChanged?"target":"current"}"><button data-delta="-1" ${d.applying?"disabled":""}>−</button><div><strong>${this.fmt(d.target,0)}°</strong><span>Сейчас ${this.fmt(m.target,0)}°</span></div><button data-delta="1" ${d.applying?"disabled":""}>+</button></div><button class="u136-flap ${flapClass}" data-flap ${(!flapKnown||d.applying)?"disabled":""}><ha-icon icon="${this.flapIcon(d.swing)}"></ha-icon><span>Створка</span><small>${flapKnown?this.flapLabel(d.swing):"н/д"}</small></button></div>
      <div class="u136-title">Режим работы</div><div class="u136-grid modes">${modes.map(([v,t,i])=>action(m.mode,d.mode,"mode",v,i,t)).join("")}</div>
      <div class="u136-title">Вентилятор</div><div class="u136-grid fans">${fans.map(([v,t,i])=>action(m.fan,d.fan,"fan",v,i,t)).join("")}</div>
      ${(m.features?.night!=null||m.features?.turbo!=null)?`<div class="u136-title">Дополнительно</div><div class="u136-feature-grid">${feature("night","mdi:weather-night","Ночной")}${feature("turbo","mdi:rocket-launch-outline","Турбо")}</div>`:""}
      <div class="u136-bottom"><div class="legend"><span><i class="current-dot"></i>Текущее</span><span><i class="target-dot"></i>Целевое</span></div><button class="apply" data-apply ${(!d.dirty||d.applying)?"disabled":""}>${d.applying?"Применяется…":"Применить"}</button>${d.error?`<p class="notice error">${d.error}</p>`:""}</div>
    </section>`;
  };

  Panel.prototype.ensureRegistries = async function(force=false) {
    const before=Boolean(this._entityRegistry&&this._areaRegistry&&this._labelRegistry);
    await previousEnsureRegistries.call(this,force);
    const after=Boolean(this._entityRegistry&&this._areaRegistry&&this._labelRegistry);
    if(!before&&after&&this._rendered) this.render();
  };

  Panel.prototype.__installNikasUi136 = function() {
    const root=this.shadowRoot;
    if(!root||root.querySelector("style[data-nikas-ui136]")) return;
    const style=document.createElement("style");
    style.dataset.nikasUi136="1";
    style.textContent=`
      .peer-mode-icon{--mdc-icon-size:18px;color:var(--secondary-text-color);margin:0 2px}.peer.active .peer-mode-icon{color:var(--primary-color)}
      .content:has(.u136-summary),.content:has(.u136-control){height:100%!important;min-height:0!important;padding:8px 12px!important;overflow:hidden!important}.content:has(.u136-summary)>#content,.content:has(.u136-control)>#content{height:100%!important;min-height:0!important}
      .u136-ac-photo{display:block;width:100%;height:100%;object-fit:contain;object-position:center;background:transparent}
      .u136-summary,.u136-control{height:100%;margin:0!important;overflow:hidden!important;background:var(--card-background-color)}
      .u136-summary{padding:14px 14px 12px!important;display:flex;flex-direction:column;gap:9px}
      .u136-summary-top{display:grid;grid-template-columns:minmax(0,1fr) 150px;gap:12px;align-items:center;min-height:145px}.u136-summary-top .u136-ac-photo{height:145px}.u136-summary .connection-indicator{width:150px!important;min-width:150px!important;max-width:150px!important;min-height:82px!important;padding:10px!important;border-radius:18px!important;justify-self:end!important}.u136-summary .connection-copy strong{font-size:15px!important}.u136-summary .connection-copy small{font-size:11px!important}
      .u136-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.u136-metric{height:103px;border:1px solid color-mix(in srgb,var(--primary-color) 24%,var(--divider-color));border-radius:17px;background:color-mix(in srgb,var(--primary-color) 5%,var(--card-background-color));padding:7px 5px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.u136-metric ha-icon{--mdc-icon-size:25px;color:var(--primary-color)}.u136-metric span{font-size:11px;color:var(--secondary-text-color);margin-top:3px}.u136-metric strong{font-size:27px;line-height:1.05;margin-top:5px}.u136-metric small{font-size:10px;color:var(--secondary-text-color);margin-top:3px}.u136-metric.fan strong{font-size:21px}.u136-fanbars{height:29px;display:flex;align-items:end;gap:4px;margin-top:4px}.u136-fanbars i{display:block;width:9px;border-radius:2px 2px 0 0;background:color-mix(in srgb,var(--divider-color) 70%,#d4dde2)}.u136-fanbars i:nth-child(1){height:9px}.u136-fanbars i:nth-child(2){height:15px}.u136-fanbars i:nth-child(3){height:21px}.u136-fanbars i:nth-child(4){height:27px}.u136-fanbars i.on{background:var(--primary-color)}
      .u136-title{font-size:12px;font-weight:800;letter-spacing:.02em;text-transform:uppercase;color:var(--secondary-text-color);margin:0}
      .u136-modes{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px}.u136-mode{height:72px;border:1px solid color-mix(in srgb,var(--divider-color) 76%,transparent);border-radius:15px;background:var(--card-background-color);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px}.u136-mode ha-icon{--mdc-icon-size:27px;color:var(--primary-text-color)}.u136-mode span{font-size:11px;font-weight:750;display:flex;align-items:center;gap:4px}.u136-mode span i,.u136-extra span i{width:8px;height:8px;border-radius:50%;background:#c5c8ca}.u136-mode.current{border-color:color-mix(in srgb,var(--primary-color) 58%,var(--divider-color));background:color-mix(in srgb,var(--primary-color) 9%,var(--card-background-color))}.u136-mode.current ha-icon,.u136-mode.current span{color:var(--primary-color)}.u136-mode.current span i{background:var(--primary-color)}
      .u136-extras{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.u136-extra{height:84px;border:1px solid color-mix(in srgb,var(--divider-color) 76%,transparent);border-radius:17px;background:var(--card-background-color);display:flex;align-items:center;justify-content:center;gap:8px;padding:8px}.u136-extra ha-icon{--mdc-icon-size:31px}.u136-extra>div{display:flex;flex-direction:column;gap:4px}.u136-extra strong{font-size:13px}.u136-extra span{font-size:10.5px;color:var(--secondary-text-color);display:flex;align-items:center;gap:5px}.u136-extra.current{border-color:color-mix(in srgb,var(--primary-color) 58%,var(--divider-color));background:color-mix(in srgb,var(--primary-color) 8%,var(--card-background-color))}.u136-extra.current ha-icon,.u136-extra.current strong{color:var(--primary-color)}.u136-extra.current span i{background:var(--primary-color)}.u136-extra.placeholder{opacity:.55}
      .u136-info{height:44px;margin-top:auto;border-radius:15px;background:color-mix(in srgb,var(--primary-color) 7%,var(--card-background-color));display:flex;align-items:center;gap:10px;padding:0 14px;color:var(--secondary-text-color);font-size:12px}.u136-info ha-icon{--mdc-icon-size:24px;color:var(--primary-color)}
      .u136-control{padding:10px 13px 11px!important;display:flex;flex-direction:column;gap:6px}.u136-control-head{flex:0 0 auto}.u136-room-id{height:28px}.u136-room-id .room-title{font-size:23px!important;line-height:1;font-weight:800}.u136-visual-row{display:grid;grid-template-columns:minmax(0,1fr) 180px;gap:10px;align-items:center;height:142px}.u136-visual-row .u136-ac-photo{height:136px}.u136-roomtemp{height:92px;border:1px solid color-mix(in srgb,var(--primary-color) 26%,var(--divider-color));border-radius:18px;background:color-mix(in srgb,var(--primary-color) 5%,var(--card-background-color));padding:10px 12px;display:flex;flex-direction:column;justify-content:center}.u136-roomtemp span{font-size:11px;font-weight:760;text-transform:uppercase;color:var(--secondary-text-color)}.u136-roomtemp strong{font-size:32px;line-height:1.05;margin-top:4px}.u136-roomtemp small{font-size:10px;color:var(--secondary-text-color);margin-top:4px}
      .u136-setrow{display:grid;grid-template-columns:minmax(0,1fr) 92px;gap:9px;height:69px;flex:0 0 auto}.u136-set{display:grid;grid-template-columns:55px minmax(0,1fr) 55px;height:69px;overflow:hidden;border-radius:18px;border:1px solid color-mix(in srgb,var(--primary-color) 48%,var(--divider-color));background:color-mix(in srgb,var(--primary-color) 9%,var(--card-background-color))}.u136-set>button{border:0;background:transparent;color:var(--primary-color);font-size:27px;font-weight:800}.u136-set>button:first-child{border-right:1px solid color-mix(in srgb,var(--primary-color) 18%,transparent)}.u136-set>button:last-child{border-left:1px solid color-mix(in srgb,var(--primary-color) 18%,transparent)}.u136-set>div{display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--primary-color)}.u136-set strong{font-size:42px;line-height:.9}.u136-set span{font-size:11px;font-weight:700;margin-top:4px}.u136-set.target{border-color:color-mix(in srgb,var(--success-color,#43a047) 58%,var(--divider-color));background:color-mix(in srgb,var(--success-color,#43a047) 10%,var(--card-background-color))}.u136-set.target>*{color:var(--success-color,#43a047)!important}.u136-flap{height:69px;border-radius:18px;border:1px solid color-mix(in srgb,var(--primary-color) 48%,var(--divider-color));background:color-mix(in srgb,var(--primary-color) 8%,var(--card-background-color));color:var(--primary-color);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}.u136-flap ha-icon{--mdc-icon-size:27px}.u136-flap span{font-size:11px;font-weight:750}.u136-flap small{font-size:9px}.u136-flap.target{border-color:color-mix(in srgb,var(--success-color,#43a047) 58%,var(--divider-color));background:color-mix(in srgb,var(--success-color,#43a047) 10%,var(--card-background-color));color:var(--success-color,#43a047)}.u136-flap.unsupported{opacity:.46;color:var(--secondary-text-color);background:var(--secondary-background-color)}
      .u136-grid.modes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.u136-grid.fans{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.u136-action{height:69px;border-radius:17px;border:1px solid color-mix(in srgb,var(--divider-color) 76%,transparent);background:var(--card-background-color);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:var(--primary-text-color)}.u136-action ha-icon{--mdc-icon-size:29px}.u136-action span{font-size:12px;font-weight:750}.u136-action.current{border-color:color-mix(in srgb,var(--primary-color) 58%,var(--divider-color));background:color-mix(in srgb,var(--primary-color) 9%,var(--card-background-color));color:var(--primary-color)}.u136-action.target{border-color:color-mix(in srgb,var(--success-color,#43a047) 60%,var(--divider-color));background:color-mix(in srgb,var(--success-color,#43a047) 10%,var(--card-background-color));color:var(--success-color,#43a047)}
      .u136-feature-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.u136-feature{height:70px;border-radius:17px;border:1px solid color-mix(in srgb,var(--divider-color) 76%,transparent);background:var(--card-background-color);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px}.u136-feature>span{display:flex;align-items:center;gap:8px}.u136-feature ha-icon{--mdc-icon-size:27px}.u136-feature strong{font-size:13px}.u136-feature small{font-size:11px;font-weight:700}.u136-feature.current{border-color:color-mix(in srgb,var(--primary-color) 58%,var(--divider-color));background:color-mix(in srgb,var(--primary-color) 9%,var(--card-background-color));color:var(--primary-color)}.u136-feature.target{border-color:color-mix(in srgb,var(--success-color,#43a047) 60%,var(--divider-color));background:color-mix(in srgb,var(--success-color,#43a047) 10%,var(--card-background-color));color:var(--success-color,#43a047)}
      .u136-bottom{margin-top:auto}.u136-bottom .legend{margin:0 0 6px!important}.u136-bottom .apply{width:100%;height:48px!important;min-height:48px!important;margin:0!important;border-radius:18px!important}.u136-bottom .notice.error{margin:5px 0 0!important;font-size:10.5px!important}
      @media(max-height:780px){.u136-visual-row{height:126px}.u136-visual-row .u136-ac-photo{height:120px}.u136-roomtemp{height:84px}.u136-setrow,.u136-set,.u136-flap{height:64px}.u136-action{height:62px}.u136-feature{height:62px}.u136-summary-top{min-height:132px}.u136-summary-top .u136-ac-photo{height:132px}.u136-metric{height:92px}.u136-mode{height:64px}.u136-extra{height:74px}.u136-info{height:40px}}
    `;
    root.appendChild(style);
  };

  Panel.prototype.render = function(...args){
    const result=previousRender.apply(this,args);
    const version=this.shadowRoot?.querySelector(".header-title span"); if(version) version.textContent=`UI v${PATCH_UI_VERSION}`;
    this.__installNikasUi136(); this.decoratePeers136();
    return result;
  };
  Panel.prototype.patch = function(...args){
    const result=previousPatch.apply(this,args);
    const version=this.shadowRoot?.querySelector(".header-title span"); if(version) version.textContent=`UI v${PATCH_UI_VERSION}`;
    this.decoratePeers136();
    return result;
  };
  Panel.prototype.__nikasUi136Patched=true;
}
