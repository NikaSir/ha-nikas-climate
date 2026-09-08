import "./nikas-climate-entry-160.js?v=1.4.23";

const Panel = customElements.get("nikas-climate-panel");
const UI161 = "1.4.25";

if (Panel && !Panel.prototype.__ui161) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;

  Panel.prototype.__installUi161 = function() {
    const root = this.shadowRoot;
    if (!root) return;
    const version = root.querySelector?.(".header-title span");
    if (version) version.textContent = `UI v${UI161}`;
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
