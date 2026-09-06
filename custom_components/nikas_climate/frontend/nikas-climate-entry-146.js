import "./nikas-climate-entry-145.js?v=1.4.5";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.4.6";

const MODE_META_146 = {
  off: ["Выключен", "mdi:power"],
  cool: ["Охлаждение", "mdi:snowflake"],
  heat: ["Обогрев", "mdi:fire"],
  auto: ["Авто", "mdi:autorenew"],
  dry: ["Осушение", "mdi:water-percent"],
  fan_only: ["Вентиляция", "mdi:fan"],
  unavailable: ["Нет данных", "mdi:lan-disconnect"],
};

const esc146 = (v) => String(v ?? "—")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

if (Panel && !Panel.prototype.__nikasUi146Patched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;

  Panel.prototype.summary = function (m) {
    const mode = MODE_META_146[m?.mode] || MODE_META_146.unavailable;
    const fan = this.fanLabel(m?.fan);
    const flap = this.flapLabel(m?.swing);
    const nightOn = m?.features?.night === "on";
    const turboOn = m?.features?.turbo === "on";
    const submode = turboOn ? "Турбо" : (nightOn ? "Ночной режим" : "");
    const delta = m?.roomTemp != null && m?.indoor != null
      ? Number(m.indoor) - Number(m.roomTemp)
      : null;
    const deltaText = Number.isFinite(delta)
      ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)} °C`
      : "—";
    const modeClass = `mode-${m?.mode || "unavailable"}`;

    return `<section class="card u146-summary ${modeClass}">
      <div class="u146-hero-card">
        <div class="u146-headline">
          <div class="u146-mode-copy">
            <ha-icon icon="${mode[1]}"></ha-icon>
            <div>
              <strong>${esc146(mode[0])}</strong>
              ${submode ? `<span>${esc146(submode)}</span>` : ""}
            </div>
          </div>
          ${this.connectionPlaque(m)}
        </div>
        <div class="u146-scene">
          <div class="u146-wall-glow"></div>
          <div class="u146-plant"><i></i><i></i><i></i><i></i><i></i></div>
          <div class="u146-room-shape"></div>
          <div class="u146-unit-wrap"><img class="u136-ac-photo" src="" alt="" /></div>
        </div>
      </div>

      <div class="u146-metrics">
        <div class="u146-metric"><ha-icon icon="mdi:thermometer"></ha-icon><div><span>Температура помещения</span><strong>${this.fmt(m?.roomTemp,1)}°</strong><small>Комнатный датчик</small></div></div>
        <div class="u146-metric"><ha-icon icon="mdi:water-outline"></ha-icon><div><span>Влажность</span><strong>${this.fmt(m?.humidity,0)}%</strong><small>Комнатный датчик</small></div></div>
        <div class="u146-metric"><ha-icon icon="mdi:thermometer-check-outline"></ha-icon><div><span>Уставка</span><strong>${this.fmt(m?.target,0)}°</strong><small>Целевая температура</small></div></div>
        <div class="u146-metric"><ha-icon icon="mdi:air-conditioner"></ha-icon><div><span>У кондиционера</span><strong>${this.fmt(m?.indoor,1)}°</strong><small>Датчик внутреннего блока</small></div></div>
      </div>

      <div class="u146-status-band">
        <div class="u146-status"><ha-icon icon="${mode[1]}"></ha-icon><div><span>Режим</span><strong>${esc146(mode[0])}</strong><small>${m?.mode === "off" ? "Не работает" : "Работает"}</small></div></div>
        <div class="u146-status"><ha-icon icon="${this.fanIcon(m?.fan)}"></ha-icon><div><span>Вентилятор</span><strong>${esc146(fan)}</strong><small>Текущая скорость</small></div></div>
        <div class="u146-status"><ha-icon icon="mdi:blinds-horizontal"></ha-icon><div><span>Створка</span><strong>${esc146(flap)}</strong><small>${m?.swing === "off" ? "Качание выключено" : "Качание включено"}</small></div></div>
      </div>

      <div class="u146-status-band">
        <div class="u146-status ${nightOn ? "active" : ""}"><ha-icon icon="mdi:weather-night"></ha-icon><div><span>Ночной</span><strong>${nightOn ? "Вкл." : "Выкл."}</strong></div></div>
        <div class="u146-status ${turboOn ? "active" : ""}"><ha-icon icon="mdi:rocket-launch-outline"></ha-icon><div><span>Турбо</span><strong>${turboOn ? "Вкл." : "Выкл."}</strong></div></div>
        <div class="u146-status"><ha-icon icon="mdi:thermometer-lines"></ha-icon><div><span>Δ датчиков</span><strong>${deltaText}</strong></div></div>
      </div>

      <div class="u146-note"><ha-icon icon="mdi:information-outline"></ha-icon><span>Фактическая температура берётся только с выбранного комнатного датчика; уставка не используется как измерение.</span></div>
    </section>`;
  };

  Panel.prototype.__installNikasUi146 = function () {
    const root = this.shadowRoot;
    if (!root || root.querySelector("style[data-nikas-ui146]")) return;
    const style = document.createElement("style");
    style.dataset.nikasUi146 = "1";
    style.textContent = `
      .u146-summary{height:100%;min-height:0;overflow:hidden;box-sizing:border-box;display:flex;flex-direction:column;gap:10px;padding:12px 14px!important;margin:0!important}
      .u146-hero-card{position:relative;border-radius:24px;overflow:hidden;background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(127,127,127,.035));min-height:330px}
      .u146-headline{position:absolute;z-index:5;left:18px;right:18px;top:16px;display:grid;grid-template-columns:minmax(0,1fr) 174px;gap:12px;align-items:start}
      .u146-mode-copy{display:flex;align-items:flex-start;gap:10px;min-width:0;padding-top:4px}.u146-mode-copy ha-icon{--mdc-icon-size:38px;color:var(--primary-color);margin-top:2px}.u146-mode-copy>div{min-width:0;display:flex;flex-direction:column}.u146-mode-copy strong{font-size:30px;line-height:1;font-weight:800;color:var(--primary-color)}.u146-mode-copy span{font-size:19px;line-height:1.1;font-weight:700;margin-top:7px;color:var(--primary-text-color)}
      .u146-headline .connection-plaque,.u146-headline .conn-plaque,.u146-headline [class*="connection"]{justify-self:end}
      .u146-scene{position:absolute;inset:0;padding-top:82px;overflow:hidden;background:linear-gradient(180deg,rgba(227,241,247,.5),rgba(250,250,250,.12) 55%,rgba(216,207,191,.08));display:flex;align-items:center;justify-content:center}
      .u146-wall-glow{position:absolute;inset:82px 0 0;background:radial-gradient(circle at 65% 34%,rgba(255,255,255,.55),transparent 36%),linear-gradient(90deg,rgba(226,235,228,.18),rgba(226,236,244,.11));}
      .u146-room-shape{position:absolute;right:-6%;bottom:-3%;width:46%;height:66%;border-radius:50% 0 0 0;background:linear-gradient(150deg,rgba(226,226,221,.18),rgba(181,171,157,.08));}
      .u146-plant{position:absolute;left:2%;bottom:3%;width:88px;height:135px;opacity:.28}.u146-plant:after{content:"";position:absolute;left:40px;bottom:0;width:9px;height:82px;border-radius:9px;background:var(--primary-text-color);transform:rotate(-5deg)}.u146-plant i{position:absolute;width:44px;height:23px;border-radius:70% 10% 70% 10%;background:var(--primary-text-color);transform-origin:100% 50%}.u146-plant i:nth-child(1){left:0;top:25px;transform:rotate(22deg)}.u146-plant i:nth-child(2){left:17px;top:8px;transform:rotate(54deg)}.u146-plant i:nth-child(3){left:4px;top:60px;transform:rotate(7deg)}.u146-plant i:nth-child(4){left:33px;top:43px;transform:rotate(106deg)}.u146-plant i:nth-child(5){left:25px;top:76px;transform:rotate(126deg)}
      .u146-unit-wrap{position:relative;z-index:2;width:82%;height:230px;display:flex;align-items:center;justify-content:center;margin-top:36px}.u146-unit-wrap .nikas-ac-hero{width:100%!important;height:230px!important;min-height:230px!important}.u146-unit-wrap .nikas-ac-unit{width:min(92%,620px)!important;height:124px!important;border-radius:29px 29px 18px 18px!important;box-shadow:0 18px 34px rgba(0,0,0,.12)!important}.u146-unit-wrap .nikas-ac-brand{top:32px!important;font-size:29px!important}.u146-unit-wrap .nikas-ac-display{top:23px!important;right:34px!important;font-size:24px!important}.u146-unit-wrap .nikas-ac-state-icon{left:26px!important;top:23px!important;--mdc-icon-size:28px!important}.u146-unit-wrap .nikas-ac-outlet{bottom:10px!important;height:23px!important}.u146-unit-wrap .nikas-ac-flap{bottom:-5px!important;height:12px!important}.u146-unit-wrap .nikas-ac-air{top:124px!important;height:88px!important;left:13%!important;right:13%!important}
      .u146-summary.mode-off .u146-unit-wrap{filter:saturate(.22) opacity(.84)}.u146-summary.mode-off .nikas-ac-air{opacity:0!important}.u146-summary.mode-cool .u146-scene{background:linear-gradient(180deg,rgba(224,243,250,.7),rgba(250,250,250,.08))}.u146-summary.mode-heat .u146-scene{background:linear-gradient(180deg,rgba(255,238,225,.56),rgba(250,250,250,.08))}.u146-summary.mode-dry .u146-scene{background:linear-gradient(180deg,rgba(232,244,246,.5),rgba(250,250,250,.08))}
      .u146-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--divider-color);border-radius:22px;background:var(--card-background-color);overflow:hidden}
      .u146-metric{min-width:0;display:flex;align-items:center;gap:8px;padding:11px 10px;position:relative}.u146-metric+.u146-metric:before{content:"";position:absolute;left:0;top:12px;bottom:12px;width:1px;background:var(--divider-color)}.u146-metric ha-icon{flex:0 0 auto;color:var(--primary-color);--mdc-icon-size:25px}.u146-metric>div{min-width:0;display:flex;flex-direction:column}.u146-metric span{font-size:13px;line-height:1.12;color:var(--secondary-text-color);white-space:normal}.u146-metric strong{font-size:27px;line-height:1.02;font-weight:800;margin-top:5px;white-space:nowrap}.u146-metric small{font-size:11px;line-height:1.12;color:var(--secondary-text-color);margin-top:5px;white-space:normal}
      .u146-status-band{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border:1px solid var(--divider-color);border-radius:22px;background:var(--card-background-color);overflow:hidden}.u146-status{min-width:0;display:flex;align-items:center;gap:11px;padding:12px 13px;position:relative}.u146-status+.u146-status:before{content:"";position:absolute;left:0;top:12px;bottom:12px;width:1px;background:var(--divider-color)}.u146-status ha-icon{flex:0 0 auto;--mdc-icon-size:29px;color:var(--primary-text-color)}.u146-status>div{min-width:0;display:flex;flex-direction:column}.u146-status span{font-size:13px;color:var(--secondary-text-color)}.u146-status strong{font-size:18px;line-height:1.1;font-weight:800;margin-top:4px;white-space:normal}.u146-status small{font-size:11px;line-height:1.15;color:var(--secondary-text-color);margin-top:4px;white-space:normal}.u146-status.active ha-icon,.u146-status.active strong{color:var(--primary-color)}
      .u146-note{display:flex;align-items:center;gap:12px;border-radius:18px;background:rgba(0,169,214,.08);padding:11px 14px;color:var(--secondary-text-color);font-size:12px;line-height:1.25}.u146-note ha-icon{--mdc-icon-size:26px;color:var(--primary-color);flex:0 0 auto}
      @media(max-width:520px){.u146-summary{gap:8px;padding:10px 12px!important}.u146-hero-card{min-height:304px}.u146-headline{left:14px;right:14px;top:14px;grid-template-columns:minmax(0,1fr) 154px}.u146-mode-copy ha-icon{--mdc-icon-size:33px}.u146-mode-copy strong{font-size:27px}.u146-mode-copy span{font-size:17px}.u146-unit-wrap{width:88%;height:210px;margin-top:38px}.u146-unit-wrap .nikas-ac-hero{height:210px!important;min-height:210px!important}.u146-metric{padding:9px 7px;gap:6px}.u146-metric ha-icon{--mdc-icon-size:22px}.u146-metric span{font-size:11px}.u146-metric strong{font-size:23px}.u146-metric small{font-size:10px}.u146-status{padding:10px 9px;gap:8px}.u146-status ha-icon{--mdc-icon-size:25px}.u146-status span{font-size:11px}.u146-status strong{font-size:15px}.u146-status small{font-size:10px}.u146-note{font-size:11px;padding:9px 12px}}
    `;
    root.appendChild(style);
  };

  Panel.prototype.__fixNikasUi146 = function () {
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    this.__installNikasUi146();
    this.__renderAcHero143?.();
  };

  Panel.prototype.render = function (...args) {
    const result = previousRender.apply(this, args);
    this.__fixNikasUi146();
    return result;
  };
  Panel.prototype.patch = function (...args) {
    const result = previousPatch.apply(this, args);
    this.__fixNikasUi146();
    return result;
  };
  Panel.prototype.__nikasUi146Patched = true;
}
