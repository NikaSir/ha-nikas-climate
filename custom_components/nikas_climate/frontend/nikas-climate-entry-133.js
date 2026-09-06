import "./nikas-climate-entry-132.js?v=1.3.2";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.3.3";

if (Panel && !Panel.prototype.__nikasUi133Patched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;

  Panel.prototype.peerStateIcon = function (m) {
    if (!m?.available) return "mdi:lan-disconnect";
    return this.modeIcon(m.mode);
  };

  Panel.prototype.summary = function (m) {
    const delta = m.roomTemp != null && m.indoor != null ? m.indoor - m.roomTemp : null;
    const deltaText = delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} °C`;
    const night = this.boolLabel(m.features?.night);
    const turbo = this.boolLabel(m.features?.turbo);
    const modeTiles = [
      ["off","Выкл.","mdi:power"],
      ["cool","Холод","mdi:snowflake"],
      ["heat","Тепло","mdi:fire"],
      ["auto","Авто","mdi:autorenew"],
      ["dry","Сушка","mdi:water-percent"],
      ["fan_only","Вент.","mdi:fan"]
    ];
    const modeTile = ([value,label,icon]) => `<div class="summary-mode ${m.mode===value?"active":""}"><ha-icon icon="${icon}"></ha-icon><div class="summary-mode-copy"><strong>${label}</strong><span><i></i>${m.mode===value?"Активен":""}</span></div></div>`;
    const extraTile = (icon,title,value,active=false) => `<div class="summary-extra ${active?"active":""}"><ha-icon icon="${icon}"></ha-icon><div><strong>${title}</strong><span><i></i>${value}</span></div></div>`;
    return `<section class="card hero summary-approved-v2">
      <div class="summary-top-v2">
        <div class="ac-visual-v2"><img src="/nikas_climate_panel/assets/ballu-lagoon.svg" alt="Ballu Lagoon"/></div>
        ${this.connectionPlaque(m)}
      </div>
      <div class="summary-metrics-v2">
        <div class="summary-metric"><ha-icon icon="mdi:thermometer"></ha-icon><span>Температура</span><strong>${this.fmt(m.roomTemp,1)}°</strong><small>В помещении</small></div>
        <div class="summary-metric"><ha-icon icon="mdi:water-outline"></ha-icon><span>Влажность</span><strong>${this.fmt(m.humidity,0)}%</strong><small>В помещении</small></div>
        <div class="summary-metric"><ha-icon icon="mdi:thermometer-check-outline"></ha-icon><span>Уставка</span><strong>${this.fmt(m.target,0)}°</strong><small>Целевая</small></div>
        <div class="summary-metric fan"><ha-icon icon="${this.fanIcon(m.fan)}"></ha-icon><span>Вентилятор</span><strong>${this.fanLabel(m.fan)}</strong><small>Текущая скорость</small></div>
      </div>
      <div class="summary-section-title">Режим работы</div>
      <div class="summary-mode-grid">${modeTiles.map(modeTile).join("")}</div>
      <div class="summary-section-title">Дополнительно</div>
      <div class="summary-extra-grid">
        ${extraTile("mdi:weather-night","Ночной",night,m.features?.night==="on")}
        ${extraTile("mdi:rocket-launch-outline","Турбо",turbo,m.features?.turbo==="on")}
        ${extraTile(this.flapIcon(m.swing),"Створка",this.flapLabel(m.swing),m.swing!=="off"&&m.swing!=="—")}
        ${extraTile("mdi:thermometer-lines","Δ датчиков",deltaText,false)}
      </div>
    </section>`;
  };

  Panel.prototype.control = function (m) {
    if (!m.climate) return `<section class="card"><div class="section-title">Управление</div><p class="notice">Climate-сущность выбранного кондиционера не найдена.</p></section>`;
    const d = this.draftFor(m);
    d.dirty = d.dirty || this.draftChanged(m,d);
    const modes = [["off","Выкл.","mdi:power"],["cool","Холод","mdi:snowflake"],["heat","Тепло","mdi:fire"],["auto","Авто","mdi:autorenew"],["dry","Сушка","mdi:water-percent"],["fan_only","Вент.","mdi:fan"]];
    const fans = [["auto","Авто","mdi:fan-auto"],["low","Низкая","mdi:fan-speed-1"],["medium","Средняя","mdi:fan-speed-2"],["high","Высокая","mdi:fan-speed-3"]];
    const tempChanged = m.target != null && Number(d.target) !== Number(m.target);
    const action = (current,target,attr,value,icon,label) => {
      const cls=["action","approved-action"];
      if(current===value) cls.push("current");
      if(target===value&&target!==current) cls.push("target");
      return `<button class="${cls.join(" ")}" data-${attr}="${value}" ${d.applying?"disabled":""}><ha-icon icon="${icon}"></ha-icon><span>${label}</span></button>`;
    };
    const swingKnown = d.swing && !["—","unknown","unavailable"].includes(d.swing);
    const flapCurrent=this.flapLabel(m.swing), flapTarget=this.flapLabel(d.swing);
    const flapClass = !swingKnown ? "disabled-state" : (flapCurrent===flapTarget ? "current" : "target");
    const feature = (key,icon,title) => {
      if(m.features?.[key]==null) return "";
      const changed = m.features[key]!==d[key];
      const cls=["approved-feature"];
      if(changed) cls.push("target"); else if(d[key]==="on") cls.push("current");
      return `<button class="${cls.join(" ")}" data-feature="${key}" ${d.applying?"disabled":""}><ha-icon icon="${icon}"></ha-icon><span class="feature-title">${title}</span><strong>${this.boolLabel(d[key])}</strong></button>`;
    };
    return `<section class="card control-card approved-control">
      <div class="approved-control-head"><div class="room-title">${m.room.title}</div></div>
      <div class="approved-visual-row"><div class="control-ac-visual"><img src="/nikas_climate_panel/assets/ballu-lagoon.svg" alt="Ballu Lagoon"/></div><div class="control-room-temp"><span>Температура помещения</span><strong>${this.fmt(m.roomTemp,1)}°</strong><small>Контрольный датчик помещения</small></div></div>
      <div class="approved-setpoint-row"><div class="approved-setpoint ${tempChanged?"target":"current"}"><button data-delta="-1" ${d.applying?"disabled":""}>−</button><div><strong>${this.fmt(d.target,0)}°</strong><span>Сейчас ${this.fmt(m.target,0)}°</span></div><button data-delta="1" ${d.applying?"disabled":""}>+</button></div><button class="approved-flap ${flapClass}" data-flap ${(!swingKnown||d.applying)?"disabled":""}><ha-icon icon="${this.flapIcon(d.swing)}"></ha-icon><span>Створка</span><strong>${swingKnown?flapTarget:"н/д"}</strong></button></div>
      <div class="control-section approved-section"><div class="control-label">Режим работы</div><div class="modes approved-modes">${modes.map(([v,t,i])=>action(m.mode,d.mode,"mode",v,i,t)).join("")}</div></div>
      <div class="control-section approved-section"><div class="control-label">Вентилятор</div><div class="fan-modes approved-fans">${fans.map(([v,t,i])=>action(m.fan,d.fan,"fan",v,i,t)).join("")}</div></div>
      ${(m.features?.night!=null||m.features?.turbo!=null)?`<div class="control-section approved-section"><div class="control-label">Дополнительно</div><div class="approved-features">${feature("night","mdi:weather-night","Ночной")}${feature("turbo","mdi:rocket-launch-outline","Турбо")}</div></div>`:""}
      <div class="approved-control-bottom"><div class="legend"><span><i class="current-dot"></i>Текущее</span><span><i class="target-dot"></i>Целевое</span></div><button class="apply" data-apply ${(!d.dirty||d.applying)?"disabled":""}>${d.applying?"Применяется…":"Применить"}</button>${d.error?`<p class="notice error">${d.error}</p>`:""}</div>
    </section>`;
  };

  Panel.prototype.render = function (...args) {
    const result = previousRender.apply(this,args);
    const root = this.shadowRoot;
    const version = root?.querySelector(".header-title span");
    if(version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    if(root && !root.querySelector("style[data-nikas-ui133]")) {
      const style=document.createElement("style");
      style.dataset.nikasUi133="1";
      style.textContent=`
        .peer{position:relative}.peer .peer-mode-icon{--mdc-icon-size:18px;margin-left:1px;color:var(--secondary-text-color)}.peer.active .peer-mode-icon{color:var(--primary-color)}
        .summary-approved-v2{margin-bottom:0!important;padding:12px 14px!important;height:100%;min-height:0;overflow:hidden;display:flex;flex-direction:column;gap:8px}.summary-top-v2{display:grid;grid-template-columns:minmax(0,1fr) minmax(142px,34%);gap:10px;align-items:center;min-height:126px}.ac-visual-v2{height:126px;display:flex;align-items:center;justify-content:center;overflow:hidden}.ac-visual-v2 img{width:100%;height:100%;object-fit:contain}.summary-approved-v2 .connection-indicator{min-height:64px}.summary-metrics-v2{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.summary-metric{min-height:92px;border:1px solid color-mix(in srgb,var(--primary-color) 18%,var(--divider-color));border-radius:18px;background:color-mix(in srgb,var(--primary-color) 5%,var(--card-background-color));padding:9px 8px;display:grid;grid-template-columns:auto 1fr;grid-template-areas:"icon label" "value value" "sub sub";column-gap:6px;align-items:center}.summary-metric ha-icon{grid-area:icon;--mdc-icon-size:22px;color:var(--primary-color)}.summary-metric span{grid-area:label;color:var(--secondary-text-color);font-size:11px}.summary-metric strong{grid-area:value;font-size:28px;line-height:1.05;text-align:center}.summary-metric small{grid-area:sub;text-align:center;color:var(--secondary-text-color);font-size:10.5px}.summary-metric.fan strong{font-size:17px}.summary-section-title{font-size:12px;font-weight:800;color:var(--secondary-text-color);text-transform:uppercase;letter-spacing:.05em;margin-top:1px}.summary-mode-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px}.summary-mode{min-height:74px;border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);border-radius:16px;padding:7px 4px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-align:center}.summary-mode ha-icon{--mdc-icon-size:25px}.summary-mode-copy strong{display:block;font-size:11.5px}.summary-mode-copy span{display:flex;align-items:center;justify-content:center;gap:4px;min-height:13px;font-size:9.5px;color:var(--secondary-text-color)}.summary-mode-copy i,.summary-extra span i{width:7px;height:7px;border-radius:50%;background:var(--disabled-text-color);display:inline-block}.summary-mode.active{background:color-mix(in srgb,var(--primary-color) 9%,var(--card-background-color));border-color:color-mix(in srgb,var(--primary-color) 55%,var(--divider-color));color:var(--primary-color)}.summary-mode.active .summary-mode-copy i{background:var(--primary-color)}.summary-extra-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.summary-extra{min-height:72px;border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);border-radius:16px;padding:8px;display:flex;align-items:center;justify-content:center;gap:8px}.summary-extra ha-icon{--mdc-icon-size:27px}.summary-extra strong{display:block;font-size:11.5px}.summary-extra span{margin-top:5px;display:flex;align-items:center;gap:5px;font-size:10px;color:var(--secondary-text-color)}.summary-extra.active{color:var(--primary-color);border-color:color-mix(in srgb,var(--primary-color) 50%,var(--divider-color));background:color-mix(in srgb,var(--primary-color) 8%,var(--card-background-color))}.summary-extra.active span i{background:var(--primary-color)}
        .approved-control{margin-bottom:0!important;padding:10px 13px!important;min-height:100%;display:flex!important;flex-direction:column;overflow:hidden}.approved-control-head{height:32px;display:flex;align-items:flex-start}.approved-control-head .room-title{font-size:24px}.approved-visual-row{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(185px,.8fr);gap:10px;align-items:center;height:116px}.control-ac-visual{height:116px;overflow:hidden}.control-ac-visual img{width:100%;height:100%;object-fit:contain}.control-room-temp{height:94px;border:1px solid color-mix(in srgb,var(--primary-color) 20%,var(--divider-color));border-radius:18px;background:color-mix(in srgb,var(--primary-color) 5%,var(--card-background-color));padding:9px 12px;display:flex;flex-direction:column;justify-content:center}.control-room-temp span{text-transform:uppercase;font-size:10px;font-weight:800;color:var(--secondary-text-color);letter-spacing:.04em}.control-room-temp strong{font-size:38px;line-height:1.05}.control-room-temp small{font-size:10px;color:var(--secondary-text-color)}.approved-setpoint-row{display:grid;grid-template-columns:minmax(0,1fr) 92px;gap:10px;margin-top:7px}.approved-setpoint{height:64px;border-radius:18px;border:1px solid color-mix(in srgb,var(--primary-color) 48%,var(--divider-color));background:color-mix(in srgb,var(--primary-color) 9%,var(--card-background-color));display:grid;grid-template-columns:58px 1fr 58px;overflow:hidden;color:var(--primary-color)}.approved-setpoint>button{border:0;background:transparent;color:inherit;font-size:26px;font-weight:700;border-right:1px solid color-mix(in srgb,var(--primary-color) 18%,transparent)}.approved-setpoint>button:last-child{border-left:1px solid color-mix(in srgb,var(--primary-color) 18%,transparent);border-right:0}.approved-setpoint>div{display:flex;flex-direction:column;align-items:center;justify-content:center}.approved-setpoint strong{font-size:38px;line-height:.95}.approved-setpoint span{font-size:10px;font-weight:700}.approved-setpoint.target{color:var(--success-color,#43a047);border-color:color-mix(in srgb,var(--success-color,#43a047) 55%,var(--divider-color));background:color-mix(in srgb,var(--success-color,#43a047) 12%,var(--card-background-color))}.approved-flap{height:64px;border-radius:18px;border:1px solid color-mix(in srgb,var(--divider-color) 72%,transparent);background:var(--card-background-color);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px}.approved-flap ha-icon{--mdc-icon-size:22px}.approved-flap span{font-size:11px;font-weight:750}.approved-flap strong{font-size:9.5px;color:var(--secondary-text-color)}.approved-flap.current{color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 9%,var(--card-background-color));border-color:color-mix(in srgb,var(--primary-color) 50%,var(--divider-color))}.approved-flap.target{color:var(--success-color,#43a047);background:color-mix(in srgb,var(--success-color,#43a047) 12%,var(--card-background-color));border-color:color-mix(in srgb,var(--success-color,#43a047) 55%,var(--divider-color))}.approved-flap.disabled-state{opacity:.45}.approved-section{margin-top:7px!important}.approved-section .control-label{margin-bottom:5px!important}.approved-modes{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important}.approved-fans{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:6px!important}.approved-action{min-height:62px!important;padding:5px!important;gap:3px!important}.approved-action ha-icon{--mdc-icon-size:25px!important}.approved-features{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.approved-feature{height:62px;border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);border-radius:18px;background:var(--card-background-color);display:grid;grid-template-columns:auto auto;grid-template-rows:1fr 1fr;grid-template-areas:"icon title" "icon state";column-gap:8px;align-items:center;justify-content:center;padding:6px 12px}.approved-feature ha-icon{grid-area:icon;--mdc-icon-size:29px}.approved-feature .feature-title{grid-area:title;font-size:12px;font-weight:750;align-self:end}.approved-feature strong{grid-area:state;font-size:11px;align-self:start}.approved-feature.current{color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 9%,var(--card-background-color));border-color:color-mix(in srgb,var(--primary-color) 50%,var(--divider-color))}.approved-feature.target{color:var(--success-color,#43a047);background:color-mix(in srgb,var(--success-color,#43a047) 12%,var(--card-background-color));border-color:color-mix(in srgb,var(--success-color,#43a047) 55%,var(--divider-color))}.approved-control-bottom{margin-top:auto}.approved-control-bottom .legend{margin-top:7px!important}.approved-control-bottom .apply{min-height:48px!important;height:48px!important;margin-top:7px!important}
        @media(max-width:480px){.summary-top-v2{min-height:104px}.ac-visual-v2{height:104px}.summary-metric{min-height:78px;padding:6px 4px}.summary-metric strong{font-size:22px}.summary-metric span,.summary-metric small{font-size:9px}.summary-mode{min-height:64px}.summary-extra{min-height:62px}.approved-visual-row{height:104px;grid-template-columns:minmax(0,1.35fr) minmax(154px,.85fr)}.control-ac-visual{height:104px}.control-room-temp{height:88px}.control-room-temp strong{font-size:34px}.approved-action{min-height:58px!important}.approved-feature{height:58px}.approved-control-bottom .apply{height:46px!important;min-height:46px!important}}
      `;
      root.appendChild(style);
    }
    return result;
  };

  Panel.prototype.patch = function (...args) {
    const result = previousPatch.apply(this,args);
    const version=this.shadowRoot?.querySelector(".header-title span");
    if(version) version.textContent=`UI v${PATCH_UI_VERSION}`;
    const roomDefs=[
      {key:"living",title:"Зал",area:"11.2 · Гостиная",climateNames:["Кондиционер в зале","Кондей в Гостиной"],explicitRoomTempEntity:"sensor.sensor_th_zb_11_temperature"},
      {key:"veranda",title:"Веранда",area:"14 · Веранда",climateNames:["Кондиционер на веранде","Кондей на Веранде"],explicitRoomTempEntity:"sensor.sensor_th_zb_14_temperature"}
    ];
    const models=this._hass?roomDefs.map(r=>this.roomModel(r)):[];
    const devices=this.shadowRoot?.getElementById("devices");
    if(devices&&models.length){
      devices.innerHTML=models.map(m=>{const h=this.health(m);const active=m.room.key===this._selected;return `<button class="peer ${active?"active":""}" data-room="${m.room.key}"><i class="peer-lamp ${h.tone}"></i><ha-icon class="peer-mode-icon" icon="${this.peerStateIcon(m)}"></ha-icon><span>${m.room.title}</span></button>`;}).join("");
      devices.querySelectorAll(".peer").forEach(b=>b.onclick=()=>{this._selected=b.dataset.room;localStorage.setItem("nikas_climate.peer",this._selected);this.shadowRoot.querySelector(".viewport").scrollTop=0;this.patch();});
    }
    return result;
  };

  Panel.prototype.__nikasUi133Patched=true;
}
