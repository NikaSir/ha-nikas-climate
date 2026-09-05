import "./nikas-climate-entry-129.js?v=1.2.9";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.3.0";
const VALID_SWING = new Set(["off", "vertical", "horizontal", "both"]);

if (Panel && !Panel.prototype.__nikasUi130Patched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;
  const previousControl = Panel.prototype.control;
  const previousApplyDraft = Panel.prototype.applyDraft;

  Panel.prototype.swingModesFor = function (m) {
    const modes = Array.isArray(m?.climate?.attributes?.swing_modes)
      ? m.climate.attributes.swing_modes
      : [];
    return modes.filter((value) => VALID_SWING.has(value));
  };

  Panel.prototype.swingStateValid = function (m) {
    return VALID_SWING.has(m?.swing) && this.swingModesFor(m).includes(m.swing);
  };

  Panel.prototype.activeSwingMode = function (m, draft=null) {
    const modes = this.swingModesFor(m).filter((value) => value !== "off");
    const current = draft?.swing || m?.swing;
    if (current && current !== "off" && modes.includes(current)) return current;

    const remembered = localStorage.getItem(`nikas_climate.swing.${m.room.key}`);
    if (remembered && modes.includes(remembered)) return remembered;

    // Preserve the mode that has already worked in this panel where possible.
    if (modes.includes("both")) return "both";
    return modes[0] || "off";
  };

  Panel.prototype.control = function (m) {
    let html = previousControl.call(this, m);
    if (!m?.climate) return html;

    const modes = this.swingModesFor(m);
    const usable = modes.includes("off") && modes.some((value) => value !== "off");
    const currentValid = this.swingStateValid(m);

    // Do not show an unknown raw value as a green target and never let it be submitted.
    if (!usable || !currentValid) {
      html = html
        .replace(/class="setpoint-flap[^\"]*" data-flap([^>]*)>/,
          'class="setpoint-flap unsupported" disabled aria-disabled="true">')
        .replace(/<span>Створка<\/span><small>[^<]*<\/small>/,
          '<span>Створка</span><small>н/д</small>');
    }
    return html;
  };

  Panel.prototype.applyDraft = async function (m, d) {
    // The Hall entity has been observed with an unknown swing value (—). That value
    // is presentation only and must never reach climate.set_swing_mode.
    if (!VALID_SWING.has(d?.swing) || !this.swingModesFor(m).includes(d.swing)) {
      d.swing = m.swing;
    }
    return previousApplyDraft.call(this, m, d);
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

  Panel.prototype.__nikasUi130Patched = true;
}
