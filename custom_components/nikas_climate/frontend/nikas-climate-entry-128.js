import "./nikas-climate-entry-127.js?v=1.2.7";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.2.8";

if (Panel && !Panel.prototype.__nikasUi128Patched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;
  const previousControl = Panel.prototype.control;

  Panel.prototype.control = function (m) {
    let html = previousControl.call(this, m);
    if (!m?.climate) return html;

    // Night/Turbo: icon + function name in the upper row; state on a separate line.
    html = html.replace(
      /(<button class="action [^"]*" data-feature="night"[^>]*>)<ha-icon icon="mdi:weather-night"><\/ha-icon><span>Ночной<br>([^<]*)<\/span>(<\/button>)/,
      '$1<span class="feature-head"><ha-icon icon="mdi:weather-night"></ha-icon><strong>Ночной</strong></span><small class="feature-status">$2</small>$3'
    );
    html = html.replace(
      /(<button class="action [^"]*" data-feature="turbo"[^>]*>)<ha-icon icon="mdi:rocket-launch-outline"><\/ha-icon><span>Турбо<br>([^<]*)<\/span>(<\/button>)/,
      '$1<span class="feature-head"><ha-icon icon="mdi:rocket-launch-outline"></ha-icon><strong>Турбо</strong></span><small class="feature-status">$2</small>$3'
    );
    return html;
  };

  Panel.prototype.render = function (...args) {
    const result = previousRender.apply(this, args);
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    this.__installNikasUi128?.();
    return result;
  };

  Panel.prototype.patch = function (...args) {
    const result = previousPatch.apply(this, args);
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    return result;
  };

  Panel.prototype.__installNikasUi128 = function () {
    const root = this.shadowRoot;
    if (!root || root.querySelector("style[data-nikas-ui128]")) return;
    const style = document.createElement("style");
    style.dataset.nikasUi128 = "1";
    style.textContent = `
      .feature-grid .action[data-feature="night"],
      .feature-grid .action[data-feature="turbo"]{
        display:flex!important;
        flex-direction:column!important;
        align-items:center!important;
        justify-content:center!important;
        gap:5px!important;
        min-height:82px!important;
        padding:9px 10px!important;
      }
      .feature-head{
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        gap:7px!important;
        min-width:0!important;
        line-height:1!important;
      }
      .feature-head ha-icon{--mdc-icon-size:26px!important;flex:0 0 auto!important;}
      .feature-head strong{
        font-size:14px!important;
        line-height:1!important;
        font-weight:760!important;
        white-space:nowrap!important;
      }
      .feature-status{
        display:block!important;
        margin:0!important;
        font-size:13px!important;
        line-height:1.1!important;
        font-weight:700!important;
        color:var(--primary-text-color)!important;
      }
      .feature-grid .action.current .feature-head,
      .feature-grid .action.current .feature-status{color:var(--primary-color)!important;}
      .feature-grid .action.target .feature-head,
      .feature-grid .action.target .feature-status{color:var(--success-color,#43a047)!important;}
    `;
    root.appendChild(style);
  };

  Panel.prototype.__nikasUi128Patched = true;
}
