import "./nikas-climate-entry-125.js?v=1.2.5";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.2.6";

if (Panel && !Panel.prototype.__nikasUi126Patched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;

  Panel.prototype.render = function (...args) {
    const result = previousRender.apply(this, args);
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    this.__installNikasUi126?.();
    return result;
  };

  Panel.prototype.patch = function (...args) {
    const result = previousPatch.apply(this, args);
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    return result;
  };

  Panel.prototype.__installNikasUi126 = function () {
    const root = this.shadowRoot;
    if (!root || root.querySelector("style[data-nikas-ui126]")) return;
    const style = document.createElement("style");
    style.dataset.nikasUi126 = "1";
    style.textContent = `
      /* v1.2.6: force the setpoint into one compact horizontal control. */
      .setpoint-with-flap{
        display:grid!important;
        grid-template-columns:54px minmax(118px,1fr) 54px 86px!important;
        grid-template-rows:66px!important;
        align-items:stretch!important;
        width:100%!important;
        gap:0!important;
        margin:8px 0 10px!important;
      }
      .setpoint-with-flap > button[data-delta="-1"]{
        grid-column:1!important;
        grid-row:1!important;
        width:54px!important;
        min-width:54px!important;
        height:66px!important;
        margin:0!important;
        border-radius:18px 0 0 18px!important;
        border-right:0!important;
      }
      .setpoint-with-flap > .setpoint-center{
        grid-column:2!important;
        grid-row:1!important;
        width:auto!important;
        min-width:0!important;
        height:66px!important;
        margin:0!important;
        padding:0 8px!important;
        box-sizing:border-box!important;
        border-left:0!important;
        border-right:0!important;
      }
      .setpoint-with-flap > button[data-delta="1"]{
        grid-column:3!important;
        grid-row:1!important;
        width:54px!important;
        min-width:54px!important;
        height:66px!important;
        margin:0 10px 0 0!important;
        border-radius:0 18px 18px 0!important;
        border-left:0!important;
      }
      .setpoint-with-flap > .setpoint-flap{
        grid-column:4!important;
        grid-row:1!important;
        width:86px!important;
        min-width:86px!important;
        height:66px!important;
        margin:0!important;
        align-self:stretch!important;
      }
      .setpoint-with-flap .num{font-size:42px!important;line-height:.95!important;}
      .setpoint-with-flap .setpoint-current{font-size:12px!important;margin-top:3px!important;}

      /* Current setpoint is one blue operational block; pending target becomes green as a whole. */
      .setpoint-with-flap.setpoint-current > button[data-delta],
      .setpoint-with-flap.setpoint-current > .setpoint-center{
        background:color-mix(in srgb,var(--primary-color) 10%,var(--card-background-color))!important;
        border-color:color-mix(in srgb,var(--primary-color) 48%,var(--divider-color))!important;
      }
      .setpoint-with-flap.setpoint-target > button[data-delta],
      .setpoint-with-flap.setpoint-target > .setpoint-center{
        background:color-mix(in srgb,var(--success-color,#43a047) 12%,var(--card-background-color))!important;
        border-color:color-mix(in srgb,var(--success-color,#43a047) 56%,var(--divider-color))!important;
      }

      /* Do not let the working card or its wrappers create an artificial white tail. */
      .content:has(.control-card),
      .content:has(.control-card) > #content{
        min-height:0!important;
        height:auto!important;
        padding-bottom:6px!important;
      }
      .control-card{
        min-height:0!important;
        height:auto!important;
        margin-bottom:0!important;
        padding-bottom:10px!important;
      }
      .control-card .control-section{margin-top:10px!important;}
      .control-card .legend{margin-top:8px!important;}
      .control-card .apply{margin-top:8px!important;margin-bottom:0!important;}

      @media(max-width:390px){
        .setpoint-with-flap{
          grid-template-columns:48px minmax(104px,1fr) 48px 78px!important;
          grid-template-rows:62px!important;
        }
        .setpoint-with-flap > button[data-delta="-1"],
        .setpoint-with-flap > button[data-delta="1"]{width:48px!important;min-width:48px!important;height:62px!important;}
        .setpoint-with-flap > .setpoint-center{height:62px!important;}
        .setpoint-with-flap > .setpoint-flap{width:78px!important;min-width:78px!important;height:62px!important;}
        .setpoint-with-flap .num{font-size:39px!important;}
      }
    `;
    root.appendChild(style);
  };

  Panel.prototype.__nikasUi126Patched = true;
}
