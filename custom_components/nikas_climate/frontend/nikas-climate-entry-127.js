import "./nikas-climate-entry-126.js?v=1.2.6";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.2.7";

if (Panel && !Panel.prototype.__nikasUi127Patched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;
  const previousControl = Panel.prototype.control;

  Panel.prototype.control = function (m) {
    let html = previousControl.call(this, m);
    if (!m?.climate) return html;

    // The temperature setpoint is one composite control. Wrap -, value and +
    // into a dedicated group so the separate flap card can never collide with
    // the rounded right edge of the setpoint.
    html = html.replace(
      /<div class="setpoint setpoint-with-flap ([^"]+)">(<button data-delta="-1"[^>]*>−<\/button><div class="setpoint-center"><div class="num[^"]*">[^<]*<\/div><span class="setpoint-current">[^<]*<\/span><\/div><button data-delta="1"[^>]*>\+<\/button>)(<button class="setpoint-flap[\s\S]*?<\/button>)<\/div>/,
      '<div class="setpoint setpoint-with-flap $1"><div class="setpoint-group">$2</div>$3</div>'
    );
    return html;
  };

  Panel.prototype.render = function (...args) {
    const result = previousRender.apply(this, args);
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    this.__installNikasUi127?.();
    return result;
  };

  Panel.prototype.patch = function (...args) {
    const result = previousPatch.apply(this, args);
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    return result;
  };

  Panel.prototype.__installNikasUi127 = function () {
    const root = this.shadowRoot;
    if (!root || root.querySelector("style[data-nikas-ui127]")) return;
    const style = document.createElement("style");
    style.dataset.nikasUi127 = "1";
    style.textContent = `
      /* --- Setpoint: one coherent block + a clearly separated flap card. --- */
      .setpoint-with-flap{
        display:grid!important;
        grid-template-columns:minmax(0,1fr) 92px!important;
        grid-template-rows:68px!important;
        gap:10px!important;
        align-items:stretch!important;
        width:100%!important;
        margin:8px 0 10px!important;
      }
      .setpoint-group{
        min-width:0!important;
        height:68px!important;
        display:grid!important;
        grid-template-columns:54px minmax(0,1fr) 54px!important;
        align-items:stretch!important;
        overflow:hidden!important;
        border:1px solid color-mix(in srgb,var(--primary-color) 48%,var(--divider-color))!important;
        border-radius:18px!important;
        background:color-mix(in srgb,var(--primary-color) 10%,var(--card-background-color))!important;
      }
      .setpoint-group > button[data-delta],
      .setpoint-group > .setpoint-center{
        width:auto!important;
        min-width:0!important;
        height:66px!important;
        min-height:66px!important;
        margin:0!important;
        border:0!important;
        border-radius:0!important;
        background:transparent!important;
        color:var(--primary-color)!important;
        box-sizing:border-box!important;
      }
      .setpoint-group > button[data-delta]{
        display:grid!important;
        place-items:center!important;
        padding:0!important;
        font-size:27px!important;
        font-weight:800!important;
      }
      .setpoint-group > button[data-delta="-1"]{
        box-shadow:inset -1px 0 0 color-mix(in srgb,var(--primary-color) 18%,transparent)!important;
      }
      .setpoint-group > button[data-delta="1"]{
        box-shadow:inset 1px 0 0 color-mix(in srgb,var(--primary-color) 18%,transparent)!important;
      }
      .setpoint-group > .setpoint-center{
        display:flex!important;
        flex-direction:column!important;
        align-items:center!important;
        justify-content:center!important;
        padding:0 8px!important;
      }
      .setpoint-group .num{font-size:42px!important;line-height:.94!important;color:var(--primary-color)!important;}
      .setpoint-group .setpoint-current{font-size:12px!important;line-height:1!important;margin-top:4px!important;color:var(--primary-color)!important;}

      .setpoint-with-flap.setpoint-target > .setpoint-group{
        background:color-mix(in srgb,var(--success-color,#43a047) 12%,var(--card-background-color))!important;
        border-color:color-mix(in srgb,var(--success-color,#43a047) 56%,var(--divider-color))!important;
      }
      .setpoint-with-flap.setpoint-target > .setpoint-group > button[data-delta],
      .setpoint-with-flap.setpoint-target > .setpoint-group .num,
      .setpoint-with-flap.setpoint-target > .setpoint-group .setpoint-current{
        color:var(--success-color,#43a047)!important;
      }
      .setpoint-with-flap.setpoint-target > .setpoint-group > button[data-delta="-1"]{
        box-shadow:inset -1px 0 0 color-mix(in srgb,var(--success-color,#43a047) 20%,transparent)!important;
      }
      .setpoint-with-flap.setpoint-target > .setpoint-group > button[data-delta="1"]{
        box-shadow:inset 1px 0 0 color-mix(in srgb,var(--success-color,#43a047) 20%,transparent)!important;
      }

      .setpoint-with-flap > .setpoint-flap{
        grid-column:2!important;
        grid-row:1!important;
        width:92px!important;
        min-width:92px!important;
        height:68px!important;
        margin:0!important;
        border-radius:18px!important;
      }
      .setpoint-with-flap > .setpoint-flap ha-icon{--mdc-icon-size:27px!important;}

      /* --- Control page: use the full working viewport, no exterior white tail. --- */
      .content:has(.control-card){
        height:100%!important;
        min-height:100%!important;
        padding:8px 12px!important;
      }
      .content:has(.control-card) > #content{
        height:100%!important;
        min-height:100%!important;
      }
      .control-card{
        height:100%!important;
        min-height:100%!important;
        margin:0!important;
        padding:14px 15px 12px!important;
        display:flex!important;
        flex-direction:column!important;
        background:linear-gradient(180deg,var(--card-background-color) 82%,color-mix(in srgb,var(--primary-color) 2.5%,var(--card-background-color)) 100%)!important;
      }
      .control-card .control-section{margin-top:10px!important;}
      .control-card .legend{margin-top:8px!important;}
      .control-card .apply{
        margin-top:auto!important;
        margin-bottom:0!important;
        flex:0 0 auto!important;
      }
      .control-card .notice.error{flex:0 0 auto!important;}

      /* Keep the operating grid visually regular. */
      .control-card .modes{gap:8px!important;}
      .control-card .fan-modes{gap:8px!important;}
      .control-card .action{border-radius:18px!important;}

      @media(max-width:390px){
        .setpoint-with-flap{
          grid-template-columns:minmax(0,1fr) 82px!important;
          grid-template-rows:64px!important;
          gap:8px!important;
        }
        .setpoint-group{
          height:64px!important;
          grid-template-columns:48px minmax(0,1fr) 48px!important;
        }
        .setpoint-group > button[data-delta],
        .setpoint-group > .setpoint-center{height:62px!important;min-height:62px!important;}
        .setpoint-group .num{font-size:39px!important;}
        .setpoint-with-flap > .setpoint-flap{width:82px!important;min-width:82px!important;height:64px!important;}
      }
    `;
    root.appendChild(style);
  };

  Panel.prototype.__nikasUi127Patched = true;
}
