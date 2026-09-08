import "./nikas-climate-entry-130.js?v=1.3.0";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.3.1";

if (Panel && !Panel.prototype.__nikasUi131Patched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;
  const previousEnsureRegistries = Panel.prototype.ensureRegistries;

  // Night/Turbo are sibling entities discovered through the entity registry.
  // A targeted patch can add their controls after a cold load without replacing
  // the already mounted shell or the current working-area nodes.
  Panel.prototype.ensureRegistries = async function (force=false) {
    const wasReady = Boolean(this._entityRegistry && this._areaRegistry && this._labelRegistry);
    await previousEnsureRegistries.call(this, force);
    const isReady = Boolean(this._entityRegistry && this._areaRegistry && this._labelRegistry);
    if (!wasReady && isReady && this._rendered) {
      this.patch();
      const version = this.shadowRoot?.querySelector(".header-title span");
      if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    }
  };

  Panel.prototype.render = function (...args) {
    const result = previousRender.apply(this, args);
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    return result;
  };

  Panel.prototype.patch = function (...args) {
    const result = previousPatch.apply(this, args);
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    return result;
  };

  Panel.prototype.__nikasUi131Patched = true;
}
