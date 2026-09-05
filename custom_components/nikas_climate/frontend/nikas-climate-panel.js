const UI_VERSION = "1.1.0";
const SAFE_RETURN_ROUTE = "/dashboard-house-v13/home";

const ROOMS = [
  {
    key: "living",
    title: "Зал",
    area: "11.2 · Гостиная",
    climateNames: ["Кондиционер в зале", "Кондей в Гостиной"],
    roomTempEntity: "sensor.sensor_th_zb_11_temperature"
  },
  {
    key: "veranda",
    title: "Веранда",
    area: "14 · Веранда",
    climateNames: ["Кондиционер на веранде", "Кондей на Веранде"],
    roomTempEntity: "sensor.sensor_th_zb_14_temperature"
  }
];

class NikasClimatePanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode:"open"});
    this._hass = null;
    this._panel = null;
    this._selected = localStorage.getItem("nikas_climate.peer") || "living";
    this._tab = "summary";
    this._rendered = false;
  }

  set hass(value) {
    this._hass = value;
    if (!this._rendered) {
      this.render();
      this._rendered = true;
    } else {
      this.patch();
    }
  }

  set panel(value) { this._panel = value; }

  findClimate(room) {
    if (!this._hass) return null;
    const all = Object.values(this._hass.states).filter((s) => s.entity_id.startsWith("climate."));
    return all.find((s) => room.climateNames.includes(s.attributes.friendly_name)) ||
      all.find((s) => (s.attributes.friendly_name || "").toLowerCase().includes(room.title.toLowerCase()));
  }

  roomTemp(room) {
    const state = this._hass?.states?.[room.roomTempEntity];
    const value = Number(state?.state);
    return Number.isFinite(value) ? value : null;
  }

  fmt(value, digits=0) {
    return value == null || !Number.isFinite(Number(value)) ? "—" : Number(value).toFixed(digits);
  }

  modeLabel(mode) {
    return ({off:"Выключено",cool:"Охлаждение",heat:"Обогрев",dry:"Осушение",fan_only:"Вентиляция",auto:"Авто"})[mode] || "Нет данных";
  }

  fanLabel(value) {
    return ({auto:"Авто",low:"Низкая",medium:"Средняя",high:"Высокая"})[value] || value || "—";
  }

  swingLabel(value) {
    return ({off:"Выкл.",vertical:"Вертикальные",horizontal:"Горизонтальные",both:"Оба"})[value] || value || "—";
  }

  async call(service, data) {
    if (!this._hass) return;
    if (!window.confirm("Подтвердить действие?")) return;
    const [domain, name] = service.split(".");
    await this._hass.callService(domain, name, data);
  }

  roomModel(room) {
    const climate = this.findClimate(room);
    const roomTemp = this.roomTemp(room);
    const indoorRaw = Number(climate?.attributes?.current_temperature);
    const targetRaw = Number(climate?.attributes?.temperature);
    const available = Boolean(climate && !["unavailable","unknown"].includes(climate.state));
    const roomSensorState = this._hass?.states?.[room.roomTempEntity];
    const roomAvailable = Boolean(roomSensorState && !["unavailable","unknown"].includes(roomSensorState.state));
    return {
      room, climate, roomTemp,
      indoor: Number.isFinite(indoorRaw) ? indoorRaw : null,
      target: Number.isFinite(targetRaw) ? targetRaw : null,
      mode: climate?.state || "unavailable",
      available, roomAvailable,
      fan: climate?.attributes?.fan_mode || "—",
      swing: climate?.attributes?.swing_mode || "—"
    };
  }

  health(m) {
    if (!m.climate || !m.available) return {tone:"bad", label:"Нет связи"};
    if (!m.roomAvailable) return {tone:"warn", label:"Датчик комнаты недоступен"};
    return {tone:"ok", label:"В норме"};
  }

  connection(m) {
    if (!m.climate || !m.available) return {tone:"offline", label:"Нет связи", fresh:"Нет данных", freshTone:"no-data"};
    return {tone:"local", label:"Локально", fresh:"Данные актуальны", freshTone:"current"};
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;inline-size:100%;block-size:100%;min-inline-size:0;min-block-size:0;container-type:inline-size;container-name:nikas-panel;font-family:var(--paper-font-body1_-_font-family,Arial,sans-serif);color:var(--primary-text-color)}
        *{box-sizing:border-box}
        button{font:inherit}
        .shell{position:absolute;inset:0;display:grid;grid-template-rows:calc(60px + env(safe-area-inset-top)) 52px minmax(0,1fr) calc(64px + env(safe-area-inset-bottom));min-inline-size:0;min-block-size:0;background:var(--primary-background-color);overflow:hidden}
        .app-header{display:grid;grid-template-columns:52px minmax(0,1fr) 52px;align-items:end;gap:8px;padding:env(safe-area-inset-top) max(12px,env(safe-area-inset-right)) 0 max(12px,env(safe-area-inset-left));background:color-mix(in srgb,var(--primary-background-color) 97%,transparent);border-bottom:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);backdrop-filter:blur(18px) saturate(130%);-webkit-backdrop-filter:blur(18px) saturate(130%)}
        .header-action{align-self:center;justify-self:center;width:44px;height:44px;border-radius:16px;border:1px solid color-mix(in srgb,var(--divider-color) 72%,transparent);background:var(--card-background-color);color:var(--primary-text-color);box-shadow:0 7px 20px rgba(23,45,76,.08);display:grid;place-items:center}.header-action ha-icon{--mdc-icon-size:25px}.header-action.placeholder{visibility:hidden}
        .header-title{align-self:center;justify-self:center;width:min(360px,100%);height:52px;padding:5px 14px;border-radius:16px;border:1px solid color-mix(in srgb,var(--primary-color,#03a9d9) 24%,var(--divider-color,#dfe3e8));background:color-mix(in srgb,var(--primary-color,#03a9d9) 5%,var(--card-background-color,#fff));box-shadow:0 5px 16px rgba(23,45,76,.06);color:var(--primary-text-color);display:flex;flex-direction:column;justify-content:center;align-items:center}
        .header-title:active{background:color-mix(in srgb,var(--primary-color,#03a9d9) 13%,var(--card-background-color,#fff));border-color:color-mix(in srgb,var(--primary-color,#03a9d9) 42%,var(--divider-color,#dfe3e8));transform:scale(.985)}
        .header-title strong{font-size:23px;font-weight:800;line-height:1.05;white-space:nowrap}.header-title span{margin-top:2px;font-size:14px;font-weight:560;color:var(--secondary-text-color);white-space:nowrap}
        .peer-selector{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:6px 12px;background:var(--primary-background-color);border-bottom:1px solid color-mix(in srgb,var(--divider-color) 64%,transparent)}
        .peer{min-width:0;height:40px;padding:0 14px;border-radius:16px;border:1px solid color-mix(in srgb,var(--divider-color) 72%,transparent);background:var(--card-background-color);color:var(--primary-text-color);display:flex;align-items:center;justify-content:center;gap:9px;font-size:14px;font-weight:750;white-space:nowrap}.peer.active{background:color-mix(in srgb,var(--primary-color) 9%,var(--card-background-color));border-color:color-mix(in srgb,var(--primary-color) 55%,var(--divider-color));color:var(--primary-color)}
        .peer-lamp{width:9px;height:9px;flex:0 0 9px;border-radius:50%;background:var(--disabled-text-color);box-shadow:0 0 0 3px color-mix(in srgb,var(--disabled-text-color) 22%,transparent)}.peer-lamp.ok{background:var(--success-color,#43a047);box-shadow:0 0 0 3px color-mix(in srgb,var(--success-color,#43a047) 20%,transparent)}.peer-lamp.warn{background:var(--warning-color,#f6a623);box-shadow:0 0 0 3px color-mix(in srgb,var(--warning-color,#f6a623) 20%,transparent)}.peer-lamp.bad{background:var(--error-color,#db4437);box-shadow:0 0 0 3px color-mix(in srgb,var(--error-color,#db4437) 20%,transparent)}
        .viewport{min-width:0;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;touch-action:pan-y;background:var(--primary-background-color)}
        .content{width:100%;max-width:1280px;margin:0 auto;padding:12px}
        .card{background:var(--card-background-color);border:1px solid color-mix(in srgb,var(--divider-color) 72%,transparent);border-radius:22px;padding:15px;box-shadow:0 6px 18px rgba(0,0,0,.04);margin-bottom:12px}
        .hero{background:linear-gradient(135deg,var(--card-background-color) 62%,color-mix(in srgb,var(--primary-color) 6%,var(--card-background-color)) 100%)}
        .hero-top{display:grid;grid-template-columns:minmax(0,1fr) minmax(168px,42%);gap:12px;align-items:start}.room-title{font-size:25px;font-weight:800;line-height:1.04;letter-spacing:-.03em}.area{margin-top:5px;color:var(--secondary-text-color);font-size:13px;font-weight:600}
        .connection-indicator{display:grid;grid-template-columns:10px minmax(0,1fr);align-items:center;column-gap:9px;min-height:58px;padding:12px;border-radius:18px;background:var(--card-background-color);border:1px solid color-mix(in srgb,var(--divider-color) 72%,transparent);box-shadow:0 4px 14px rgba(0,0,0,.055);white-space:nowrap}
        .connection-lamp{width:10px;height:10px;border-radius:50%;background:var(--disabled-text-color)}.connection-copy{display:grid;row-gap:4px}.connection-copy strong{font-size:16px;font-weight:700;line-height:1.05}.connection-copy small{font-size:13px;font-weight:600;line-height:1.05;color:var(--secondary-text-color)}.connection-indicator.local{background:color-mix(in srgb,var(--success-color,#43a047) 11%,var(--card-background-color));border-color:color-mix(in srgb,var(--success-color,#43a047) 30%,var(--divider-color))}.connection-indicator.local .connection-lamp{background:var(--success-color,#43a047)}.connection-indicator.local strong{color:var(--success-color,#43a047)}.connection-indicator.offline{background:color-mix(in srgb,var(--error-color,#db4437) 10%,var(--card-background-color));border-color:color-mix(in srgb,var(--error-color,#db4437) 30%,var(--divider-color))}.connection-indicator.offline .connection-lamp{background:var(--error-color,#db4437)}.connection-indicator.offline strong{color:var(--error-color,#db4437)}
        .climate-core{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,.65fr);gap:10px;margin-top:14px}
        .primary-temp{min-height:174px;padding:16px;border-radius:22px;background:color-mix(in srgb,var(--primary-color) 5%,var(--card-background-color));border:1px solid color-mix(in srgb,var(--primary-color) 14%,var(--divider-color));display:flex;flex-direction:column;justify-content:center}.eyebrow{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--secondary-text-color)}.temp-main{margin-top:4px;font-size:58px;font-weight:800;line-height:1;letter-spacing:-.05em}.temp-sub{margin-top:8px;color:var(--secondary-text-color);font-size:13px}
        .metric-stack{display:grid;grid-template-rows:1fr 1fr;gap:10px}.metric{padding:13px;border-radius:19px;background:var(--card-background-color);border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);display:flex;flex-direction:column;justify-content:center}.metric span{font-size:12px;font-weight:700;color:var(--secondary-text-color)}.metric strong{margin-top:5px;font-size:24px;line-height:1}.metric small{margin-top:5px;font-size:12px;color:var(--secondary-text-color)}
        .status-strip{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}.status-item{min-height:72px;padding:10px;border-radius:18px;background:var(--card-background-color);border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);text-align:center;display:flex;flex-direction:column;justify-content:center}.status-item span{font-size:12px;color:var(--secondary-text-color);font-weight:700}.status-item strong{margin-top:5px;font-size:15px;line-height:1.1}
        .control-card .room-title,.section-title{font-size:24px;font-weight:800}.setpoint{display:grid;grid-template-columns:58px minmax(0,1fr) 58px;align-items:center;gap:10px;margin-top:16px}.setpoint button{height:54px;border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);border-radius:18px;background:var(--card-background-color);font-size:26px;color:var(--primary-text-color)}.setpoint .num{text-align:center;font-size:44px;font-weight:800}.modes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:14px}.action{min-height:52px;border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);border-radius:18px;background:var(--card-background-color);color:var(--primary-text-color);font-size:13px;font-weight:750}.action.active{background:color-mix(in srgb,var(--primary-color) 10%,var(--card-background-color));border-color:color-mix(in srgb,var(--primary-color) 52%,var(--divider-color));color:var(--primary-color)}
        .row{display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent)}.row:last-child{border-bottom:0}.row span{color:var(--secondary-text-color)}.row strong{text-align:right}
        .notice{font-size:14px;line-height:1.45;color:var(--secondary-text-color);margin-top:10px}
        .bottom-nav{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));padding:0 max(8px,env(safe-area-inset-right)) env(safe-area-inset-bottom) max(8px,env(safe-area-inset-left));background:color-mix(in srgb,var(--primary-background-color) 97%,transparent);border-top:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);backdrop-filter:blur(18px) saturate(130%)}.bottom-nav button{border:0;background:transparent;color:var(--secondary-text-color);font-size:12px;font-weight:700}.bottom-nav button.active{color:var(--primary-color)}
        @container nikas-panel (min-width:600px){.content{padding-inline:16px}}
        @container nikas-panel (min-width:1024px){.content{padding-inline:24px}}
        @container nikas-panel (max-width:359px){.app-header{grid-template-columns:48px minmax(0,1fr) 48px;padding-inline:8px}.header-title{width:100%;padding-inline:8px}.header-title strong{font-size:21px}.header-title span{font-size:13px}.hero-top{grid-template-columns:1fr}.connection-indicator{width:100%}}
        @media(max-width:480px){.climate-core{grid-template-columns:1fr}.metric-stack{grid-template-columns:1fr 1fr;grid-template-rows:auto}.primary-temp{min-height:136px}.temp-main{font-size:54px}.status-strip{grid-template-columns:repeat(3,1fr)}}
      </style>
      <div class="shell">
        <header class="app-header">
          <button class="header-action" id="menu" type="button" aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
          <button class="header-title" id="back" type="button" aria-label="Вернуться в исходную базовую панель NikaS"><strong>Кондиционирование</strong><span>UI v${UI_VERSION}</span></button>
          <button class="header-action placeholder" type="button" tabindex="-1" aria-hidden="true"></button>
        </header>
        <div class="peer-selector" id="devices"></div>
        <main class="viewport"><div class="content"><section id="content"></section></div></main>
        <nav class="bottom-nav">
          <button data-tab="summary">Сводка</button>
          <button data-tab="control">Управление</button>
          <button data-tab="statistics">Статистика</button>
          <button data-tab="diagnostics">Диагностика</button>
        </nav>
      </div>`;
    this.shadowRoot.getElementById("menu").onclick = () => this.dispatchEvent(new CustomEvent("hass-toggle-menu",{bubbles:true,composed:true}));
    this.shadowRoot.getElementById("back").onclick = () => {
      history.pushState(null,"",SAFE_RETURN_ROUTE);
      window.dispatchEvent(new CustomEvent("location-changed"));
    };
    this.shadowRoot.querySelectorAll(".bottom-nav button").forEach((b) => b.onclick = () => {
      this._tab = b.dataset.tab;
      this.shadowRoot.querySelector(".viewport").scrollTop = 0;
      this.patch();
    });
    this.patch();
  }

  patch() {
    if (!this._hass || !this.shadowRoot) return;
    const models = ROOMS.map((r) => this.roomModel(r));
    const selected = models.find((m) => m.room.key === this._selected) || models[0];

    const devices = this.shadowRoot.getElementById("devices");
    devices.innerHTML = models.map((m) => {
      const h = this.health(m);
      const active = m.room.key === selected.room.key;
      return `<button class="peer ${active?"active":""}" data-room="${m.room.key}" aria-label="${m.room.title}: ${h.label}"><i class="peer-lamp ${h.tone}" title="${h.label}"></i><span>${m.room.title}</span></button>`;
    }).join("");
    devices.querySelectorAll(".peer").forEach((b) => b.onclick = () => {
      this._selected = b.dataset.room;
      localStorage.setItem("nikas_climate.peer",this._selected);
      this.shadowRoot.querySelector(".viewport").scrollTop = 0;
      this.patch();
    });

    this.shadowRoot.querySelectorAll(".bottom-nav button").forEach((b) => b.classList.toggle("active",b.dataset.tab===this._tab));
    const content = this.shadowRoot.getElementById("content");
    content.innerHTML = this._tab === "summary" ? this.summary(selected) :
      this._tab === "control" ? this.control(selected) :
      this._tab === "statistics" ? this.statistics(selected) :
      this.diagnostics(selected);
    this.bindControls(selected);
  }

  connectionPlaque(m) {
    const c = this.connection(m);
    return `<div class="connection-indicator ${c.tone}" role="status" aria-label="${c.label} · ${c.fresh}">
      <i class="connection-lamp"></i>
      <span class="connection-copy"><strong>${c.label}</strong><small class="${c.freshTone}">${c.fresh}</small></span>
    </div>`;
  }

  summary(m) {
    const delta = m.roomTemp != null && m.indoor != null ? m.indoor - m.roomTemp : null;
    const deltaText = delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} °C`;
    return `<section class="card hero">
      <div class="hero-top">
        <div><div class="room-title">${m.room.title}</div><div class="area">${m.room.area}</div></div>
        ${this.connectionPlaque(m)}
      </div>
      <div class="climate-core">
        <div class="primary-temp"><span class="eyebrow">Температура помещения</span><strong class="temp-main">${this.fmt(m.roomTemp,1)}°</strong><small class="temp-sub">Контрольный датчик помещения</small></div>
        <div class="metric-stack">
          <div class="metric"><span>Уставка</span><strong>${this.fmt(m.target,0)} °C</strong><small>Целевая температура</small></div>
          <div class="metric"><span>Внутренний блок</span><strong>${this.fmt(m.indoor,0)} °C</strong><small>Датчик кондиционера</small></div>
        </div>
      </div>
      <div class="status-strip">
        <div class="status-item"><span>Режим</span><strong>${this.modeLabel(m.mode)}</strong></div>
        <div class="status-item"><span>Вентилятор</span><strong>${this.fanLabel(m.fan)}</strong></div>
        <div class="status-item"><span>Δ датчиков</span><strong>${deltaText}</strong></div>
      </div>
    </section>`;
  }

  control(m) {
    if (!m.climate) return `<section class="card"><div class="section-title">Управление</div><p class="notice">Climate-сущность выбранного кондиционера не найдена.</p></section>`;
    const modes = [["off","Выкл."],["cool","Холод"],["heat","Тепло"],["auto","Авто"],["dry","Сушка"],["fan_only","Вент."]];
    return `<section class="card control-card">
      <div class="hero-top"><div><div class="room-title">${m.room.title}</div><div class="area">${m.room.area}</div></div>${this.connectionPlaque(m)}</div>
      <div class="setpoint"><button data-delta="-1">−</button><div class="num">${this.fmt(m.target,0)}°</div><button data-delta="1">+</button></div>
      <div class="modes">${modes.map(([v,t])=>`<button class="action ${m.mode===v?"active":""}" data-mode="${v}">${t}</button>`).join("")}</div>
      <div class="row"><span>Вентилятор</span><strong>${this.fanLabel(m.fan)}</strong></div>
      <div class="row"><span>Жалюзи</span><strong>${this.swingLabel(m.swing)}</strong></div>
      <p class="notice">Команды записи выполняются только после подтверждения.</p>
    </section>`;
  }

  statistics(m) {
    return `<section class="card"><div class="section-title">Статистика</div><div class="area">${m.room.title} · ${m.room.area}</div>
      <p class="notice">Здесь будут история контрольной температуры помещения, температура внутреннего блока, уставка и интервалы работы кондиционера. Источник — Recorder Home Assistant.</p>
    </section>`;
  }

  diagnostics(m) {
    const h = this.health(m);
    return `<section class="card">
      <div class="hero-top"><div><div class="section-title">Диагностика</div><div class="area">${m.room.title}</div></div>${this.connectionPlaque(m)}</div>
      <div class="row"><span>Состояние устройства</span><strong>${h.label}</strong></div>
      <div class="row"><span>Канал</span><strong>Syncleo UDP / LAN</strong></div>
      <div class="row"><span>WAN</span><strong>Не требуется</strong></div>
      <div class="row"><span>Climate entity</span><strong>${m.climate?.entity_id || "не найден"}</strong></div>
      <div class="row"><span>Контрольный датчик</span><strong>${m.room.roomTempEntity}</strong></div>
      <div class="row"><span>Температура помещения</span><strong>${this.fmt(m.roomTemp,1)} °C</strong></div>
      <div class="row"><span>Температура кондиционера</span><strong>${this.fmt(m.indoor,1)} °C</strong></div>
    </section>`;
  }

  bindControls(m) {
    const content = this.shadowRoot.getElementById("content");
    if (!content || !m.climate) return;
    content.querySelectorAll("[data-mode]").forEach((b) => b.onclick = () =>
      this.call("climate.set_hvac_mode",{entity_id:m.climate.entity_id,hvac_mode:b.dataset.mode})
    );
    content.querySelectorAll("[data-delta]").forEach((b) => b.onclick = () => {
      const base = m.target ?? 22;
      const next = Math.max(17,Math.min(30,base + Number(b.dataset.delta)));
      this.call("climate.set_temperature",{entity_id:m.climate.entity_id,temperature:next});
    });
  }
}

customElements.define("nikas-climate-panel",NikasClimatePanel);
