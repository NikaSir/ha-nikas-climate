const ROOMS = [
  {
    key: "living",
    title: "Зал",
    area: "11.2 - Гостиная",
    climateNames: ["Кондиционер в зале", "Кондей в Гостиной"],
    roomTempEntity: "sensor.sensor_th_zb_11_temperature"
  },
  {
    key: "veranda",
    title: "Веранда",
    area: "14 - Веранда",
    climateNames: ["Кондиционер на веранде", "Кондей на Веранде"],
    roomTempEntity: "sensor.sensor_th_zb_14_temperature"
  }
];

class NikasClimatePanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._selected = "living";
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
    const entries = Object.values(this._hass.states).filter((s) => s.entity_id.startsWith("climate."));
    return entries.find((s) => room.climateNames.includes(s.attributes.friendly_name)) ||
      entries.find((s) => (s.attributes.friendly_name || "").toLowerCase().includes(room.title.toLowerCase()));
  }

  roomTemp(room) {
    const state = this._hass?.states?.[room.roomTempEntity];
    const n = Number(state?.state);
    return Number.isFinite(n) ? n : null;
  }

  fmt(value, digits = 0) {
    return value == null || Number.isNaN(Number(value)) ? "—" : Number(value).toFixed(digits);
  }

  modeLabel(mode) {
    return ({off:"Выключено", cool:"Охлаждение", heat:"Обогрев", dry:"Осушение", fan_only:"Вентиляция", auto:"Авто"})[mode] || mode || "—";
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
    const indoor = Number(climate?.attributes?.current_temperature);
    const target = Number(climate?.attributes?.temperature);
    return {
      room,
      climate,
      roomTemp,
      indoor: Number.isFinite(indoor) ? indoor : null,
      target: Number.isFinite(target) ? target : null,
      mode: climate?.state || "unavailable",
      available: !!climate && climate.state !== "unavailable",
      fan: climate?.attributes?.fan_mode || "—",
      swing: climate?.attributes?.swing_mode || "—"
    };
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;height:100%;font-family:var(--paper-font-body1_-_font-family,Arial,sans-serif);color:var(--primary-text-color)}
        *{box-sizing:border-box} .shell{height:100%;display:grid;grid-template-rows:auto 1fr auto;background:var(--primary-background-color)}
        header{position:sticky;top:0;z-index:5;padding:calc(env(safe-area-inset-top) + 8px) 14px 10px;background:var(--card-background-color);border-bottom:1px solid var(--divider-color)}
        .head{display:flex;align-items:center;justify-content:center;min-height:56px}.title{text-align:center;font-weight:700;font-size:20px;cursor:pointer}.sub{font-size:12px;font-weight:500;opacity:.65;margin-top:2px}
        main{overflow:auto;padding:12px 12px calc(86px + env(safe-area-inset-bottom));touch-action:pan-y}.device-switch{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}.device{border:1px solid var(--divider-color);border-radius:16px;padding:10px;background:var(--card-background-color);font-weight:700;display:flex;align-items:center;gap:8px}.device.active{outline:2px solid var(--primary-color)}.lamp{width:9px;height:9px;border-radius:50%;background:#8a8a8a}.lamp.ok{background:#2eaf55}
        .card{background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:20px;padding:16px;margin-bottom:12px}.room-title{font-size:22px;font-weight:750}.area{opacity:.65;font-size:13px;margin-top:2px}.temps{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:8px;margin-top:16px}.tempbox{padding:12px;border-radius:16px;background:var(--secondary-background-color)}.tempbig{font-size:34px;font-weight:750}.label{font-size:12px;opacity:.65}.value{font-size:20px;font-weight:700;margin-top:5px}.mode{margin-top:14px;font-size:18px;font-weight:700}
        .link{display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding:10px 12px;border-radius:14px;background:var(--secondary-background-color)}.local{font-weight:700}.fresh{font-size:12px;opacity:.7}
        .controls{display:grid;gap:10px}.setpoint{display:grid;grid-template-columns:56px 1fr 56px;align-items:center;gap:10px}.setpoint button,.action{border:0;border-radius:16px;min-height:48px;background:var(--secondary-background-color);color:var(--primary-text-color);font-size:18px}.setpoint .num{text-align:center;font-size:36px;font-weight:750}.modes{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.action{font-size:14px;padding:8px}.action.active{outline:2px solid var(--primary-color)}
        .diag{display:grid;gap:8px}.row{display:flex;justify-content:space-between;gap:14px;padding:10px 0;border-bottom:1px solid var(--divider-color)}
        nav{position:fixed;left:0;right:0;bottom:0;z-index:6;display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:8px 8px calc(8px + env(safe-area-inset-bottom));background:var(--card-background-color);border-top:1px solid var(--divider-color)}nav button{border:0;background:transparent;color:var(--secondary-text-color);padding:8px 2px;font-size:12px}nav button.active{color:var(--primary-color);font-weight:700}
        .hidden{display:none}@media(max-width:460px){.temps{grid-template-columns:1fr 1fr}.temps .primary{grid-column:1/-1}.tempbig{font-size:38px}}
      </style>
      <div class="shell">
        <header><div class="head"><div class="title" id="back">Кондиционирование<div class="sub">UI v1.0.0</div></div></div></header>
        <main>
          <div class="device-switch" id="devices"></div>
          <section id="content"></section>
        </main>
        <nav>
          <button data-tab="summary">Сводка</button><button data-tab="control">Управление</button><button data-tab="statistics">Статистика</button><button data-tab="diagnostics">Диагностика</button>
        </nav>
      </div>`;
    this.shadowRoot.getElementById("back").onclick = () => { location.href = "/dashboard-house-v13/home"; };
    this.shadowRoot.querySelectorAll("nav button").forEach((b) => b.onclick = () => { this._tab=b.dataset.tab; this.patch(); });
    this.patch();
  }

  patch() {
    if (!this._hass || !this.shadowRoot) return;
    const models = ROOMS.map((r) => this.roomModel(r));
    const selected = models.find((m) => m.room.key === this._selected) || models[0];
    const devices = this.shadowRoot.getElementById("devices");
    devices.innerHTML = models.map((m)=>`<button class="device ${m.room.key===this._selected?"active":""}" data-room="${m.room.key}"><span class="lamp ${m.available?"ok":""}"></span>${m.room.title}</button>`).join("");
    devices.querySelectorAll("button").forEach((b)=>b.onclick=()=>{this._selected=b.dataset.room;this.patch();});
    this.shadowRoot.querySelectorAll("nav button").forEach((b)=>b.classList.toggle("active",b.dataset.tab===this._tab));
    const c = this.shadowRoot.getElementById("content");
    if (this._tab === "summary") c.innerHTML = this.summary(selected);
    if (this._tab === "control") c.innerHTML = this.control(selected);
    if (this._tab === "statistics") c.innerHTML = `<div class="card"><div class="room-title">Статистика</div><p>История контрольной температуры, температуры внутреннего блока, уставки и режимов будет добавлена после проверки сущностей на реальной установке.</p></div>`;
    if (this._tab === "diagnostics") c.innerHTML = this.diagnostics(selected);
    this.bindControls(selected);
  }

  summary(m){
    const delta = m.roomTemp!=null && m.indoor!=null ? m.indoor-m.roomTemp : null;
    return `<div class="card"><div class="room-title">${m.room.title}</div><div class="area">${m.room.area}</div><div class="temps"><div class="tempbox primary"><div class="label">Температура помещения</div><div class="tempbig">${this.fmt(m.roomTemp,1)} °C</div></div><div class="tempbox"><div class="label">Кондиционер</div><div class="value">${this.fmt(m.indoor,0)} °C</div></div><div class="tempbox"><div class="label">Уставка</div><div class="value">${this.fmt(m.target,0)} °C</div></div></div><div class="mode">${this.modeLabel(m.mode)}</div><div class="link"><div><div class="local">Локально</div><div class="fresh">Syncleo UDP / LAN</div></div><div>${m.available?"Данные актуальны":"Нет данных"}</div></div>${delta==null?"":`<div class="row"><span>Δ датчиков</span><strong>${delta>0?"+":""}${delta.toFixed(1)} °C</strong></div>`}</div>`;
  }

  control(m){
    if (!m.climate) return `<div class="card">Climate-сущность не найдена.</div>`;
    const modes = [["off","Выкл."],["cool","Холод"],["heat","Тепло"],["auto","Авто"],["dry","Сушка"],["fan_only","Вент."]];
    return `<div class="card controls"><div class="room-title">${m.room.title}</div><div class="setpoint"><button data-delta="-1">−</button><div class="num">${this.fmt(m.target,0)}°</div><button data-delta="1">+</button></div><div class="modes">${modes.map(([v,t])=>`<button class="action ${m.mode===v?"active":""}" data-mode="${v}">${t}</button>`).join("")}</div><div class="row"><span>Вентилятор</span><strong>${m.fan}</strong></div><div class="row"><span>Жалюзи</span><strong>${m.swing}</strong></div></div>`;
  }

  diagnostics(m){
    return `<div class="card"><div class="room-title">Диагностика</div><div class="diag"><div class="row"><span>Канал</span><strong>Локально · UDP</strong></div><div class="row"><span>Climate entity</span><strong>${m.climate?.entity_id||"не найден"}</strong></div><div class="row"><span>Контрольный датчик</span><strong>${m.room.roomTempEntity}</strong></div><div class="row"><span>Температура помещения</span><strong>${this.fmt(m.roomTemp,1)} °C</strong></div><div class="row"><span>Температура кондиционера</span><strong>${this.fmt(m.indoor,1)} °C</strong></div><div class="row"><span>Доступность</span><strong>${m.available?"В норме":"Недоступен"}</strong></div></div></div>`;
  }

  bindControls(m){
    const c=this.shadowRoot.getElementById("content"); if(!c||!m.climate)return;
    c.querySelectorAll("[data-mode]").forEach((b)=>b.onclick=()=>this.call("climate.set_hvac_mode",{entity_id:m.climate.entity_id,hvac_mode:b.dataset.mode}));
    c.querySelectorAll("[data-delta]").forEach((b)=>b.onclick=()=>{
      const base=m.target??22; const next=Math.max(17,Math.min(30,base+Number(b.dataset.delta)));
      this.call("climate.set_temperature",{entity_id:m.climate.entity_id,temperature:next});
    });
  }
}

customElements.define("nikas-climate-panel", NikasClimatePanel);
