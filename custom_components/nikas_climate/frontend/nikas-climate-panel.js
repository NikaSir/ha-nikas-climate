const UI_VERSION = "1.2.0";
const SAFE_RETURN_ROUTE = "/dashboard-house-v13/home";
const HISTORY_HOURS = 24;

const ROOMS = [
  {
    key: "living",
    title: "Зал",
    area: "11.2 · Гостиная",
    climateNames: ["Кондиционер в зале", "Кондей в Гостиной"],
    explicitRoomTempEntity: "sensor.sensor_th_zb_11_temperature"
  },
  {
    key: "veranda",
    title: "Веранда",
    area: "14 · Веранда",
    climateNames: ["Кондиционер на веранде", "Кондей на Веранде"],
    explicitRoomTempEntity: "sensor.sensor_th_zb_14_temperature"
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
    this._drafts = {};
    this._entityRegistry = null;
    this._areaRegistry = null;
    this._labelRegistry = null;
    this._registryLoading = false;
    this._history = {};
    this._historyLoading = {};
    this._refreshing = false;
  }

  set hass(value) {
    this._hass = value;
    if (!this._rendered) {
      this.render();
      this._rendered = true;
    } else {
      this.patch();
    }
    this.ensureRegistries();
  }

  set panel(value) { this._panel = value; }

  async ensureRegistries(force=false) {
    if (!this._hass?.callWS || this._registryLoading) return;
    if (!force && this._entityRegistry && this._areaRegistry && this._labelRegistry) return;
    this._registryLoading = true;
    try {
      const [entities, areas, labels] = await Promise.all([
        this._hass.callWS({type:"config/entity_registry/list"}),
        this._hass.callWS({type:"config/area_registry/list"}).catch(() => []),
        this._hass.callWS({type:"config/label_registry/list"}).catch(() => [])
      ]);
      this._entityRegistry = Array.isArray(entities) ? entities : [];
      this._areaRegistry = Array.isArray(areas) ? areas : [];
      this._labelRegistry = Array.isArray(labels) ? labels : [];
    } catch (_err) {
      this._entityRegistry = this._entityRegistry || [];
      this._areaRegistry = this._areaRegistry || [];
      this._labelRegistry = this._labelRegistry || [];
    } finally {
      this._registryLoading = false;
      if (this._rendered) this.patch();
    }
  }

  findClimate(room) {
    if (!this._hass) return null;
    const all = Object.values(this._hass.states).filter((s) => s.entity_id.startsWith("climate."));
    return all.find((s) => room.climateNames.includes(s.attributes.friendly_name)) ||
      all.find((s) => (s.attributes.friendly_name || "").toLowerCase().includes(room.title.toLowerCase()));
  }

  registryEntry(entityId) {
    return Array.isArray(this._entityRegistry) ? this._entityRegistry.find((e) => e.entity_id === entityId) : null;
  }

  isTemperatureEntity(state) {
    if (!state?.entity_id?.startsWith("sensor.")) return false;
    return state.attributes?.device_class === "temperature" || state.attributes?.unit_of_measurement === "°C";
  }

  resolveRoomTempEntity(room, climate) {
    if (!this._hass) return room.explicitRoomTempEntity;
    const candidates = Object.values(this._hass.states).filter((s) => this.isTemperatureEntity(s));
    if (!Array.isArray(this._entityRegistry) || !climate?.entity_id) return room.explicitRoomTempEntity;

    const climateReg = this.registryEntry(climate.entity_id);
    const climateLabels = new Set(climateReg?.labels || []);
    const sharedLabelCandidates = candidates.filter((s) => {
      const reg = this.registryEntry(s.entity_id);
      return (reg?.labels || []).some((label) => climateLabels.has(label));
    });
    if (sharedLabelCandidates.length) {
      const explicit = sharedLabelCandidates.find((s) => s.entity_id === room.explicitRoomTempEntity);
      return (explicit || sharedLabelCandidates[0]).entity_id;
    }

    if (climateReg?.area_id) {
      const sameArea = candidates.filter((s) => this.registryEntry(s.entity_id)?.area_id === climateReg.area_id);
      if (sameArea.length) {
        const explicit = sameArea.find((s) => s.entity_id === room.explicitRoomTempEntity);
        return (explicit || sameArea[0]).entity_id;
      }
    }

    return this._hass.states[room.explicitRoomTempEntity] ? room.explicitRoomTempEntity : null;
  }

  fmt(value, digits=0) {
    return value == null || !Number.isFinite(Number(value)) ? "—" : Number(value).toFixed(digits);
  }

  modeLabel(mode) {
    return ({off:"Выключено",cool:"Охлаждение",heat:"Обогрев",dry:"Осушение",fan_only:"Вентиляция",auto:"Авто"})[mode] || "Нет данных";
  }

  modeIcon(mode) {
    return ({off:"mdi:power",cool:"mdi:snowflake",heat:"mdi:fire",dry:"mdi:water-percent",fan_only:"mdi:fan",auto:"mdi:autorenew"})[mode] || "mdi:help-circle-outline";
  }

  fanLabel(value) {
    return ({auto:"Авто",low:"Низкая",medium:"Средняя",high:"Высокая"})[value] || value || "—";
  }

  fanIcon(value) {
    return ({auto:"mdi:fan-auto",low:"mdi:fan-speed-1",medium:"mdi:fan-speed-2",high:"mdi:fan-speed-3"})[value] || "mdi:fan";
  }

  flapLabel(value) {
    return value === "off" ? "Зафиксирована" : (value && value !== "—" ? "Качание" : "—");
  }

  flapIcon(value) {
    return value === "off" ? "mdi:pause-circle-outline" : "mdi:swap-vertical";
  }

  siblingFeatureEntity(climate, featureKey) {
    if (!climate?.entity_id || !Array.isArray(this._entityRegistry)) return null;
    const climateEntry = this.registryEntry(climate.entity_id);
    if (!climateEntry?.device_id) return null;
    const suffix = `_${featureKey}`;
    const entry = this._entityRegistry.find((candidate) =>
      candidate.device_id === climateEntry.device_id &&
      (String(candidate.unique_id || "").endsWith(suffix) || String(candidate.entity_id || "").endsWith(suffix))
    );
    return entry?.entity_id || null;
  }

  siblingFeatureState(climate, featureKey) {
    const entityId = this.siblingFeatureEntity(climate, featureKey);
    const state = entityId ? this._hass?.states?.[entityId] : null;
    if (!state || ["unavailable","unknown"].includes(state.state)) return null;
    return state.state;
  }

  boolLabel(value, onLabel="Вкл.", offLabel="Выкл.") {
    if (value === "on" || value === true) return onLabel;
    if (value === "off" || value === false) return offLabel;
    return "—";
  }

  roomModel(room) {
    const climate = this.findClimate(room);
    const roomTempEntity = this.resolveRoomTempEntity(room, climate);
    const roomTempState = roomTempEntity ? this._hass?.states?.[roomTempEntity] : null;
    const roomTempRaw = Number(roomTempState?.state);
    const indoorRaw = Number(climate?.attributes?.current_temperature);
    const targetRaw = Number(climate?.attributes?.temperature);
    const available = Boolean(climate && !["unavailable","unknown"].includes(climate.state));
    const roomAvailable = Boolean(roomTempState && !["unavailable","unknown"].includes(roomTempState.state));
    const features = {
      night: this.siblingFeatureState(climate,"night"),
      turbo: this.siblingFeatureState(climate,"turbo"),
      childLock: this.siblingFeatureState(climate,"child_lock"),
      volume: this.siblingFeatureState(climate,"volume"),
      accessControl: this.siblingFeatureState(climate,"access_control"),
      error: this.siblingFeatureState(climate,"error"),
      backlight: this.siblingFeatureState(climate,"backlight")
    };
    const featureEntities = {
      night: this.siblingFeatureEntity(climate,"night"),
      turbo: this.siblingFeatureEntity(climate,"turbo")
    };
    return {
      room, climate, roomTempEntity,
      roomTemp: Number.isFinite(roomTempRaw) ? roomTempRaw : null,
      indoor: Number.isFinite(indoorRaw) ? indoorRaw : null,
      target: Number.isFinite(targetRaw) ? targetRaw : null,
      mode: climate?.state || "unavailable",
      available, roomAvailable,
      fan: climate?.attributes?.fan_mode || "—",
      swing: climate?.attributes?.swing_mode || "—",
      features, featureEntities
    };
  }

  health(m) {
    if (!m.climate || !m.available) return {tone:"bad", label:"Нет связи"};
    if (m.features?.error === "on") return {tone:"bad", label:"Ошибка кондиционера"};
    if (!m.roomAvailable) return {tone:"warn", label:"Датчик комнаты недоступен"};
    return {tone:"ok", label:"В норме"};
  }

  connection(m) {
    if (!m.climate || !m.available) return {tone:"offline", label:"Нет связи", fresh:"Нет данных"};
    return {tone:"local", label:"Локально", fresh:"Данные актуальны"};
  }

  activeSwingMode(m, draft=null) {
    const current = draft?.swing || m.swing;
    if (current && current !== "off" && current !== "—") return current;
    const remembered = localStorage.getItem(`nikas_climate.swing.${m.room.key}`);
    return remembered && remembered !== "off" ? remembered : "both";
  }

  draftFor(m) {
    const key = m.room.key;
    let draft = this._drafts[key];
    if (!draft || draft.entityId !== m.climate?.entity_id) {
      draft = {
        entityId: m.climate?.entity_id || null,
        target: m.target ?? 22,
        mode: m.mode,
        fan: m.fan,
        swing: m.swing,
        night: m.features?.night,
        turbo: m.features?.turbo,
        dirty: false,
        applying: false,
        error: null
      };
      this._drafts[key] = draft;
      return draft;
    }
    if (draft.applying) {
      const targetMatches = m.target == null || Math.abs(Number(m.target) - Number(draft.target)) < 0.01;
      const modeMatches = m.mode === draft.mode;
      const fanMatches = m.fan === draft.fan;
      const swingMatches = m.swing === draft.swing;
      const nightMatches = m.features?.night == null || m.features?.night === draft.night;
      const turboMatches = m.features?.turbo == null || m.features?.turbo === draft.turbo;
      if (targetMatches && modeMatches && fanMatches && swingMatches && nightMatches && turboMatches) draft.applying = false;
    }
    if (!draft.dirty && !draft.applying) {
      draft.target = m.target ?? draft.target ?? 22;
      draft.mode = m.mode;
      draft.fan = m.fan;
      draft.swing = m.swing;
      draft.night = m.features?.night;
      draft.turbo = m.features?.turbo;
      draft.error = null;
    }
    return draft;
  }

  draftChanged(m, draft) {
    return (m.target != null && Number(draft.target) !== Number(m.target)) ||
      draft.mode !== m.mode || draft.fan !== m.fan || draft.swing !== m.swing ||
      (m.features?.night != null && draft.night !== m.features.night) ||
      (m.features?.turbo != null && draft.turbo !== m.features.turbo);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;inline-size:100%;block-size:100%;min-inline-size:0;min-block-size:0;container-type:inline-size;container-name:nikas-panel;font-family:var(--paper-font-body1_-_font-family,Arial,sans-serif);color:var(--primary-text-color)}
        *{box-sizing:border-box} button{font:inherit}
        .shell{position:absolute;inset:0;display:grid;grid-template-rows:calc(60px + env(safe-area-inset-top)) 52px minmax(0,1fr) calc(64px + env(safe-area-inset-bottom));background:var(--primary-background-color);overflow:hidden}
        .app-header{display:grid;grid-template-columns:52px minmax(0,1fr) 52px;align-items:end;gap:8px;padding:env(safe-area-inset-top) max(12px,env(safe-area-inset-right)) 0 max(12px,env(safe-area-inset-left));background:color-mix(in srgb,var(--primary-background-color) 97%,transparent);border-bottom:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);backdrop-filter:blur(18px) saturate(130%);-webkit-backdrop-filter:blur(18px) saturate(130%)}
        .header-action{align-self:center;justify-self:center;width:44px;height:44px;border-radius:16px;border:1px solid color-mix(in srgb,var(--divider-color) 72%,transparent);background:var(--card-background-color);color:var(--primary-text-color);box-shadow:0 7px 20px rgba(23,45,76,.08);display:grid;place-items:center}.header-action ha-icon{--mdc-icon-size:25px}.header-action.refreshing ha-icon{animation:spin .9s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
        .header-title{align-self:center;justify-self:center;width:min(360px,100%);height:52px;padding:5px 14px;border-radius:16px;border:1px solid color-mix(in srgb,var(--primary-color,#03a9d9) 24%,var(--divider-color,#dfe3e8));background:color-mix(in srgb,var(--primary-color,#03a9d9) 5%,var(--card-background-color,#fff));box-shadow:0 5px 16px rgba(23,45,76,.06);color:var(--primary-text-color);display:flex;flex-direction:column;justify-content:center;align-items:center}.header-title strong{font-size:23px;font-weight:800;line-height:1.05;white-space:nowrap}.header-title span{margin-top:2px;font-size:14px;font-weight:560;color:var(--secondary-text-color)}
        .peer-selector{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:6px 12px;border-bottom:1px solid color-mix(in srgb,var(--divider-color) 64%,transparent)}.peer{height:40px;border-radius:16px;border:1px solid color-mix(in srgb,var(--divider-color) 72%,transparent);background:var(--card-background-color);color:var(--primary-text-color);display:flex;align-items:center;justify-content:center;gap:9px;font-size:14px;font-weight:750}.peer.active{background:color-mix(in srgb,var(--primary-color) 9%,var(--card-background-color));border-color:color-mix(in srgb,var(--primary-color) 55%,var(--divider-color));color:var(--primary-color)}
        .peer-lamp{width:9px;height:9px;border-radius:50%;background:var(--disabled-text-color);box-shadow:0 0 0 3px color-mix(in srgb,var(--disabled-text-color) 22%,transparent)}.peer-lamp.ok{background:var(--success-color,#43a047);box-shadow:0 0 0 3px color-mix(in srgb,var(--success-color,#43a047) 20%,transparent)}.peer-lamp.warn{background:var(--warning-color,#f6a623)}.peer-lamp.bad{background:var(--error-color,#db4437)}
        .viewport{min-width:0;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;touch-action:pan-y}.content{width:100%;max-width:1280px;margin:0 auto;padding:12px}
        .card{background:var(--card-background-color);border:1px solid color-mix(in srgb,var(--divider-color) 72%,transparent);border-radius:22px;padding:15px;box-shadow:0 6px 18px rgba(0,0,0,.04);margin-bottom:12px}.hero{background:linear-gradient(135deg,var(--card-background-color) 62%,color-mix(in srgb,var(--primary-color) 6%,var(--card-background-color)) 100%)}
        .hero-top{display:grid;grid-template-columns:minmax(0,1fr) minmax(168px,42%);gap:12px;align-items:start}.page-head{margin-bottom:2px}.room-title{font-size:25px;font-weight:800;line-height:1.04;letter-spacing:-.03em}.area{margin-top:5px;color:var(--secondary-text-color);font-size:13px;font-weight:600}
        .connection-indicator{display:grid;grid-template-columns:10px minmax(0,1fr);align-items:center;column-gap:9px;min-height:58px;padding:12px;border-radius:18px;border:1px solid color-mix(in srgb,var(--divider-color) 72%,transparent);box-shadow:0 4px 14px rgba(0,0,0,.055);white-space:nowrap}.connection-lamp{width:10px;height:10px;border-radius:50%}.connection-copy{display:grid;row-gap:4px}.connection-copy strong{font-size:16px}.connection-copy small{font-size:13px;font-weight:600;color:var(--secondary-text-color)}.connection-indicator.local{background:color-mix(in srgb,var(--success-color,#43a047) 11%,var(--card-background-color));border-color:color-mix(in srgb,var(--success-color,#43a047) 30%,var(--divider-color))}.connection-indicator.local .connection-lamp{background:var(--success-color,#43a047)}.connection-indicator.local strong{color:var(--success-color,#43a047)}.connection-indicator.offline{background:color-mix(in srgb,var(--error-color,#db4437) 10%,var(--card-background-color));border-color:color-mix(in srgb,var(--error-color,#db4437) 30%,var(--divider-color))}.connection-indicator.offline .connection-lamp{background:var(--error-color,#db4437)}.connection-indicator.offline strong{color:var(--error-color,#db4437)}
        .climate-core{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,.65fr);gap:10px;margin-top:14px}.primary-temp{min-height:174px;padding:16px;border-radius:22px;background:color-mix(in srgb,var(--primary-color) 5%,var(--card-background-color));border:1px solid color-mix(in srgb,var(--primary-color) 14%,var(--divider-color));display:flex;flex-direction:column;justify-content:center}.eyebrow{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--secondary-text-color)}.temp-main{margin-top:4px;font-size:58px;font-weight:800;line-height:1;letter-spacing:-.05em}.temp-sub{margin-top:8px;color:var(--secondary-text-color);font-size:13px}.metric-stack{display:grid;grid-template-rows:1fr 1fr;gap:10px}.metric{padding:13px;border-radius:19px;border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);display:flex;flex-direction:column;justify-content:center}.metric span{font-size:12px;font-weight:700;color:var(--secondary-text-color)}.metric strong{margin-top:5px;font-size:24px}.metric small{margin-top:5px;font-size:12px;color:var(--secondary-text-color)}
        .report-title{margin-top:14px;font-size:13px;font-weight:800;color:var(--secondary-text-color);letter-spacing:.07em;text-transform:uppercase}.status-strip{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:8px}.status-item{min-height:88px;padding:9px 7px;border-radius:18px;border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center}.status-item ha-icon{--mdc-icon-size:23px;color:var(--primary-color);margin-bottom:5px}.status-item span{font-size:11.5px;color:var(--secondary-text-color);font-weight:700}.status-item strong{margin-top:4px;font-size:14px;line-height:1.1}.status-item.active strong,.status-item.active ha-icon{color:var(--success-color,#43a047)}
        .chart-card{margin-top:12px;padding:12px;border-radius:19px;border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);background:var(--card-background-color)}.chart-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.chart-head strong{font-size:13px}.chart-head small{font-size:11px;color:var(--secondary-text-color)}.chart-wrap{height:132px;margin-top:8px}.chart-wrap svg{width:100%;height:100%;overflow:visible}.chart-grid{stroke:color-mix(in srgb,var(--divider-color) 70%,transparent);stroke-width:1}.chart-room{fill:none;stroke:var(--primary-color);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}.chart-target{fill:none;stroke:var(--success-color,#43a047);stroke-width:2;stroke-dasharray:5 5;stroke-linecap:round}.chart-empty{height:112px;display:grid;place-items:center;color:var(--secondary-text-color);font-size:12px}.chart-legend{display:flex;gap:14px;margin-top:5px;font-size:11px;color:var(--secondary-text-color)}.chart-legend span{display:inline-flex;align-items:center;gap:5px}.chart-dot{width:8px;height:8px;border-radius:50%;background:var(--primary-color)}.chart-dot.target{background:var(--success-color,#43a047)}
        .control-card .room-title,.section-title{font-size:24px;font-weight:800}.setpoint{display:grid;grid-template-columns:58px minmax(0,1fr) 58px;align-items:center;gap:10px;margin-top:16px}.setpoint button{height:54px;border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);border-radius:18px;background:var(--card-background-color);font-size:26px;color:var(--primary-text-color)}.setpoint-center{text-align:center}.setpoint .num{font-size:44px;font-weight:800}.setpoint .num.target{color:var(--success-color,#43a047)}.setpoint-current{display:block;margin-top:3px;font-size:12px;font-weight:700;color:var(--primary-color)}
        .control-section{margin-top:14px}.control-label{font-size:12px;font-weight:800;color:var(--secondary-text-color);letter-spacing:.06em;text-transform:uppercase;margin-bottom:7px}.modes,.fan-modes,.feature-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.action{min-height:74px;padding:7px 5px;border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);border-radius:18px;background:var(--card-background-color);color:var(--primary-text-color);font-size:12.5px;font-weight:750;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px}.action ha-icon{--mdc-icon-size:25px}.action.current{background:color-mix(in srgb,var(--primary-color) 10%,var(--card-background-color));border-color:color-mix(in srgb,var(--primary-color) 52%,var(--divider-color));color:var(--primary-color)}.action.target{background:color-mix(in srgb,var(--success-color,#43a047) 12%,var(--card-background-color));border-color:color-mix(in srgb,var(--success-color,#43a047) 54%,var(--divider-color));color:var(--success-color,#43a047)}.feature-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.apply{width:100%;min-height:54px;margin-top:14px;border-radius:18px;border:1px solid color-mix(in srgb,var(--success-color,#43a047) 55%,var(--divider-color));background:color-mix(in srgb,var(--success-color,#43a047) 14%,var(--card-background-color));color:var(--success-color,#43a047);font-weight:800;font-size:15px}.apply:disabled{background:var(--secondary-background-color);border-color:color-mix(in srgb,var(--divider-color) 70%,transparent);color:var(--disabled-text-color);opacity:.72}.legend{display:flex;gap:14px;align-items:center;margin-top:10px;font-size:12px;color:var(--secondary-text-color)}.legend span{display:inline-flex;align-items:center;gap:6px}.legend i{width:9px;height:9px;border-radius:50%}.legend .current-dot{background:var(--primary-color)}.legend .target-dot{background:var(--success-color,#43a047)}
        .row{display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent)}.row:last-child{border-bottom:0}.row span{color:var(--secondary-text-color)}.row strong{text-align:right}.notice{font-size:14px;line-height:1.45;color:var(--secondary-text-color);margin-top:10px}.notice.error{color:var(--error-color,#db4437);font-weight:700}.bottom-nav{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));padding:0 max(8px,env(safe-area-inset-right)) env(safe-area-inset-bottom) max(8px,env(safe-area-inset-left));background:color-mix(in srgb,var(--primary-background-color) 97%,transparent);border-top:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);backdrop-filter:blur(18px) saturate(130%)}.bottom-nav button{border:0;background:transparent;color:var(--secondary-text-color);font-size:12px;font-weight:700}.bottom-nav button.active{color:var(--primary-color)}
        @media(max-width:480px){.climate-core{grid-template-columns:1fr}.metric-stack{grid-template-columns:1fr 1fr;grid-template-rows:auto}.primary-temp{min-height:136px}.temp-main{font-size:54px}}
        @media(max-width:360px){.status-strip,.modes,.fan-modes,.feature-grid{grid-template-columns:repeat(2,1fr)}}
      </style>
      <div class="shell">
        <header class="app-header">
          <button class="header-action" id="menu" type="button" aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
          <button class="header-title" id="back" type="button" aria-label="Вернуться в панель Дом"><strong>Кондиционирование</strong><span>UI v${UI_VERSION}</span></button>
          <button class="header-action" id="refresh" type="button" aria-label="Обновить состояние кондиционера"><ha-icon icon="mdi:refresh"></ha-icon></button>
        </header>
        <div class="peer-selector" id="devices"></div>
        <main class="viewport"><div class="content"><section id="content"></section></div></main>
        <nav class="bottom-nav">
          <button data-tab="summary">Сводка</button><button data-tab="control">Управление</button><button data-tab="statistics">Статистика</button><button data-tab="diagnostics">Диагностика</button>
        </nav>
      </div>`;
    this.shadowRoot.getElementById("menu").onclick = () => this.dispatchEvent(new CustomEvent("hass-toggle-menu",{bubbles:true,composed:true}));
    this.shadowRoot.getElementById("back").onclick = () => { history.pushState(null,"",SAFE_RETURN_ROUTE); window.dispatchEvent(new CustomEvent("location-changed")); };
    this.shadowRoot.getElementById("refresh").onclick = () => this.refreshSelected();
    this.shadowRoot.querySelectorAll(".bottom-nav button").forEach((b) => b.onclick = () => { this._tab=b.dataset.tab; this.shadowRoot.querySelector(".viewport").scrollTop=0; this.patch(); });
    this.patch();
  }

  patch() {
    if (!this._hass || !this.shadowRoot) return;
    const models = ROOMS.map((r) => this.roomModel(r));
    const selected = models.find((m) => m.room.key === this._selected) || models[0];
    const refresh = this.shadowRoot.getElementById("refresh");
    refresh?.classList.toggle("refreshing",this._refreshing);
    if (refresh) refresh.disabled = this._refreshing;

    const devices = this.shadowRoot.getElementById("devices");
    devices.innerHTML = models.map((m) => { const h=this.health(m); const active=m.room.key===selected.room.key; return `<button class="peer ${active?"active":""}" data-room="${m.room.key}"><i class="peer-lamp ${h.tone}"></i><span>${m.room.title}</span></button>`; }).join("");
    devices.querySelectorAll(".peer").forEach((b) => b.onclick = () => { this._selected=b.dataset.room; localStorage.setItem("nikas_climate.peer",this._selected); this.shadowRoot.querySelector(".viewport").scrollTop=0; this.patch(); });
    this.shadowRoot.querySelectorAll(".bottom-nav button").forEach((b) => b.classList.toggle("active",b.dataset.tab===this._tab));
    const content = this.shadowRoot.getElementById("content");
    content.innerHTML = this._tab === "summary" ? this.summary(selected) : this._tab === "control" ? this.control(selected) : this._tab === "statistics" ? this.statistics(selected) : this.diagnostics(selected);
    this.bindControls(selected);
    if (this._tab === "summary") this.ensureHistory(selected);
  }

  connectionPlaque(m) {
    const c=this.connection(m); return `<div class="connection-indicator ${c.tone}" role="status"><i class="connection-lamp"></i><span class="connection-copy"><strong>${c.label}</strong><small>${c.fresh}</small></span></div>`;
  }

  summary(m) {
    const delta=m.roomTemp!=null&&m.indoor!=null?m.indoor-m.roomTemp:null;
    const deltaText=delta==null?"—":`${delta>0?"+":""}${delta.toFixed(1)} °C`;
    const night=this.boolLabel(m.features?.night), turbo=this.boolLabel(m.features?.turbo);
    return `<section class="card hero">
      <div class="hero-top"><div><div class="room-title">${m.room.title}</div><div class="area">${m.room.area}</div></div>${this.connectionPlaque(m)}</div>
      <div class="climate-core"><div class="primary-temp"><span class="eyebrow">Температура помещения</span><strong class="temp-main">${this.fmt(m.roomTemp,1)}°</strong><small class="temp-sub">Контрольный датчик помещения</small></div><div class="metric-stack"><div class="metric"><span>Уставка</span><strong>${this.fmt(m.target,0)} °C</strong><small>Целевая температура</small></div><div class="metric"><span>Внутренний блок</span><strong>${this.fmt(m.indoor,0)} °C</strong><small>Датчик кондиционера</small></div></div></div>
      <div class="report-title">Режим работы</div><div class="status-strip">
        <div class="status-item"><ha-icon icon="${this.modeIcon(m.mode)}"></ha-icon><span>Режим</span><strong>${this.modeLabel(m.mode)}</strong></div>
        <div class="status-item"><ha-icon icon="${this.fanIcon(m.fan)}"></ha-icon><span>Вентилятор</span><strong>${this.fanLabel(m.fan)}</strong></div>
        <div class="status-item"><ha-icon icon="${this.flapIcon(m.swing)}"></ha-icon><span>Створка</span><strong>${this.flapLabel(m.swing)}</strong></div>
        <div class="status-item ${m.features?.night==="on"?"active":""}"><ha-icon icon="mdi:weather-night"></ha-icon><span>Ночной</span><strong>${night}</strong></div>
        <div class="status-item ${m.features?.turbo==="on"?"active":""}"><ha-icon icon="mdi:rocket-launch-outline"></ha-icon><span>Турбо</span><strong>${turbo}</strong></div>
        <div class="status-item"><ha-icon icon="mdi:thermometer-lines"></ha-icon><span>Δ датчиков</span><strong>${deltaText}</strong></div>
      </div>${this.historyCard(m)}
    </section>`;
  }

  control(m) {
    if (!m.climate) return `<section class="card"><div class="section-title">Управление</div><p class="notice">Climate-сущность выбранного кондиционера не найдена.</p></section>`;
    const d=this.draftFor(m); d.dirty=d.dirty||this.draftChanged(m,d);
    const modes=[["off","Выкл.","mdi:power"],["cool","Холод","mdi:snowflake"],["heat","Тепло","mdi:fire"],["auto","Авто","mdi:autorenew"],["dry","Сушка","mdi:water-percent"],["fan_only","Вент.","mdi:fan"]];
    const fans=[["auto","Авто","mdi:fan-auto"],["low","Низкая","mdi:fan-speed-1"],["medium","Средняя","mdi:fan-speed-2"],["high","Высокая","mdi:fan-speed-3"]];
    const tempChanged=m.target!=null&&Number(d.target)!==Number(m.target);
    const action=(current,target,attr,value,icon,label)=>{const cls=["action"];if(current===value)cls.push("current");if(target===value&&target!==current)cls.push("target");return `<button class="${cls.join(" ")}" data-${attr}="${value}" ${d.applying?"disabled":""}><ha-icon icon="${icon}"></ha-icon><span>${label}</span></button>`;};
    const flapCurrent=this.flapLabel(m.swing), flapTarget=this.flapLabel(d.swing);
    return `<section class="card control-card"><div class="page-head"><div class="room-title">${m.room.title}</div><div class="area">${m.room.area}</div></div>
      <div class="setpoint"><button data-delta="-1" ${d.applying?"disabled":""}>−</button><div class="setpoint-center"><div class="num ${tempChanged?"target":""}">${this.fmt(d.target,0)}°</div><span class="setpoint-current">Сейчас ${this.fmt(m.target,0)}°</span></div><button data-delta="1" ${d.applying?"disabled":""}>+</button></div>
      <div class="control-section"><div class="control-label">Режим</div><div class="modes">${modes.map(([v,t,i])=>action(m.mode,d.mode,"mode",v,i,t)).join("")}</div></div>
      <div class="control-section"><div class="control-label">Вентилятор</div><div class="fan-modes">${fans.map(([v,t,i])=>action(m.fan,d.fan,"fan",v,i,t)).join("")}</div></div>
      <div class="control-section"><div class="control-label">Дополнительно</div><div class="feature-grid">
        <button class="action ${flapCurrent===flapTarget?"current":"target"}" data-flap ${d.applying?"disabled":""}><ha-icon icon="${this.flapIcon(d.swing)}"></ha-icon><span>Створка<br>${flapTarget}</span></button>
        ${m.features?.night!=null?`<button class="action ${m.features.night===d.night?(d.night==="on"?"current":""):"target"}" data-feature="night" ${d.applying?"disabled":""}><ha-icon icon="mdi:weather-night"></ha-icon><span>Ночной<br>${this.boolLabel(d.night)}</span></button>`:""}
        ${m.features?.turbo!=null?`<button class="action ${m.features.turbo===d.turbo?(d.turbo==="on"?"current":""):"target"}" data-feature="turbo" ${d.applying?"disabled":""}><ha-icon icon="mdi:rocket-launch-outline"></ha-icon><span>Турбо<br>${this.boolLabel(d.turbo)}</span></button>`:""}
      </div></div>
      <div class="legend"><span><i class="current-dot"></i>Текущее</span><span><i class="target-dot"></i>Целевое</span></div>
      <button class="apply" data-apply ${(!d.dirty||d.applying)?"disabled":""}>${d.applying?"Применяется…":"Применить"}</button>
      ${d.error?`<p class="notice error">${d.error}</p>`:""}<p class="notice">Все изменения накапливаются и отправляются одной кнопкой «Применить». ИК-пульт работает независимо и не синхронизирует свой экран с Wi‑Fi.</p>
    </section>`;
  }

  statistics(m) {
    return `<section class="card"><div class="section-title">Статистика</div><div class="area">${m.room.title} · ${m.room.area}</div><p class="notice">Основной график за 24 часа вынесен на «Сводку». Здесь подготовлено место для расширенных периодов 7 / 30 дней и анализа времени работы.</p></section>`;
  }

  diagnostics(m) {
    const h=this.health(m); const climateReg=this.registryEntry(m.climate?.entity_id);
    return `<section class="card"><div class="page-head"><div class="section-title">Диагностика</div><div class="area">${m.room.title}</div></div>
      <div class="row"><span>Состояние устройства</span><strong>${h.label}</strong></div><div class="row"><span>Канал</span><strong>Syncleo UDP / LAN</strong></div><div class="row"><span>WAN</span><strong>Не требуется</strong></div>
      <div class="row"><span>Climate entity</span><strong>${m.climate?.entity_id||"не найден"}</strong></div><div class="row"><span>Config entry</span><strong>${climateReg?.config_entry_id||"—"}</strong></div><div class="row"><span>Контрольный датчик</span><strong>${m.roomTempEntity||"не найден"}</strong></div>
      <div class="row"><span>Температура помещения</span><strong>${this.fmt(m.roomTemp,1)} °C</strong></div><div class="row"><span>Температура кондиционера</span><strong>${this.fmt(m.indoor,1)} °C</strong></div>
      <div class="row"><span>Створка</span><strong>${this.flapLabel(m.swing)}</strong></div><div class="row"><span>Ночной режим</span><strong>${this.boolLabel(m.features?.night)}</strong></div><div class="row"><span>Турбо</span><strong>${this.boolLabel(m.features?.turbo)}</strong></div><div class="row"><span>Замок от детей</span><strong>${this.boolLabel(m.features?.childLock)}</strong></div><div class="row"><span>Звук</span><strong>${this.boolLabel(m.features?.volume)}</strong></div><div class="row"><span>Контроль доступа</span><strong>${this.boolLabel(m.features?.accessControl)}</strong></div><div class="row"><span>Подсветка</span><strong>${this.boolLabel(m.features?.backlight)}</strong></div><div class="row"><span>Ошибка</span><strong>${this.boolLabel(m.features?.error,"Есть","Нет")}</strong></div>
      <p class="notice">Штатный ИК-пульт односторонний: после команд через Wi‑Fi его экран может показывать старые параметры. Кнопка ↻ в Header принудительно обновляет выбранный Syncleo config entry и перечитывает состояние.</p>
    </section>`;
  }

  bindControls(m) {
    const content=this.shadowRoot.getElementById("content"); if(!content||!m.climate||this._tab!=="control")return; const d=this.draftFor(m);
    content.querySelectorAll("[data-mode]").forEach((b)=>b.onclick=()=>{if(d.applying)return;d.mode=b.dataset.mode;d.dirty=this.draftChanged(m,d);d.error=null;this.patch();});
    content.querySelectorAll("[data-fan]").forEach((b)=>b.onclick=()=>{if(d.applying)return;d.fan=b.dataset.fan;d.dirty=this.draftChanged(m,d);d.error=null;this.patch();});
    content.querySelectorAll("[data-delta]").forEach((b)=>b.onclick=()=>{if(d.applying)return;const base=Number.isFinite(Number(d.target))?Number(d.target):(m.target??22);d.target=Math.max(17,Math.min(30,base+Number(b.dataset.delta)));d.dirty=this.draftChanged(m,d);d.error=null;this.patch();});
    const flap=content.querySelector("[data-flap]"); if(flap)flap.onclick=()=>{if(d.applying)return;if(d.swing==="off"){d.swing=this.activeSwingMode(m,d);localStorage.setItem(`nikas_climate.swing.${m.room.key}`,d.swing);}else{localStorage.setItem(`nikas_climate.swing.${m.room.key}`,d.swing);d.swing="off";}d.dirty=this.draftChanged(m,d);this.patch();};
    content.querySelectorAll("[data-feature]").forEach((b)=>b.onclick=()=>{if(d.applying)return;const key=b.dataset.feature;d[key]=d[key]==="on"?"off":"on";d.dirty=this.draftChanged(m,d);this.patch();});
    const apply=content.querySelector("[data-apply]"); if(apply)apply.onclick=()=>this.applyDraft(m,d);
  }

  async applyDraft(m,d) {
    if(!d.dirty||d.applying)return; d.applying=true; d.error=null; this.patch();
    try {
      if(m.target!=null&&Number(d.target)!==Number(m.target)) await this._hass.callService("climate","set_temperature",{entity_id:m.climate.entity_id,temperature:d.target});
      if(d.fan!==m.fan) await this._hass.callService("climate","set_fan_mode",{entity_id:m.climate.entity_id,fan_mode:d.fan});
      if(d.swing!==m.swing) await this._hass.callService("climate","set_swing_mode",{entity_id:m.climate.entity_id,swing_mode:d.swing});
      for(const key of ["night","turbo"]) {
        if(m.features?.[key]!=null&&d[key]!==m.features[key]&&m.featureEntities?.[key]) await this._hass.callService("switch",d[key]==="on"?"turn_on":"turn_off",{entity_id:m.featureEntities[key]});
      }
      if(d.mode!==m.mode) await this._hass.callService("climate","set_hvac_mode",{entity_id:m.climate.entity_id,hvac_mode:d.mode});
      d.dirty=false;
    } catch(err) { d.applying=false; d.dirty=true; d.error=`Не удалось применить: ${err?.message||err}`; }
    this.patch();
  }

  async refreshSelected() {
    if(this._refreshing||!this._hass)return; this._refreshing=true; this.patch();
    try {
      const room=ROOMS.find((r)=>r.key===this._selected)||ROOMS[0]; const m=this.roomModel(room); const reg=this.registryEntry(m.climate?.entity_id);
      const entityIds=[m.climate?.entity_id,m.roomTempEntity,m.featureEntities?.night,m.featureEntities?.turbo].filter(Boolean);
      if(entityIds.length) await this._hass.callService("homeassistant","update_entity",{entity_id:entityIds}).catch(()=>null);
      if(reg?.config_entry_id) await this._hass.callService("homeassistant","reload_config_entry",{entry_id:reg.config_entry_id}).catch(()=>null);
      this._entityRegistry=null; this._areaRegistry=null; this._labelRegistry=null; delete this._history[room.key]; await this.ensureRegistries(true); await new Promise((r)=>setTimeout(r,900));
      const fresh=this.roomModel(room); await this.ensureHistory(fresh,true);
    } finally { this._refreshing=false; this.patch(); }
  }

  async ensureHistory(m,force=false) {
    if(!m?.roomTempEntity||!m?.climate?.entity_id||!this._hass?.callApi)return; const key=m.room.key; if(this._historyLoading[key]||(!force&&this._history[key]))return; this._historyLoading[key]=true;
    try {
      const end=new Date(); const start=new Date(end.getTime()-HISTORY_HOURS*3600000); const filter=encodeURIComponent(`${m.roomTempEntity},${m.climate.entity_id}`);
      const path=`history/period/${encodeURIComponent(start.toISOString())}?end_time=${encodeURIComponent(end.toISOString())}&filter_entity_id=${filter}&minimal_response=false&no_attributes=false`;
      const raw=await this._hass.callApi("GET",path); this._history[key]=this.parseHistory(raw,m);
    } catch(_err) { this._history[key]={room:[],target:[]}; }
    finally { this._historyLoading[key]=false; if(this._rendered&&this._tab==="summary"&&this._selected===key)this.patch(); }
  }

  parseHistory(raw,m) {
    const groups=Array.isArray(raw)?raw:[]; const room=[],target=[];
    for(const group of groups){for(const item of (Array.isArray(group)?group:[])){const ts=Date.parse(item.last_changed||item.last_updated);if(!Number.isFinite(ts))continue;if(item.entity_id===m.roomTempEntity){const v=Number(item.state);if(Number.isFinite(v))room.push([ts,v]);}else if(item.entity_id===m.climate?.entity_id){const v=Number(item.attributes?.temperature);if(Number.isFinite(v))target.push([ts,v]);}}}
    return {room,target};
  }

  historyCard(m) {
    const data=this._history[m.room.key]; const loading=this._historyLoading[m.room.key];
    if(loading&&!data)return `<div class="chart-card"><div class="chart-head"><strong>Температура · 24 ч</strong><small>Загрузка…</small></div><div class="chart-empty">Получаем историю Recorder</div></div>`;
    if(!data||!data.room?.length)return `<div class="chart-card"><div class="chart-head"><strong>Температура · 24 ч</strong><small>Recorder</small></div><div class="chart-empty">История пока недоступна</div></div>`;
    const all=[...data.room,...data.target]; const minT=Math.min(...all.map((p)=>p[0])), maxT=Math.max(...all.map((p)=>p[0])); let minV=Math.min(...all.map((p)=>p[1])), maxV=Math.max(...all.map((p)=>p[1])); if(maxV-minV<2){minV-=1;maxV+=1;}else{minV-=.5;maxV+=.5;}
    const path=(series)=>series.map(([t,v],i)=>`${i?"L":"M"}${this.scale(t,minT,maxT,4,96).toFixed(1)},${this.scale(v,minV,maxV,82,8).toFixed(1)}`).join(" ");
    return `<div class="chart-card"><div class="chart-head"><strong>Температура · 24 ч</strong><small>Комната ${this.fmt(m.roomTemp,1)}° · Уставка ${this.fmt(m.target,0)}°</small></div><div class="chart-wrap"><svg viewBox="0 0 100 90" preserveAspectRatio="none"><line class="chart-grid" x1="4" y1="8" x2="96" y2="8"/><line class="chart-grid" x1="4" y1="45" x2="96" y2="45"/><line class="chart-grid" x1="4" y1="82" x2="96" y2="82"/><path class="chart-room" d="${path(data.room)}"/>${data.target?.length?`<path class="chart-target" d="${path(data.target)}"/>`:""}</svg></div><div class="chart-legend"><span><i class="chart-dot"></i>Температура помещения</span>${data.target?.length?`<span><i class="chart-dot target"></i>Уставка</span>`:""}</div></div>`;
  }

  scale(v,a,b,outA,outB){if(!Number.isFinite(v)||a===b)return(outA+outB)/2;return outA+(v-a)*(outB-outA)/(b-a);}
}

customElements.define("nikas-climate-panel",NikasClimatePanel);
