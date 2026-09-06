import "./nikas-climate-entry-142.js?v=1.4.2";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.4.3";

const MODE_CLASS = {
  off: "off",
  cool: "cool",
  heat: "heat",
  auto: "auto",
  dry: "dry",
  fan_only: "fan",
  unavailable: "unavailable",
};

if (Panel && !Panel.prototype.__nikasUi143Patched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;

  Panel.prototype.__installNikasUi143 = function () {
    const root = this.shadowRoot;
    if (!root || root.querySelector("style[data-nikas-ui143]")) return;
    const style = document.createElement("style");
    style.dataset.nikasUi143 = "1";
    style.textContent = `
      /* CSS-rendered Ballu hero: independent of CSP/blob/data image policies. */
      .nikas-ac-hero{
        --ac-accent:var(--primary-color);
        --ac-glow:rgba(0,169,214,.18);
        position:relative;width:100%;height:100%;min-height:96px;
        display:flex;align-items:center;justify-content:center;
        overflow:visible;background:transparent;
      }
      .nikas-ac-hero.off{--ac-accent:#a5adb2;--ac-glow:rgba(130,140,145,.10)}
      .nikas-ac-hero.cool{--ac-accent:#1aa9df;--ac-glow:rgba(26,169,223,.26)}
      .nikas-ac-hero.heat{--ac-accent:#e98a2f;--ac-glow:rgba(233,138,47,.22)}
      .nikas-ac-hero.auto{--ac-accent:#43a85b;--ac-glow:rgba(67,168,91,.20)}
      .nikas-ac-hero.dry{--ac-accent:#16a6b7;--ac-glow:rgba(22,166,183,.20)}
      .nikas-ac-hero.fan{--ac-accent:#7b8d97;--ac-glow:rgba(123,141,151,.16)}
      .nikas-ac-hero.unavailable{--ac-accent:#8b8f93;--ac-glow:rgba(120,120,120,.05);opacity:.58}
      .nikas-ac-unit{
        position:relative;width:min(96%,430px);height:72px;border-radius:22px 22px 15px 15px;
        background:linear-gradient(180deg,#fff 0%,#f8fafb 56%,#eef2f4 100%);
        border:1px solid rgba(120,140,150,.23);
        box-shadow:0 9px 22px rgba(0,0,0,.10),inset 0 1px 0 rgba(255,255,255,.9);
      }
      .nikas-ac-brand{
        position:absolute;left:50%;top:20px;transform:translateX(-50%);
        font-size:17px;font-weight:700;letter-spacing:.02em;color:#586066;
      }
      .nikas-ac-display{
        position:absolute;right:23px;top:15px;font-size:15px;font-weight:800;color:var(--ac-accent);
        text-shadow:0 0 8px var(--ac-glow);
      }
      .nikas-ac-outlet{
        position:absolute;left:6%;right:6%;bottom:8px;height:14px;border-radius:2px 2px 8px 8px;
        background:repeating-linear-gradient(90deg,#14252f 0 18px,#31444f 18px 21px);
        box-shadow:inset 0 1px 2px rgba(255,255,255,.25);
      }
      .nikas-ac-flap{
        position:absolute;left:9%;right:9%;bottom:-3px;height:8px;border-radius:0 0 50% 50%;
        background:linear-gradient(180deg,#dce5e9,#f8fbfc);border-bottom:1px solid rgba(110,130,140,.18);
      }
      .nikas-ac-air{
        position:absolute;left:20%;right:20%;top:72px;height:34px;pointer-events:none;opacity:0;
        clip-path:polygon(8% 0,92% 0,75% 100%,25% 100%);
        background:linear-gradient(180deg,var(--ac-glow),transparent 92%);
        filter:blur(.2px);
      }
      .nikas-ac-hero:not(.off):not(.unavailable) .nikas-ac-air{opacity:1}
      .nikas-ac-hero.off .nikas-ac-outlet{filter:saturate(.4);opacity:.82}
      .nikas-ac-hero.unavailable .nikas-ac-unit{filter:grayscale(1)}
      .nikas-ac-state-icon{
        position:absolute;left:16px;top:13px;color:var(--ac-accent);--mdc-icon-size:18px;
      }
      .u136-summary-top .nikas-ac-hero{height:145px!important;min-height:145px!important;}
      .u136-visual-row .nikas-ac-hero{height:100px!important;min-height:100px!important;}
    `;
    root.appendChild(style);
  };

  Panel.prototype.__renderAcHero143 = function () {
    const root = this.shadowRoot;
    if (!root) return;

    let model = null;
    try { model = this.__activeModel140?.() || null; } catch (_) {}
    const mode = model?.available ? (model?.mode || "off") : "unavailable";
    const cls = MODE_CLASS[mode] || MODE_CLASS.off;
    const target = Number.isFinite(Number(model?.target)) ? `${Math.round(Number(model.target))}°` : "—";
    const icon = this.modeIcon ? this.modeIcon(mode) : (mode === "off" ? "mdi:power" : "mdi:air-conditioner");

    root.querySelectorAll("img.u136-ac-photo").forEach((img) => {
      const hero = document.createElement("div");
      hero.className = `nikas-ac-hero ${cls}`;
      hero.setAttribute("aria-label", `Ballu Lagoon: ${mode}`);
      hero.innerHTML = `
        <div class="nikas-ac-unit">
          <ha-icon class="nikas-ac-state-icon" icon="${icon}"></ha-icon>
          <div class="nikas-ac-brand">Ballu</div>
          <div class="nikas-ac-display">${target}</div>
          <div class="nikas-ac-outlet"></div>
          <div class="nikas-ac-flap"></div>
          <div class="nikas-ac-air"></div>
        </div>`;
      img.replaceWith(hero);
    });

    root.querySelectorAll(".nikas-ac-hero").forEach((hero) => {
      hero.className = `nikas-ac-hero ${cls}`;
      hero.querySelector(".nikas-ac-display")?.replaceChildren(document.createTextNode(target));
      hero.querySelector(".nikas-ac-state-icon")?.setAttribute("icon", icon);
    });
  };

  Panel.prototype.__fixNikasUi143 = function () {
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    this.__installNikasUi143();
    this.__renderAcHero143();
  };

  Panel.prototype.render = function (...args) {
    const result = previousRender.apply(this, args);
    this.__fixNikasUi143();
    return result;
  };

  Panel.prototype.patch = function (...args) {
    const result = previousPatch.apply(this, args);
    this.__fixNikasUi143();
    return result;
  };

  Panel.prototype.__nikasUi143Patched = true;
}
