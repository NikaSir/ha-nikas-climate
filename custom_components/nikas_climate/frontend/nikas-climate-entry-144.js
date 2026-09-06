import "./nikas-climate-entry-143.js?v=1.4.3";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.4.4";

const MODE_META = {
  off:["Выключено","mdi:power"],
  cool:["Охлаждение","mdi:snowflake"],
  heat:["Обогрев","mdi:fire"],
  auto:["Авто","mdi:autorenew"],
  dry:["Осушение","mdi:water-percent"],
  fan_only:["Вентиляция","mdi:fan"],
  unavailable:["Нет данных","mdi:lan-disconnect"]
};

const esc = (v) => String(v ?? "—")
  .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const list = (v) => Array.isArray(v) ? v : [];
const fmtTime = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("ru-RU", {hour:"2-digit",minute:"2-digit",second:"2-digit",day:"2-digit",month:"2-digit"});
};

if (Panel && !Panel.prototype.__nikasUi144Patched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;
  const previousBindControls = Panel.prototype.bindControls;
  const previousRunCommand = Panel.prototype._runCommand;

  Panel.prototype.__commandJournal144 = Panel.prototype.__commandJournal144 || [];

  if (typeof previousRunCommand === "function") {
    Panel.prototype._runCommand = async function(m, kind, value, serviceCall) {
      const started = new Date();
      const result = await previousRunCommand.call(this, m, kind, value, serviceCall);
      const entry = {
        at: started.toISOString(), room:m?.room?.title || "—", kind, value,
        ok:Boolean(result?.ok), late:Boolean(result?.late), timeout:Boolean(result?.timeout),
        message:result?.message || ""
      };
      this.__commandJournal144 = [entry, ...(this.__commandJournal144 || [])].slice(0,10);
      return result;
    };
  }

  Panel.prototype.activeSwingMode = function(m, draft=null) {
    const current = draft?.swing || m?.swing;
    if (current && !["off","—","unknown","unavailable"].includes(current)) return current;
    const modes = list(m?.climate?.attributes?.swing_modes).filter((x) => x && x !== "off");
    // Conservative default for Lagoon: vertical is the only direction confirmed by the physical unit.
    if (modes.includes("vertical")) return "vertical";
    const remembered = localStorage.getItem(`nikas_climate.swing.${m?.room?.key || "default"}`);
    if (remembered && modes.includes(remembered)) return remembered;
    return modes[0] || "off";
  };

  Panel.prototype.summary = function(m) {
    const mode = MODE_META[m?.mode] || MODE_META.unavailable;
    const delta = m?.roomTemp != null && m?.indoor != null ? Number(m.indoor) - Number(m.roomTemp) : null;
    const deltaText = Number.isFinite(delta) ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)} °C` : "—";
    const roomSensor = m?.roomTempEntity ? esc(m.roomTempEntity) : "Источник не найден";
    const fan = this.fanLabel(m?.fan);
    const flap = this.flapLabel(m?.swing);
    const night = this.boolLabel(m?.features?.night);
    const turbo = this.boolLabel(m?.features?.turbo);
    return `<section class="card u144-summary">
      <div class="u144-summary-top">
        <div class="u144-hero-wrap"><img class="u136-ac-photo" src="" alt=""/></div>
        ${this.connectionPlaque(m)}
      </div>
      <div class="u144-metrics">
        <div class="u144-metric primary"><ha-icon icon="mdi:thermometer"></ha-icon><span>Температура помещения</span><strong>${this.fmt(m?.roomTemp,1)}°</strong><small>${roomSensor}</small></div>
        <div class="u144-metric"><ha-icon icon="mdi:water-outline"></ha-icon><span>Влажность</span><strong>${this.fmt(m?.humidity,0)}%</strong><small>Комнатный датчик</small></div>
        <div class="u144-metric"><ha-icon icon="mdi:thermometer-check-outline"></ha-icon><span>Уставка</span><strong>${this.fmt(m?.target,0)}°</strong><small>Целевая температура</small></div>
        <div class="u144-metric"><ha-icon icon="mdi:air-conditioner"></ha-icon><span>У кондиционера</span><strong>${this.fmt(m?.indoor,1)}°</strong><small>Датчик внутреннего блока</small></div>
      </div>
      <div class="u144-report-title">Работа сейчас</div>
      <div class="u144-status-grid">
        <div class="u144-status main"><ha-icon icon="${mode[1]}"></ha-icon><span>Режим</span><strong>${mode[0]}</strong></div>
        <div class="u144-status"><ha-icon icon="${this.fanIcon(m?.fan)}"></ha-icon><span>Вентилятор</span><strong>${esc(fan)}</strong></div>
        <div class="u144-status"><ha-icon icon="${this.flapIcon(m?.swing)}"></ha-icon><span>Створка</span><strong>${esc(flap)}</strong></div>
        <div class="u144-status ${m?.features?.night === "on" ? "active" : ""}"><ha-icon icon="mdi:weather-night"></ha-icon><span>Ночной</span><strong>${night}</strong></div>
        <div class="u144-status ${m?.features?.turbo === "on" ? "active" : ""}"><ha-icon icon="mdi:rocket-launch-outline"></ha-icon><span>Турбо</span><strong>${turbo}</strong></div>
        <div class="u144-status"><ha-icon icon="mdi:thermometer-lines"></ha-icon><span>Δ датчиков</span><strong>${deltaText}</strong></div>
      </div>
      <div class="u144-source-note"><ha-icon icon="mdi:information-outline"></ha-icon><span>Фактическая температура берётся только с выбранного комнатного датчика; уставка не используется как измерение.</span></div>
    </section>`;
  };

  Panel.prototype.diagnostics = function(m) {
    const h = this.health(m);
    const climate = m?.climate;
    const attrs = climate?.attributes || {};
    const climateReg = this.registryEntry(climate?.entity_id);
    const hvacModes = list(attrs.hvac_modes);
    const fanModes = list(attrs.fan_modes);
    const swingModes = list(attrs.swing_modes);
    const supported = Number(attrs.supported_features || 0);
    const rssi = attrs.rssi ?? attrs.signal_strength ?? attrs.wifi_rssi ?? null;
    const tempCoincides = m?.indoor != null && m?.target != null && Math.abs(Number(m.indoor)-Number(m.target)) < 0.01;
    const journal = (this.__commandJournal144 || []).map((e) => `<div class="u144-log"><span>${fmtTime(e.at)}</span><strong>${esc(e.kind)} → ${esc(e.value)}</strong><em class="${e.ok ? "ok" : "bad"}">${e.ok ? (e.late ? "подтверждено поздно" : "подтверждено") : (e.timeout ? "нет подтверждения" : "ошибка")}</em></div>`).join("");
    const row = (name,value) => `<div class="row"><span>${name}</span><strong>${value}</strong></div>`;
    return `<section class="card u144-diag"><div class="page-head"><div class="section-title">Диагностика</div><div class="area">${esc(m?.room?.title)}</div></div>
      ${row("Состояние устройства",esc(h.label))}
      ${row("Канал","Syncleo UDP / LAN")}
      ${row("WAN","Не требуется")}
      ${row("Climate entity",esc(climate?.entity_id || "не найден"))}
      ${row("Config entry",esc(climateReg?.config_entry_id || "—"))}
      ${row("Комнатный датчик",esc(m?.roomTempEntity || "не найден"))}
      ${row("Температура помещения",`${this.fmt(m?.roomTemp,1)} °C`)}
      ${row("Температура кондиционера",`${this.fmt(m?.indoor,1)} °C${tempCoincides ? " · совпадает с уставкой" : ""}`)}
      ${row("Уставка",`${this.fmt(m?.target,1)} °C`)}
      ${row("Режим",esc(this.modeLabel(m?.mode)))}
      ${row("Вентилятор",esc(this.fanLabel(m?.fan)))}
      ${row("Створка",esc(this.flapLabel(m?.swing)))}
      ${row("HVAC modes",esc(hvacModes.length ? hvacModes.join(", ") : "не объявлены"))}
      ${row("Fan modes",esc(fanModes.length ? fanModes.join(", ") : "не объявлены"))}
      ${row("Swing modes",esc(swingModes.length ? swingModes.join(", ") : "не объявлены"))}
      ${row("Supported features",String(supported))}
      ${row("RSSI",rssi == null ? "—" : `${esc(rssi)} dBm`)}
      ${row("Обновлено",fmtTime(climate?.last_updated))}
      ${row("Ночной режим",this.boolLabel(m?.features?.night))}
      ${row("Турбо",this.boolLabel(m?.features?.turbo))}
      ${row("Замок от детей",this.boolLabel(m?.features?.childLock))}
      ${row("Звук",this.boolLabel(m?.features?.volume))}
      ${row("Контроль доступа",this.boolLabel(m?.features?.accessControl))}
      ${row("Подсветка",this.boolLabel(m?.features?.backlight))}
      ${row("Ошибка",this.boolLabel(m?.features?.error,"Есть","Нет"))}
      <div class="u144-diag-title">Функции без подтверждённого локального управления</div>
      <div class="u144-pending"><span>Ионизация / FRESH</span><strong>не активировать</strong></div>
      <div class="u144-pending"><span>Самоочистка / CLEAN</span><strong>не активировать</strong></div>
      <div class="u144-pending"><span>FOLLOW ME</span><strong>не активировать</strong></div>
      <div class="u144-pending"><span>Дисплей внутреннего блока</span><strong>только чтение / проверить команду</strong></div>
      <div class="u144-diag-title">Последние команды</div>
      ${journal || '<p class="notice">Команд в текущем сеансе панели ещё не было.</p>'}
      <p class="notice">Если «Температура кондиционера» после изменения уставки мгновенно становится равной уставке, проверить установленную версию Syncleo: в исследованном коде обнаружено присваивание уставки в current_temperature. Интерфейс это значение не подменяет.</p>
    </section>`;
  };

  Panel.prototype.bindControls = function(m) {
    previousBindControls.call(this,m);
    const content = this.shadowRoot?.getElementById("content");
    if (!content || !m?.climate || this._tab !== "control") return;
    const d = this.draftFor(m);
    const attrs = m.climate.attributes || {};
    const hvacModes = list(attrs.hvac_modes);
    const fanModes = list(attrs.fan_modes);
    const swingModes = list(attrs.swing_modes);

    if (hvacModes.length) content.querySelectorAll("[data-mode]").forEach((b) => {
      const ok = hvacModes.includes(b.dataset.mode);
      b.disabled = b.disabled || !ok;
      b.classList.toggle("unsupported-state",!ok);
      if (!ok) b.title = "Не объявлено установленной climate-сущностью";
    });
    if (fanModes.length) content.querySelectorAll("[data-fan]").forEach((b) => {
      const ok = fanModes.includes(b.dataset.fan);
      b.disabled = b.disabled || !ok;
      b.classList.toggle("unsupported-state",!ok);
      if (!ok) b.title = "Не объявлено установленной climate-сущностью";
    });

    content.querySelectorAll("[data-delta]").forEach((b) => b.onclick = () => {
      if (d.applying) return;
      const step = Number(attrs.target_temp_step) || 1;
      const min = Number.isFinite(Number(attrs.min_temp)) ? Number(attrs.min_temp) : 17;
      const max = Number.isFinite(Number(attrs.max_temp)) ? Number(attrs.max_temp) : 30;
      const base = Number.isFinite(Number(d.target)) ? Number(d.target) : (m.target ?? 22);
      const next = Math.max(min,Math.min(max,base + Number(b.dataset.delta) * step));
      d.target = Math.round(next / step) * step;
      d.dirty = this.draftChanged(m,d); d.error = null; this.patch();
    });

    const flap = content.querySelector("[data-flap]");
    if (flap) {
      const canSwing = this.supportsSwingCommand?.(m) && swingModes.some((x) => x !== "off");
      flap.disabled = flap.disabled || !canSwing;
      flap.classList.toggle("unsupported-state",!canSwing);
      if (!canSwing) flap.title = "Качание не объявлено установленной climate-сущностью";
      else flap.onclick = () => {
        if (d.applying) return;
        if (d.swing === "off") {
          d.swing = this.activeSwingMode(m,d);
          if (d.swing !== "off") localStorage.setItem(`nikas_climate.swing.${m.room.key}`,d.swing);
        } else {
          localStorage.setItem(`nikas_climate.swing.${m.room.key}`,d.swing);
          d.swing = "off";
        }
        d.dirty = this.draftChanged(m,d); d.error = null; this.patch();
      };
    }
  };

  Panel.prototype.__installNikasUi144 = function() {
    const root = this.shadowRoot;
    if (!root || root.querySelector("style[data-nikas-ui144]")) return;
    const style = document.createElement("style");
    style.dataset.nikasUi144 = "1";
    style.textContent = `
      .u144-summary{height:100%;min-height:0;overflow:hidden;display:flex;flex-direction:column;gap:8px;padding:12px 14px!important;margin:0!important}
      .u144-summary-top{display:grid;grid-template-columns:minmax(0,1fr) 154px;gap:10px;align-items:center;height:154px;min-height:154px}
      .u144-hero-wrap{height:150px;display:flex;align-items:center;justify-content:center;overflow:visible}.u144-hero-wrap .u136-ac-photo{width:100%;height:145px;opacity:0}
      .u144-summary .connection-indicator{width:154px;min-width:154px;max-width:154px}
      .u144-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.u144-metric{min-width:0;height:98px;border:1px solid color-mix(in srgb,var(--primary-color) 22%,var(--divider-color));border-radius:18px;background:color-mix(in srgb,var(--primary-color) 5%,var(--card-background-color));padding:8px;display:grid;grid-template-columns:auto 1fr;grid-template-areas:"i l" "v v" "s s";align-items:center;column-gap:5px}.u144-metric ha-icon{grid-area:i;--mdc-icon-size:21px;color:var(--primary-color)}.u144-metric span{grid-area:l;font-size:10px;color:var(--secondary-text-color)}.u144-metric strong{grid-area:v;font-size:27px;line-height:1.05;text-align:center}.u144-metric small{grid-area:s;min-width:0;font-size:9px;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center}
      .u144-report-title{font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--secondary-text-color)}
      .u144-status-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.u144-status{height:66px;border:1px solid color-mix(in srgb,var(--divider-color) 75%,transparent);border-radius:16px;padding:6px 8px;display:grid;grid-template-columns:30px 1fr;grid-template-rows:auto auto;align-items:center}.u144-status ha-icon{grid-row:1/3;--mdc-icon-size:25px}.u144-status span{font-size:9px;color:var(--secondary-text-color)}.u144-status strong{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.u144-status.main,.u144-status.active{color:var(--primary-color);border-color:color-mix(in srgb,var(--primary-color) 50%,var(--divider-color));background:color-mix(in srgb,var(--primary-color) 8%,var(--card-background-color))}
      .u144-source-note{margin-top:auto;min-height:44px;border-radius:15px;background:color-mix(in srgb,var(--primary-color) 6%,var(--card-background-color));display:flex;align-items:center;gap:9px;padding:8px 12px;color:var(--secondary-text-color);font-size:10px}.u144-source-note ha-icon{color:var(--primary-color);--mdc-icon-size:21px}
      .unsupported-state{opacity:.38!important;filter:grayscale(1)!important}.u144-diag-title{margin-top:14px;padding-top:10px;border-top:1px solid var(--divider-color);font-size:12px;font-weight:800;text-transform:uppercase;color:var(--secondary-text-color)}.u144-pending{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);font-size:11px}.u144-pending strong{font-weight:700;color:var(--secondary-text-color);text-align:right}.u144-log{display:grid;grid-template-columns:82px minmax(0,1fr) auto;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent);font-size:10px}.u144-log span{color:var(--secondary-text-color)}.u144-log strong{min-width:0;overflow:hidden;text-overflow:ellipsis}.u144-log em{font-style:normal;font-weight:700}.u144-log em.ok{color:var(--success-color,#43a047)}.u144-log em.bad{color:var(--error-color,#db4437)}
      @media(max-width:520px){.u144-summary-top{grid-template-columns:minmax(0,1fr) 146px}.u144-summary .connection-indicator{width:146px;min-width:146px}.u144-metric strong{font-size:24px}.u144-status-grid{gap:6px}}
    `;
    root.appendChild(style);
  };

  Panel.prototype.__fixNikasUi144 = function() {
    const root = this.shadowRoot;
    if (!root) return;
    const version = root.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    root.querySelector(".viewport")?.classList.toggle("summary-fit",this._tab === "summary");
    this.__installNikasUi144();
    this.__renderAcHero143?.();
  };

  Panel.prototype.render = function(...args) {
    const result = previousRender.apply(this,args);
    this.__fixNikasUi144();
    return result;
  };
  Panel.prototype.patch = function(...args) {
    const result = previousPatch.apply(this,args);
    this.__fixNikasUi144();
    return result;
  };

  Panel.prototype.__nikasUi144Patched = true;
}
