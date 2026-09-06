import "./nikas-climate-entry-129.js?v=1.2.9";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.3.5";

const PEERS = [
  {key:"living", title:"Зал", area:"11.2 · Гостиная", climateNames:["Кондиционер в зале","Кондей в Гостиной"], explicitRoomTempEntity:"sensor.sensor_th_zb_11_temperature", explicitHumidityEntity:"sensor.sensor_th_zb_11_humidity"},
  {key:"veranda", title:"Веранда", area:"14 · Веранда", climateNames:["Кондиционер на веранде","Кондей на Веранде"], explicitRoomTempEntity:"sensor.sensor_th_zb_14_temperature", explicitHumidityEntity:"sensor.sensor_th_zb_14_humidity"}
];

const acVisual = () => `
<svg class="approved-ac-svg" viewBox="0 0 620 220" aria-label="Ballu Lagoon" role="img">
  <defs>
    <linearGradient id="acBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#edf2f5"/></linearGradient>
    <linearGradient id="air" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#69d4ff" stop-opacity=".50"/><stop offset="1" stop-color="#69d4ff" stop-opacity="0"/></linearGradient>
    <filter id="shadow" x="-20%" y="-30%" width="140%" height="180%"><feDropShadow dx="0" dy="7" stdDeviation="8" flood-color="#607d8b" flood-opacity=".22"/></filter>
  </defs>
  <g filter="url(#shadow)">
    <rect x="50" y="30" width="520" height="118" rx="24" fill="url(#acBody)" stroke="#cfd8dc" stroke-width="2"/>
    <path d="M65 118 H555 C550 139 535 151 514 154 H106 C85 151 70 139 65 118Z" fill="#e4eaee" stroke="#c7d0d5" stroke-width="2"/>
    <rect x="82" y="122" width="456" height="24" rx="7" fill="#18252e"/>
    <g stroke="#667984" stroke-width="4" opacity=".85">
      <path d="M120 124V145M158 124V145M196 124V145M234 124V145M272 124V145M310 124V145M348 124V145M386 124V145M424 124V145M462 124V145M500 124V145"/>
    </g>
    <text x="292" y="88" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="700" fill="#4b555b">Ballu</text>
    <text x="510" y="72" text-anchor="end" font-family="Arial,sans-serif" font-size="24" font-weight="700" fill="#1ea7d8">24°</text>
  </g>
  <path d="M126 154 H494 L442 214 H178Z" fill="url(#air)"/>
</svg>`;

