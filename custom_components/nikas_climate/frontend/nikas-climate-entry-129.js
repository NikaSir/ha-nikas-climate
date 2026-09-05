import "./nikas-climate-entry-128.js?v=1.2.8";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.2.9";

if (Panel && !Panel.prototype.__nikasUi129Patched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;

  Panel.prototype.render = function (...args) {
    const result = previousRender.apply(this, args);
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    this.__installNikasUi129?.();
    return result;
  };

  Panel.prototype.patch = function (...args) {
    const result = previousPatch.apply(this, args);
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    return result;
  };

  Panel.prototype.__installNikasUi129 = function () {
    const root = this.shadowRoot;
    if (!root || root.querySelector("style[data-nikas-ui129]")) return;
    const style = document.createElement("style");
    style.dataset.nikasUi129 = "1";
    style.textContent = `
      /* The Apply button belongs to the card flow. Never pin it to the viewport edge. */
      .content:has(.control-card){height:auto!important;min-height:100%!important;padding-bottom:10px!important;}
      .content:has(.control-card) > #content{height:auto!important;min-height:100%!important;}
      .control-card{
        height:auto!important;
        min-height:0!important;
        padding-bottom:12px!important;
        display:block!important;
      }
      .control-card .apply{
        display:block!important;
        position:static!important;
        width:100%!important;
        height:54px!important;
        min-height:54px!important;
        margin:10px 0 0!important;
        flex:none!important;
      }
      .control-card .legend{margin:8px 0 0!important;}
      .control-card .feature-grid{margin-bottom:0!important;}
      .control-card .notice{margin-bottom:0!important;}
    `;
    root.appendChild(style);
  };

  Panel.prototype.__nikasUi129Patched = true;
}
