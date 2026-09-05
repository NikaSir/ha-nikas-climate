import "./nikas-climate-entry.js?v=1.2.3";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.2.4";
const SWING_FEATURE = 32;
const COMMAND_GAP_MS = 700;
const VERIFY_DELAY_MS = 1200;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

if (Panel && !Panel.prototype.__nikasUi124Patched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;
  const previousControl = Panel.prototype.control;

  Panel.prototype.supportsSwingCommand = function (m) {
    const features = Number(m?.climate?.attributes?.supported_features || 0);
    return Boolean(features & SWING_FEATURE);
  };

  Panel.prototype.control = function (m) {
    const html = previousControl.call(this, m);
    if (!m?.climate || this.supportsSwingCommand(m)) return html;

    // Syncleo may expose a remembered swing value while HA does not advertise
    // climate.set_swing_mode for this entity. Never offer a command HA will reject.
    return html
      .replace(/class="setpoint-flap[^\"]*" data-flap([^>]*)>/,
        'class="setpoint-flap unsupported" disabled aria-disabled="true">')
      .replace(/<span>Створка<\/span><small>[^<]*<\/small>/,
        '<span>Створка</span><small>н/д</small>');
  };

  Panel.prototype._liveModel = function (m) {
    return this.roomModel(m.room);
  };

  Panel.prototype._matchesCommand = function (m, kind, value) {
    const live = this._liveModel(m);
    if (kind === "mode") return live.mode === value;
    if (kind === "fan") return live.fan === value;
    if (kind === "temperature") return live.target != null && Math.abs(Number(live.target) - Number(value)) < 0.01;
    if (kind === "swing") return live.swing === value;
    if (kind === "night" || kind === "turbo") return live.features?.[kind] === value;
    return false;
  };

  Panel.prototype._runCommand = async function (m, kind, value, serviceCall) {
    try {
      await serviceCall();
      await sleep(COMMAND_GAP_MS);
      return {ok:true};
    } catch (err) {
      // Syncleo UDP can time out after the physical unit has already accepted a command.
      // Give the local callback time to update HA before classifying it as a failure.
      const text = String(err?.message || err || "");
      if (/timeout/i.test(text)) {
        await sleep(VERIFY_DELAY_MS);
        if (this._matchesCommand(m, kind, value)) return {ok:true, late:true};
        return {ok:false, timeout:true, message:`${kind}: нет подтверждения UDP`};
      }
      return {ok:false, message:`${kind}: ${text}`};
    }
  };

  Panel.prototype.applyDraft = async function (m, d) {
    if (!d.dirty || d.applying) return;
    d.applying = true;
    d.error = null;
    this.patch();

    const failures = [];
    let live = this._liveModel(m);

    // Mode first: on many split systems a mode change can reset fan parameters.
    if (d.mode !== live.mode) {
      const r = await this._runCommand(m, "mode", d.mode, () =>
        this._hass.callService("climate", "set_hvac_mode", {entity_id:m.climate.entity_id, hvac_mode:d.mode})
      );
      if (!r.ok) failures.push(r.message);
      live = this._liveModel(m);
    }

    if (live.target != null && Number(d.target) !== Number(live.target)) {
      const r = await this._runCommand(m, "temperature", d.target, () =>
        this._hass.callService("climate", "set_temperature", {entity_id:m.climate.entity_id, temperature:d.target})
      );
      if (!r.ok) failures.push(r.message);
      live = this._liveModel(m);
    }

    if (d.fan !== live.fan) {
      const r = await this._runCommand(m, "fan", d.fan, () =>
        this._hass.callService("climate", "set_fan_mode", {entity_id:m.climate.entity_id, fan_mode:d.fan})
      );
      if (!r.ok) failures.push(r.message);
      live = this._liveModel(m);
    }

    for (const key of ["night", "turbo"]) {
      if (live.features?.[key] != null && d[key] !== live.features[key] && live.featureEntities?.[key]) {
        const desired = d[key];
        const r = await this._runCommand(m, key, desired, () =>
          this._hass.callService("switch", desired === "on" ? "turn_on" : "turn_off", {entity_id:live.featureEntities[key]})
        );
        if (!r.ok) failures.push(r.message);
        live = this._liveModel(m);
      }
    }

    // Only send swing when Home Assistant explicitly advertises SWING_MODE.
    // This prevents the validation error observed with the installed Syncleo entity.
    if (d.swing !== live.swing) {
      if (this.supportsSwingCommand(live)) {
        const r = await this._runCommand(m, "swing", d.swing, () =>
          this._hass.callService("climate", "set_swing_mode", {entity_id:m.climate.entity_id, swing_mode:d.swing})
        );
        if (!r.ok) failures.push(r.message);
      } else {
        d.swing = live.swing;
      }
    }

    d.applying = false;
    const finalModel = this._liveModel(m);
    d.dirty = this.draftChanged(finalModel, d);

    if (failures.length) {
      d.error = `Не подтверждено локально: ${failures.join("; ")}. Нажмите ↻ и повторите только оставшиеся изменения.`;
    } else {
      d.error = null;
      // Let normal patching convert confirmed green targets into blue current state.
      d.dirty = this.draftChanged(finalModel, d);
    }
    this.patch();
  };

  Panel.prototype.render = function (...args) {
    const result = previousRender.apply(this, args);
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    this.__installNikasUi124?.();
    return result;
  };

  Panel.prototype.patch = function (...args) {
    const result = previousPatch.apply(this, args);
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    return result;
  };

  Panel.prototype.__installNikasUi124 = function () {
    const root = this.shadowRoot;
    if (!root || root.querySelector("style[data-nikas-ui124]")) return;
    const style = document.createElement("style");
    style.dataset.nikasUi124 = "1";
    style.textContent = `
      .setpoint-flap.unsupported,
      .setpoint-flap:disabled.unsupported{
        opacity:.52!important;
        color:var(--secondary-text-color)!important;
        background:var(--secondary-background-color)!important;
        border-color:color-mix(in srgb,var(--divider-color) 75%,transparent)!important;
      }
      .setpoint-flap.unsupported small{color:var(--secondary-text-color)!important;}
      .notice.error{font-size:12.5px!important;line-height:1.35!important;}
    `;
    root.appendChild(style);
  };

  Panel.prototype.__nikasUi124Patched = true;
}