if (Panel && !Panel.prototype.__nikasUi135Patched) {
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

  Panel.prototype.decoratePeers = function() {
    const root = this.shadowRoot;
    if (!root) return;
    const buttons = [...root.querySelectorAll(".peer")];
    buttons.forEach((button, index) => {
      button.querySelector(".peer-mode-icon")?.remove();
      const room = PEERS[index];
      if (!room) return;
      const m = this.roomModel(room);
      const icon = document.createElement("ha-icon");
      icon.className = "peer-mode-icon";
      icon.setAttribute("icon", m.available ? this.modeIcon(m.mode) : "mdi:lan-disconnect");
      const lamp = button.querySelector(".lamp");
      if (lamp?.nextSibling) button.insertBefore(icon, lamp.nextSibling); else button.prepend(icon);
    });
  };

  Panel.prototype.summary = function(m) {
    const modes = [["off","Выкл.","mdi:power"],["cool","Холод","mdi:snowflake"],["heat","Тепло","mdi:white-balance-sunny"],["auto","Авто","mdi:autorenew"],["dry","Сушка","mdi:water-percent"],["fan_only","Вент.","mdi:fan"]];
    const modeCard = ([value,label,icon]) => `<div class="a135-mode ${m.mode===value?"active":""}"><ha-icon icon="${icon}"></ha-icon><span><i></i>${label}</span></div>`;
    const extra = (icon,title,value,active=false) => `<div class="a135-extra ${active?"active":""}"><ha-icon icon="${icon}"></ha-icon><div><strong>${title}</strong><span><i></i>${value}</span></div></div>`;
    return `<section class="card a135-summary">
      <div class="a135-top"><div class="a135-ac">${acVisual()}</div>${this.connectionPlaque(m)}</div>
      <div class="a135-metrics">
        <div class="a135-metric"><ha-icon icon="mdi:thermometer"></ha-icon><span>Температура</span><strong>${this.fmt(m.roomTemp,1)}°</strong><small>В помещении</small></div>
        <div class="a135-metric"><ha-icon icon="mdi:water-outline"></ha-icon><span>Влажность</span><strong>${this.fmt(m.humidity,0)}%</strong><small>В помещении</small></div>
        <div class="a135-metric"><ha-icon icon="mdi:thermometer-check-outline"></ha-icon><span>Уставка</span><strong>${this.fmt(m.target,0)}°</strong><small>Целевая</small></div>
        <div class="a135-metric fan"><ha-icon icon="${this.fanIcon(m.fan)}"></ha-icon><span>Вентилятор</span><strong>${this.fanLabel(m.fan)}</strong><small>Текущая скорость</small></div>
      </div>
      <div class="a135-title">Режим работы</div>
      <div class="a135-modes">${modes.map(modeCard).join("")}</div>
      <div class="a135-title">Дополнительно</div>
      <div class="a135-extras">
        ${extra("mdi:weather-night","Ночной",this.boolLabel(m.features?.night),m.features?.night==="on")}
        ${extra("mdi:rocket-launch-outline","Турбо",this.boolLabel(m.features?.turbo),m.features?.turbo==="on")}
        ${extra(this.flapIcon(m.swing),"Створка",this.flapLabel(m.swing),m.swing!=="off"&&m.swing!=="—")}
      </div>
    </section>`;
  };

  Panel.prototype.control = function(m) {
    if (!m.climate) return `<section class="card"><div class="section-title">Управление</div><p class="notice">Climate-сущность выбранного кондиционера не найдена.</p></section>`;
    const d = this.draftFor(m);
    d.dirty = d.dirty || this.draftChanged(m,d);
    const modes = [["off","Выкл.","mdi:power"],["cool","Холод","mdi:snowflake"],["heat","Тепло","mdi:fire"],["auto","Авто","mdi:autorenew"],["dry","Сушка","mdi:water-percent"],["fan_only","Вент.","mdi:fan"]];
    const fans = [["auto","Авто","mdi:fan-auto"],["low","Низкая","mdi:fan-speed-1"],["medium","Средняя","mdi:fan-speed-2"],["high","Высокая","mdi:fan-speed-3"]];
    const action = (cur,target,attr,value,icon,label) => `<button class="a135-action ${cur===value?"current":""} ${target===value&&target!==cur?"target":""}" data-${attr}="${value}" ${d.applying?"disabled":""}><ha-icon icon="${icon}"></ha-icon><span>${label}</span></button>`;
    const feature = (key,icon,title) => m.features?.[key]==null ? "" : `<button class="a135-feature ${m.features[key]!==d[key]?"target":(d[key]==="on"?"current":"")}" data-feature="${key}" ${d.applying?"disabled":""}><span><ha-icon icon="${icon}"></ha-icon><strong>${title}</strong></span><small>${this.boolLabel(d[key])}</small></button>`;
    const tempChanged = m.target != null && Number(d.target)!==Number(m.target);
    const swingKnown = d.swing && !["—","unknown","unavailable"].includes(d.swing);
    const flapCurrent = this.flapLabel(m.swing), flapTarget = this.flapLabel(d.swing);
    const flapClass = !swingKnown ? "disabled-state" : (flapCurrent===flapTarget ? "current" : "target");
    return `<section class="card a135-control">
      <div class="a135-control-head"><div class="a135-ac">${acVisual()}</div><div class="a135-roomtemp"><span>Температура помещения</span><strong>${this.fmt(m.roomTemp,1)}°</strong><small>Контрольный датчик помещения</small></div></div>
      <div class="a135-setrow"><div class="a135-set ${tempChanged?"target":"current"}"><button data-delta="-1" ${d.applying?"disabled":""}>−</button><div><strong>${this.fmt(d.target,0)}°</strong><span>Сейчас ${this.fmt(m.target,0)}°</span></div><button data-delta="1" ${d.applying?"disabled":""}>+</button></div><button class="a135-flap ${flapClass}" data-flap ${(!swingKnown||d.applying)?"disabled":""}><ha-icon icon="${this.flapIcon(d.swing)}"></ha-icon><span>Створка</span><strong>${swingKnown?flapTarget:"н/д"}</strong></button></div>
      <div class="a135-title">Режим работы</div><div class="a135-grid modes">${modes.map(([v,t,i])=>action(m.mode,d.mode,"mode",v,i,t)).join("")}</div>
      <div class="a135-title">Вентилятор</div><div class="a135-grid fans">${fans.map(([v,t,i])=>action(m.fan,d.fan,"fan",v,i,t)).join("")}</div>
      ${(m.features?.night!=null||m.features?.turbo!=null)?`<div class="a135-title">Дополнительно</div><div class="a135-feature-grid">${feature("night","mdi:weather-night","Ночной")}${feature("turbo","mdi:rocket-launch-outline","Турбо")}</div>`:""}
      <div class="a135-bottom"><div class="legend"><span><i class="current-dot"></i>Текущее</span><span><i class="target-dot"></i>Целевое</span></div><button class="apply" data-apply ${(!d.dirty||d.applying)?"disabled":""}>${d.applying?"Применяется…":"Применить"}</button>${d.error?`<p class="notice error">${d.error}</p>`:""}</div>
    </section>`;
  };

  Panel.prototype.ensureRegistries = async function(force=false) {
    const readyBefore = Boolean(this._entityRegistry && this._areaRegistry && this._labelRegistry);
    await previousEnsureRegistries.call(this, force);
    const readyAfter = Boolean(this._entityRegistry && this._areaRegistry && this._labelRegistry);
    if (!readyBefore && readyAfter && this._rendered) this.render();
  };

  Panel.prototype.__installNikasUi135 = function() {
    const root = this.shadowRoot;
    if (!root || root.querySelector("style[data-nikas-ui135]")) return;
    const style = document.createElement("style");
    style.dataset.nikasUi135 = "1";
    style.textContent = `
      .peer-mode-icon{--mdc-icon-size:18px;color:var(--secondary-text-color);margin-left:-2px}.peer.active .peer-mode-icon{color:var(--primary-color)}
      .content:has(.a135-summary),.content:has(.a135-control){height:100%!important;min-height:0!important;padding:8px 12px!important;overflow:hidden!important}.content:has(.a135-summary)>#content,.content:has(.a135-control)>#content{height:100%!important;min-height:0!important}
      .approved-ac-svg{width:100%;height:100%;display:block}.a135-ac{min-width:0;overflow:hidden;display:flex;align-items:center;justify-content:center}
      .a135-summary{height:100%;margin:0!important;padding:12px 14px!important;overflow:hidden;display:flex;flex-direction:column;gap:8px}.a135-top{display:grid;grid-template-columns:minmax(0,1fr) minmax(150px,32%);gap:10px;align-items:center;height:160px}.a135-top .a135-ac{height:160px}.a135-summary .connection-indicator{min-height:66px}
      .a135-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.a135-metric{min-height:92px;border:1px solid color-mix(in srgb,var(--primary-color) 20%,var(--divider-color));border-radius:18px;background:color-mix(in srgb,var(--primary-color) 5%,var(--card-background-color));padding:8px 6px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.a135-metric ha-icon{--mdc-icon-size:23px;color:var(--primary-color)}.a135-metric span{font-size:11px;color:var(--secondary-text-color)}.a135-metric strong{font-size:28px;line-height:1.05;margin-top:4px}.a135-metric small{font-size:10px;color:var(--secondary-text-color);margin-top:4px}.a135-metric.fan strong{font-size:16px}.a135-title{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--secondary-text-color);margin-top:1px}.a135-modes{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px}.a135-mode{height:73px;border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px}.a135-mode ha-icon{--mdc-icon-size:27px}.a135-mode span{font-size:11px;font-weight:750;display:flex;align-items:center;gap:5px}.a135-mode i,.a135-extra i{width:8px;height:8px;border-radius:50%;background:var(--disabled-text-color);display:inline-block}.a135-mode.active{color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 10%,var(--card-background-color));border-color:color-mix(in srgb,var(--primary-color) 55%,var(--divider-color))}.a135-mode.active i{background:var(--primary-color)}.a135-extras{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.a135-extra{height:78px;border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);border-radius:16px;display:flex;align-items:center;justify-content:center;gap:9px}.a135-extra ha-icon{--mdc-icon-size:28px}.a135-extra strong{display:block;font-size:12px}.a135-extra span{display:flex;align-items:center;gap:5px;margin-top:5px;font-size:10px;color:var(--secondary-text-color)}.a135-extra.active{color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 9%,var(--card-background-color));border-color:color-mix(in srgb,var(--primary-color) 50%,var(--divider-color))}.a135-extra.active i{background:var(--primary-color)}
      .a135-control{height:100%;margin:0!important;padding:10px 13px 10px!important;overflow:hidden;display:flex;flex-direction:column}.a135-control-head{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(180px,.8fr);gap:10px;align-items:center;height:124px}.a135-control-head .a135-ac{height:124px}.a135-roomtemp{height:96px;border:1px solid color-mix(in srgb,var(--primary-color) 20%,var(--divider-color));border-radius:18px;background:color-mix(in srgb,var(--primary-color) 5%,var(--card-background-color));padding:10px 12px;display:flex;flex-direction:column;justify-content:center}.a135-roomtemp span{text-transform:uppercase;font-size:10px;font-weight:800;color:var(--secondary-text-color);letter-spacing:.04em}.a135-roomtemp strong{font-size:39px;line-height:1}.a135-roomtemp small{font-size:10px;color:var(--secondary-text-color)}
      .a135-setrow{display:grid;grid-template-columns:minmax(0,1fr) 94px;gap:10px;margin-top:6px}.a135-set{height:64px;border-radius:18px;border:1px solid color-mix(in srgb,var(--primary-color) 50%,var(--divider-color));background:color-mix(in srgb,var(--primary-color) 10%,var(--card-background-color));display:grid;grid-template-columns:58px 1fr 58px;overflow:hidden;color:var(--primary-color)}.a135-set.target{color:var(--success-color,#43a047);border-color:color-mix(in srgb,var(--success-color,#43a047) 55%,var(--divider-color));background:color-mix(in srgb,var(--success-color,#43a047) 12%,var(--card-background-color))}.a135-set button{border:0;background:transparent;color:inherit;font-size:27px;font-weight:800}.a135-set button:first-child{border-right:1px solid color-mix(in srgb,currentColor 18%,transparent)}.a135-set button:last-child{border-left:1px solid color-mix(in srgb,currentColor 18%,transparent)}.a135-set div{display:flex;flex-direction:column;align-items:center;justify-content:center}.a135-set strong{font-size:39px;line-height:.95}.a135-set span{font-size:10px;font-weight:700}.a135-flap{height:64px;border-radius:18px;border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);background:var(--card-background-color);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}.a135-flap ha-icon{--mdc-icon-size:25px}.a135-flap span{font-size:11px;font-weight:750}.a135-flap strong{font-size:9px;color:var(--secondary-text-color)}.a135-flap.current{color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 10%,var(--card-background-color));border-color:color-mix(in srgb,var(--primary-color) 55%,var(--divider-color))}.a135-flap.target{color:var(--success-color,#43a047);background:color-mix(in srgb,var(--success-color,#43a047) 12%,var(--card-background-color));border-color:color-mix(in srgb,var(--success-color,#43a047) 55%,var(--divider-color))}.a135-flap:disabled{color:var(--disabled-text-color);background:var(--secondary-background-color)}
      .a135-grid{display:grid;gap:7px}.a135-grid.modes{grid-template-columns:repeat(3,minmax(0,1fr))}.a135-grid.fans{grid-template-columns:repeat(4,minmax(0,1fr))}.a135-action{height:68px;border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);border-radius:17px;background:var(--card-background-color);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:11.5px;font-weight:750}.a135-action ha-icon{--mdc-icon-size:29px}.a135-action.current,.a135-feature.current{color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 10%,var(--card-background-color));border-color:color-mix(in srgb,var(--primary-color) 55%,var(--divider-color))}.a135-action.target,.a135-feature.target{color:var(--success-color,#43a047);background:color-mix(in srgb,var(--success-color,#43a047) 12%,var(--card-background-color));border-color:color-mix(in srgb,var(--success-color,#43a047) 55%,var(--divider-color))}.a135-feature-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.a135-feature{height:70px;border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);border-radius:17px;background:var(--card-background-color);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px}.a135-feature>span{display:flex;align-items:center;gap:7px}.a135-feature ha-icon{--mdc-icon-size:27px}.a135-feature strong{font-size:13px}.a135-feature small{font-size:12px;font-weight:700}.a135-bottom{margin-top:auto}.a135-bottom .legend{margin:7px 0 8px}.a135-bottom .apply{position:static!important;width:100%!important;height:52px!important;margin:0!important}
      @media(max-width:430px){.a135-top{height:148px;grid-template-columns:minmax(0,1fr) minmax(142px,34%)}.a135-top .a135-ac{height:148px}.a135-control-head{grid-template-columns:minmax(0,1.35fr) minmax(164px,.8fr);height:116px}.a135-control-head .a135-ac{height:116px}.a135-roomtemp{height:90px}.a135-roomtemp strong{font-size:36px}.a135-action{height:65px}.a135-feature{height:66px}}
      @media(max-height:820px){.a135-control-head{height:108px}.a135-control-head .a135-ac{height:108px}.a135-roomtemp{height:84px}.a135-setrow{margin-top:4px}.a135-set,.a135-flap{height:60px}.a135-action{height:61px}.a135-feature{height:60px}.a135-title{margin-top:0}.a135-bottom .apply{height:48px!important}.a135-summary{gap:6px}.a135-top{height:138px}.a135-top .a135-ac{height:138px}.a135-metric{min-height:82px}.a135-mode{height:66px}.a135-extra{height:68px}}
    `;
    root.appendChild(style);
  };

  Panel.prototype.render = function(...args) {
    const result = previousRender.apply(this,args);
    this.__installNikasUi135();
    this.decoratePeers();
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    return result;
  };

  Panel.prototype.patch = function(...args) {
    const result = previousPatch.apply(this,args);
    this.decoratePeers();
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    return result;
  };

  Panel.prototype.__nikasUi135Patched = true;
}
