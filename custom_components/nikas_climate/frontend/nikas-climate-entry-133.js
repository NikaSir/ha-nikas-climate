import "./nikas-climate-entry-131.js?v=1.3.1";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.3.2";
const HOURS = 24;

if (Panel && !Panel.prototype.__nikasUi132FinalPatched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;
  const previousRoomModel = Panel.prototype.roomModel;

  Panel.prototype.isHumidityEntity = function (state) {
    if (!state?.entity_id?.startsWith("sensor.")) return false;
    return state.attributes?.device_class === "humidity" || state.attributes?.unit_of_measurement === "%";
  };

  Panel.prototype.resolveRoomHumidityEntity = function (room, climate) {
    if (!this._hass) return null;
    const candidates = Object.values(this._hass.states).filter((s) => this.isHumidityEntity(s));
    const explicit = `sensor.sensor_th_zb_${room.key === "living" ? "11" : "14"}_humidity`;
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
    const humidityState = humidityEntity ? this._hass?.states?.[humidityEntity] : null;
    const humidityRaw = Number(humidityState?.state);
    return {...m, humidityEntity, humidity: Number.isFinite(humidityRaw) ? humidityRaw : null};
  };

  Panel.prototype.summary = function (m) {
    const delta = m.roomTemp != null && m.indoor != null ? m.indoor - m.roomTemp : null;
    const deltaText = delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} °C`;
    const night = this.boolLabel(m.features?.night), turbo = this.boolLabel(m.features?.turbo);
    return `<section class="card hero summary-approved">
      <div class="summary-visual-row">
        <div class="ac-visual"><img src="/nikas_climate_panel/assets/ballu-lagoon.svg" alt="Ballu Lagoon"/></div>
        ${this.connectionPlaque(m)}
      </div>
      <div class="climate-core"><div class="primary-temp"><span class="eyebrow">Температура помещения</span><strong class="temp-main">${this.fmt(m.roomTemp,1)}°</strong><small class="temp-sub">Контрольный датчик помещения</small></div><div class="metric-stack"><div class="metric"><span>Уставка</span><strong>${this.fmt(m.target,0)} °C</strong><small>Целевая температура</small></div><div class="metric"><span>Внутренний блок</span><strong>${this.fmt(m.indoor,0)} °C</strong><small>Датчик кондиционера</small></div></div></div>
      <div class="report-title">Режим работы</div><div class="status-strip">
        <div class="status-item"><ha-icon icon="${this.modeIcon(m.mode)}"></ha-icon><span>Режим</span><strong>${this.modeLabel(m.mode)}</strong></div>
        <div class="status-item"><ha-icon icon="${this.fanIcon(m.fan)}"></ha-icon><span>Вентилятор</span><strong>${this.fanLabel(m.fan)}</strong></div>
        <div class="status-item"><ha-icon icon="${this.flapIcon(m.swing)}"></ha-icon><span>Створка</span><strong>${this.flapLabel(m.swing)}</strong></div>
        <div class="status-item ${m.features?.night === "on" ? "active" : ""}"><ha-icon icon="mdi:weather-night"></ha-icon><span>Ночной</span><strong>${night}</strong></div>
        <div class="status-item ${m.features?.turbo === "on" ? "active" : ""}"><ha-icon icon="mdi:rocket-launch-outline"></ha-icon><span>Турбо</span><strong>${turbo}</strong></div>
        <div class="status-item"><ha-icon icon="mdi:thermometer-lines"></ha-icon><span>Δ датчиков</span><strong>${deltaText}</strong></div>
      </div>
    </section>`;
  };

  Panel.prototype.ensureHistory = async function (m, force=false) {
    if (!m?.roomTempEntity || !m?.climate?.entity_id || !this._hass?.callApi) return;
    const key = m.room.key;
    if (this._historyLoading[key] || (!force && this._history[key])) return;
    this._historyLoading[key] = true;
    try {
      const end = new Date();
      const start = new Date(end.getTime() - HOURS * 3600000);
      const ids = [m.roomTempEntity, m.climate.entity_id, m.humidityEntity].filter(Boolean);
      const filter = encodeURIComponent(ids.join(","));
      const path = `history/period/${encodeURIComponent(start.toISOString())}?end_time=${encodeURIComponent(end.toISOString())}&filter_entity_id=${filter}&minimal_response=false&no_attributes=false`;
      const raw = await this._hass.callApi("GET", path);
      this._history[key] = this.parseHistory(raw, m);
    } catch (_err) {
      this._history[key] = {room:[], target:[], humidity:[]};
    } finally {
      this._historyLoading[key] = false;
      if (this._rendered && this._selected === key && this._tab === "statistics") this.patch();
    }
  };

  Panel.prototype.parseHistory = function (raw, m) {
    const groups = Array.isArray(raw) ? raw : [];
    const room = [], target = [], humidity = [];
    for (const group of groups) {
      for (const item of (Array.isArray(group) ? group : [])) {
        const ts = Date.parse(item.last_changed || item.last_updated);
        if (!Number.isFinite(ts)) continue;
        if (item.entity_id === m.roomTempEntity) {
          const v = Number(item.state); if (Number.isFinite(v)) room.push([ts,v]);
        } else if (item.entity_id === m.climate?.entity_id) {
          const v = Number(item.attributes?.temperature); if (Number.isFinite(v)) target.push([ts,v]);
        } else if (item.entity_id === m.humidityEntity) {
          const v = Number(item.state); if (Number.isFinite(v)) humidity.push([ts,v]);
        }
      }
    }
    return {room,target,humidity};
  };

  Panel.prototype.statsChart = function (title, current, series, target=null) {
    const all = [...(series || []), ...(target || [])];
    if (!all.length) return `<div class="chart-card stat-chart"><div class="chart-head"><strong>${title}</strong><small>${current}</small></div><div class="chart-empty">История пока недоступна</div></div>`;
    const minT = Math.min(...all.map((p)=>p[0])), maxT = Math.max(...all.map((p)=>p[0]));
    let minV = Math.min(...all.map((p)=>p[1])), maxV = Math.max(...all.map((p)=>p[1]));
    const pad = Math.max(1, (maxV-minV)*0.12); minV -= pad; maxV += pad;
    const path = (arr) => arr.map(([t,v],i)=>`${i?"L":"M"}${this.scale(t,minT,maxT,4,96).toFixed(1)},${this.scale(v,minV,maxV,82,8).toFixed(1)}`).join(" ");
    return `<div class="chart-card stat-chart"><div class="chart-head"><strong>${title}</strong><small>${current}</small></div><div class="chart-wrap"><svg viewBox="0 0 100 90" preserveAspectRatio="none"><line class="chart-grid" x1="4" y1="8" x2="96" y2="8"/><line class="chart-grid" x1="4" y1="45" x2="96" y2="45"/><line class="chart-grid" x1="4" y1="82" x2="96" y2="82"/><path class="chart-room" d="${path(series)}"/>${target?.length?`<path class="chart-target" d="${path(target)}"/>`:""}</svg></div><div class="chart-legend"><span><i class="chart-dot"></i>${title.startsWith("Влаж")?"Влажность помещения":"Температура помещения"}</span>${target?.length?`<span><i class="chart-dot target"></i>Уставка</span>`:""}</div></div>`;
  };

  Panel.prototype.statistics = function (m) {
    const data = this._history[m.room.key];
    const loading = this._historyLoading[m.room.key];
    if (!data && !loading) queueMicrotask(() => this.ensureHistory(m));
    return `<section class="card statistics-card">
      <div class="stats-head"><div class="section-title">Статистика</div><div class="stats-current"><span>Температура <strong>${this.fmt(m.roomTemp,1)} °C</strong></span><span>Влажность <strong>${this.fmt(m.humidity,0)} %</strong></span></div></div>
      ${loading && !data ? `<div class="chart-card"><div class="chart-empty">Получаем историю Recorder…</div></div>` : this.statsChart("Температура · 24 ч", `Сейчас ${this.fmt(m.roomTemp,1)}° · Уставка ${this.fmt(m.target,0)}°`, data?.room || [], data?.target || [])}
      ${this.statsChart("Влажность · 24 ч", `Сейчас ${this.fmt(m.humidity,0)} %`, data?.humidity || [])}
    </section>`;
  };

  Panel.prototype.render = function (...args) {
    const result = previousRender.apply(this, args);
    const root = this.shadowRoot;
    const version = root?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    if (root && !root.querySelector("style[data-nikas-ui132final]")) {
      const style = document.createElement("style");
      style.dataset.nikasUi132final = "1";
      style.textContent = `
        .summary-approved{padding:12px 14px!important;margin-bottom:0!important;}
        .summary-visual-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(160px,39%);gap:10px;align-items:center;min-height:104px;}
        .ac-visual{height:104px;min-width:0;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:18px;background:linear-gradient(180deg,color-mix(in srgb,var(--primary-color) 3%,var(--card-background-color)),var(--card-background-color));}
        .ac-visual img{display:block;width:100%;height:100%;object-fit:contain;object-position:center;}
        .summary-approved .connection-indicator{min-height:64px;}
        .summary-approved .climate-core{margin-top:9px;}
        .summary-approved .primary-temp{min-height:132px;padding:13px 15px;}
        .summary-approved .temp-main{font-size:52px;}
        .summary-approved .metric{padding:10px 12px;}
        .summary-approved .metric strong{font-size:22px;}
        .summary-approved .report-title{margin-top:10px;}
        .summary-approved .status-strip{margin-top:6px;gap:7px;}
        .summary-approved .status-item{min-height:74px;padding:7px 5px;}
        .summary-approved .status-item ha-icon{--mdc-icon-size:22px;margin-bottom:3px;}
        .statistics-card{margin-bottom:0!important;}
        .stats-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:10px;}
        .stats-current{display:flex;gap:14px;flex-wrap:wrap;justify-content:flex-end;font-size:12px;color:var(--secondary-text-color);}
        .stats-current strong{color:var(--primary-text-color);font-size:14px;margin-left:4px;}
        .stat-chart{margin-top:10px;}
        .stat-chart .chart-wrap{height:150px;}
        @media(max-width:480px){
          .summary-visual-row{grid-template-columns:minmax(0,1fr) minmax(145px,38%);min-height:90px;}
          .ac-visual{height:90px;}
          .summary-approved .climate-core{grid-template-columns:minmax(0,1.45fr) minmax(0,.75fr);}
          .summary-approved .primary-temp{min-height:118px;}
          .summary-approved .temp-main{font-size:48px;}
          .summary-approved .status-item{min-height:68px;}
          .stats-head{display:block}.stats-current{justify-content:flex-start;margin-top:7px;}
        }
      `;
      root.appendChild(style);
    }
    return result;
  };

  Panel.prototype.patch = function (...args) {
    const result = previousPatch.apply(this, args);
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    return result;
  };

  Panel.prototype.__nikasUi132FinalPatched = true;
}
