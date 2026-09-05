import "./nikas-climate-entry-124.js?v=1.2.4";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.2.5";

if (Panel && !Panel.prototype.__nikasUi125Patched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;
  const previousControl = Panel.prototype.control;

  Panel.prototype.control = function (m) {
    let html = previousControl.call(this, m);
    if (!m?.climate) return html;

    const d = this.draftFor(m);
    const tempChanged = m.target != null && Number(d.target) !== Number(m.target);
    const setpointState = tempChanged ? "setpoint-target" : "setpoint-current";
    html = html.replace(
      'class="setpoint setpoint-with-flap"',
      `class="setpoint setpoint-with-flap ${setpointState}"`
    );
    return html;
  };

  Panel.prototype.render = function (...args) {
    const result = previousRender.apply(this, args);
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    this.__installNikasUi125?.();
    return result;
  };

  Panel.prototype.patch = function (...args) {
    const result = previousPatch.apply(this, args);
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    return result;
  };

  Panel.prototype.__installNikasUi125 = function () {
    const root = this.shadowRoot;
    if (!root || root.querySelector("style[data-nikas-ui125]")) return;
    const style = document.createElement("style");
    style.dataset.nikasUi125 = "1";
    style.textContent = `
      /* Control page must end at the controls, not create an artificial empty tail. */
      .control-card{
        min-height:0!important;
        height:auto!important;
        padding-bottom:12px!important;
        margin-bottom:8px!important;
      }
      .control-note{display:none!important;}
      .content:has(.control-card){padding-bottom:8px!important;}

      /* Minus / setpoint / plus are one operational control. */
      .setpoint-with-flap{
        grid-template-columns:54px minmax(0,1fr) 54px 86px!important;
        column-gap:0!important;
        row-gap:0!important;
        align-items:center!important;
      }
      .setpoint-with-flap > button[data-delta="-1"]{
        border-radius:18px 0 0 18px!important;
        border-right:0!important;
      }
      .setpoint-with-flap > .setpoint-center{
        height:66px!important;
        min-height:66px!important;
        display:flex!important;
        flex-direction:column!important;
        align-items:center!important;
        justify-content:center!important;
        border-top:1px solid color-mix(in srgb,var(--primary-color) 48%,var(--divider-color))!important;
        border-bottom:1px solid color-mix(in srgb,var(--primary-color) 48%,var(--divider-color))!important;
        background:color-mix(in srgb,var(--primary-color) 10%,var(--card-background-color))!important;
      }
      .setpoint-with-flap > button[data-delta="1"]{
        border-radius:0 18px 18px 0!important;
        border-left:0!important;
        margin-right:10px!important;
      }
      .setpoint-with-flap > button[data-delta="-1"],
      .setpoint-with-flap > button[data-delta="1"]{
        height:66px!important;
        background:color-mix(in srgb,var(--primary-color) 10%,var(--card-background-color))!important;
        border-color:color-mix(in srgb,var(--primary-color) 48%,var(--divider-color))!important;
        color:var(--primary-color)!important;
        font-weight:800!important;
      }
      .setpoint-with-flap.setpoint-current > .setpoint-center .num,
      .setpoint-with-flap.setpoint-current > .setpoint-center .setpoint-current{
        color:var(--primary-color)!important;
      }

      /* Pending target switches the complete three-part setpoint block to green. */
      .setpoint-with-flap.setpoint-target > button[data-delta="-1"],
      .setpoint-with-flap.setpoint-target > button[data-delta="1"],
      .setpoint-with-flap.setpoint-target > .setpoint-center{
        background:color-mix(in srgb,var(--success-color,#43a047) 12%,var(--card-background-color))!important;
        border-color:color-mix(in srgb,var(--success-color,#43a047) 56%,var(--divider-color))!important;
      }
      .setpoint-with-flap.setpoint-target > button[data-delta="-1"],
      .setpoint-with-flap.setpoint-target > button[data-delta="1"],
      .setpoint-with-flap.setpoint-target > .setpoint-center .num,
      .setpoint-with-flap.setpoint-target > .setpoint-center .setpoint-current{
        color:var(--success-color,#43a047)!important;
      }

      .setpoint-flap{margin-left:10px!important;}

      @media(max-width:360px){
        .setpoint-with-flap{grid-template-columns:48px minmax(0,1fr) 48px 78px!important;}
        .setpoint-with-flap > button[data-delta="1"]{margin-right:7px!important;}
        .setpoint-flap{margin-left:7px!important;}
      }
    `;
    root.appendChild(style);
  };

  Panel.prototype.__nikasUi125Patched = true;
}
