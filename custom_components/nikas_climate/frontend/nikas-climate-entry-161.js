import "./nikas-climate-entry-160.js?v=1.4.23";

const Panel = customElements.get("nikas-climate-panel");
const UI161 = "1.4.24";

if (Panel && !Panel.prototype.__ui161) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;

  Panel.prototype.__installUi161 = function() {
    const root = this.shadowRoot;
    if (!root) return;
    const version = root.querySelector?.(".header-title span");
    if (version) version.textContent = `UI v${UI161}`;
    if (root.querySelector?.("style[data-nikas-ui161]") || typeof document === "undefined") return;
    const style = document.createElement("style");
    style.dataset.nikasUi161 = "1";
    style.textContent = `
      .u154-connection .connection-indicator{
        height:58px!important;
        min-height:58px!important;
        max-height:58px!important;
      }
      .u154-connection .connection-copy{
        row-gap:3px!important;
      }
      .u154-connection .connection-copy strong{
        font-size:16px!important;
        line-height:1.05!important;
        font-weight:700!important;
      }
      .u154-connection .connection-copy small{
        font-size:13px!important;
        line-height:1.05!important;
        font-weight:600!important;
      }
      @media(min-width:341px) and (max-width:360px){
        .u154-head{
          grid-template-columns:minmax(0,1fr) 168px!important;
        }
      }
    `;
    root.appendChild(style);
  };

  Panel.prototype.render = function(...args) {
    const result = previousRender.apply(this, args);
    this.__installUi161();
    return result;
  };

  Panel.prototype.patch = function(...args) {
    const result = previousPatch.apply(this, args);
    this.__installUi161();
    return result;
  };

  Panel.prototype.__ui161 = true;
}
