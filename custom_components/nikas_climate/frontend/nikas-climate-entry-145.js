import "./nikas-climate-entry-144.js?v=1.4.4";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.4.5";

const MODE_META_145 = {
  off: ["Выключен", "mdi:power"],
  cool: ["Охлаждение", "mdi:snowflake"],
  heat: ["Обогрев", "mdi:fire"],
  auto: ["Автоматический режим", "mdi:autorenew"],
  dry: ["Осушение", "mdi:water-percent"],
  fan_only: ["Вентиляция", "mdi:fan"],
  unavailable: ["Нет данных", "mdi:lan-disconnect"],
};

const esc145 = (v) => String(v ?? "—")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

if (Panel && !Panel.prototype.__nikasUi145Patched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;

  Panel.prototype.summary = function (m) {
    const mode = MODE_META_145[m?.mode] || MODE_META_145.unavailable;
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

    return `<section class="card u145-summary">
      <div class="u145-headrow">
        <div class="u145-mode-head">
          <div class="u145-mode-title">${esc145(mode[0])}</div>
          ${submode ? `<div class="u145-mode-sub">${esc145(submode)}</div>` : ""}
        </div>
        ${this.connectionPlaque(m)}
      </div>

      <div class="u145-hero"><img class="u136-ac-photo" src="" alt="" /></div>

      <div class="u145-info-row u145-info-row-main">
        <div class="u145-info-cell">
          <ha-icon icon="mdi:thermometer"></ha-icon>
          <div><strong>Температура</strong><b>${this.fmt(m?.roomTemp,1)}°</b><span>В помещении</span></div>
        </div>
        <div class="u145-info-cell">
          <ha-icon icon="mdi:water-outline"></ha-icon>
          <div><strong>Влажность</strong><b>${this.fmt(m?.humidity,0)}%</b><span>В помещении</span></div>
        </div>
        <div class="u145-info-cell">
          <ha-icon icon="mdi:thermometer-check-outline"></ha-icon>
          <div><strong>Уставка</strong><b>${this.fmt(m?.target,0)}°</b><span>Целевая</span></div>
        </div>
      </div>

      <div class="u145-info-row">
        <div class="u145-info-cell">
          <ha-icon icon="${this.fanIcon(m?.fan)}"></ha-icon>
          <div><strong>Вентилятор</strong><b>${esc145(fan)}</b><span>Текущая скорость</span></div>
        </div>
        <div class="u145-info-cell">
          <ha-icon icon="${this.flapIcon(m?.swing)}"></ha-icon>
          <div><strong>Створка</strong><b>${esc145(flap)}</b><span>Положение</span></div>
        </div>
        <div class="u145-info-cell">
          <ha-icon icon="mdi:thermometer-lines"></ha-icon>
          <div><strong>Δ датчиков</strong><b>${deltaText}</b><span>Блок − комната</span></div>
        </div>
      </div>

      <div class="u145-feature-row">
        <div class="u145-feature ${nightOn ? "active" : ""}">
          <ha-icon icon="mdi:weather-night"></ha-icon>
          <div><strong>Ночной</strong><span>${nightOn ? "Вкл." : "Выкл."}</span></div>
        </div>
        <div class="u145-feature ${turboOn ? "active" : ""}">
          <ha-icon icon="mdi:rocket-launch-outline"></ha-icon>
          <div><strong>Турбо</strong><span>${turboOn ? "Вкл." : "Выкл."}</span></div>
        </div>
        <div class="u145-feature">
          <ha-icon icon="mdi:air-conditioner"></ha-icon>
          <div><strong>У кондиционера</strong><span>${this.fmt(m?.indoor,1)} °C</span></div>
        </div>
      </div>
    </section>`;
  };

  Panel.prototype.__installNikasUi145 = function () {
    const root = this.shadowRoot;
    if (!root || root.querySelector("style[data-nikas-ui145]")) return;
    const style = document.createElement("style");
    style.dataset.nikasUi145 = "1";
    style.textContent = `
      .u145-summary{
        height:100%;min-height:0;overflow:hidden;box-sizing:border-box;
        display:flex;flex-direction:column;gap:10px;padding:14px 16px!important;margin:0!important;
      }
      .u145-headrow{display:grid;grid-template-columns:minmax(0,1fr) 174px;gap:12px;align-items:start;min-height:92px}
      .u145-mode-head{min-width:0;padding:8px 2px 0}
      .u145-mode-title{font-size:31px;line-height:1.02;font-weight:800;color:var(--primary-text-color);letter-spacing:-.02em}
      .u145-mode-sub{margin-top:8px;font-size:20px;line-height:1.1;font-weight:700;color:var(--primary-color)}
      .u145-headrow .connection-plaque,.u145-headrow .conn-plaque,.u145-headrow [class*="connection"]{justify-self:end}

      .u145-hero{
        height:242px;min-height:242px;border-radius:24px;overflow:hidden;
        display:flex;align-items:center;justify-content:center;
        background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(127,127,127,.025));
      }
      .u145-hero .nikas-ac-hero{height:226px!important;min-height:226px!important;width:100%!important}
      .u145-hero .nikas-ac-unit{width:min(92%,620px)!important;height:116px!important;border-radius:28px 28px 18px 18px!important}
      .u145-hero .nikas-ac-brand{top:31px!important;font-size:28px!important}
      .u145-hero .nikas-ac-display{top:24px!important;right:34px!important;font-size:23px!important}
      .u145-hero .nikas-ac-state-icon{left:25px!important;top:22px!important;--mdc-icon-size:27px!important}
      .u145-hero .nikas-ac-outlet{bottom:11px!important;height:22px!important}
      .u145-hero .nikas-ac-flap{bottom:-5px!important;height:11px!important}
      .u145-hero .nikas-ac-air{top:116px!important;height:78px!important;left:16%!important;right:16%!important}

      .u145-info-row{
        display:grid;grid-template-columns:repeat(3,minmax(0,1fr));
        border:1px solid var(--divider-color);border-radius:22px;background:var(--card-background-color);overflow:hidden;
      }
      .u145-info-cell{min-width:0;display:flex;align-items:center;gap:10px;padding:12px 13px;position:relative}
      .u145-info-cell+ .u145-info-cell:before{content:"";position:absolute;left:0;top:12px;bottom:12px;width:1px;background:var(--divider-color)}
      .u145-info-cell ha-icon{flex:0 0 auto;color:var(--primary-color);--mdc-icon-size:27px}
      .u145-info-cell>div{min-width:0;display:grid;grid-template-columns:1fr;line-height:1.05}
      .u145-info-cell strong{font-size:15px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .u145-info-cell b{font-size:25px;font-weight:800;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .u145-info-cell span{font-size:13px;color:var(--secondary-text-color);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .u145-info-row-main .u145-info-cell b{font-size:28px}

      .u145-feature-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
      .u145-feature{
        min-width:0;min-height:80px;border:1px solid var(--divider-color);border-radius:20px;
        display:flex;align-items:center;justify-content:center;gap:10px;padding:10px 12px;background:var(--card-background-color);
      }
      .u145-feature ha-icon{--mdc-icon-size:29px;color:var(--secondary-text-color)}
      .u145-feature>div{min-width:0;display:flex;flex-direction:column;gap:4px}
      .u145-feature strong{font-size:16px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .u145-feature span{font-size:14px;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .u145-feature.active{border-color:rgba(0,169,214,.45);background:rgba(0,169,214,.08)}
      .u145-feature.active ha-icon,.u145-feature.active strong{color:var(--primary-color)}

      @media(max-width:520px){
        .u145-summary{gap:8px;padding:12px!important}
        .u145-headrow{grid-template-columns:minmax(0,1fr) 154px;min-height:84px}
        .u145-mode-title{font-size:28px}.u145-mode-sub{font-size:18px;margin-top:6px}
        .u145-hero{height:218px;min-height:218px}.u145-hero .nikas-ac-hero{height:208px!important;min-height:208px!important}
        .u145-info-cell{gap:7px;padding:10px 9px}.u145-info-cell ha-icon{--mdc-icon-size:23px}
        .u145-info-cell strong{font-size:13px}.u145-info-cell b{font-size:22px}.u145-info-row-main .u145-info-cell b{font-size:25px}.u145-info-cell span{font-size:11px}
        .u145-feature{min-height:72px;padding:8px;gap:7px}.u145-feature ha-icon{--mdc-icon-size:25px}.u145-feature strong{font-size:14px}.u145-feature span{font-size:12px}
      }
    `;
    root.appendChild(style);
  };

  Panel.prototype.__fixNikasUi145 = function () {
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    this.__installNikasUi145();
    this.__renderAcHero143?.();
  };

  Panel.prototype.render = function (...args) {
    const result = previousRender.apply(this, args);
    this.__fixNikasUi145();
    return result;
  };

  Panel.prototype.patch = function (...args) {
    const result = previousPatch.apply(this, args);
    this.__fixNikasUi145();
    return result;
  };

  Panel.prototype.__nikasUi145Patched = true;
}
