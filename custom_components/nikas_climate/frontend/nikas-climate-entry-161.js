import "./nikas-climate-entry-160.js?v=1.4.23";

const Panel = customElements.get("nikas-climate-panel");
const UI161 = "1.4.31";

if (Panel && !Panel.prototype.__ui161) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;

  Panel.prototype.__installUi161 = function() {
    const root = this.shadowRoot;
    if (!root) return;
    const version = root.querySelector?.(".header-title span");
    if (version) version.textContent = `UI v${UI161}`;
    if (root.querySelector?.("style[data-nikas-ui161]")) return;
    if (typeof document === "undefined") return;
    const style = document.createElement("style");
    style.dataset.nikasUi161 = "1";
    style.textContent = `
      .u154-summary-wrap.mode-off .u156-hero,
      .u154-summary-wrap.mode-unavailable .u156-hero{
        transform:scale(1.045);
        transform-origin:center 14%;
      }
      .u154-metrics + .u154-band .u154-status:last-child.active ha-icon,
      .u154-metrics + .u154-band .u154-status:last-child.active strong{
        color:var(--primary-text-color);
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
