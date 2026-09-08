import "./nikas-climate-entry-158.js?v=1.4.21";

const Panel = customElements.get("nikas-climate-panel");
const UI159 = "1.4.22";
const PEERS159 = [
  {
    key: "living",
    title: "Зал",
    area: "11.2 · Гостиная",
    climateNames: ["Кондиционер в зале", "Кондей в Гостиной"],
    explicitRoomTempEntity: "sensor.sensor_th_zb_11_temperature",
    explicitHumidityEntity: "sensor.sensor_th_zb_11_humidity",
  },
  {
    key: "veranda",
    title: "Веранда",
    area: "14 · Веранда",
    climateNames: ["Кондиционер на веранде", "Кондей на Веранде"],
    explicitRoomTempEntity: "sensor.sensor_th_zb_14_temperature",
    explicitHumidityEntity: "sensor.sensor_th_zb_14_humidity",
  },
];

if (Panel && !Panel.prototype.__ui159) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;

  Panel.prototype.peerConnectionTone159 = function(m) {
    const connection = this.connection(m);
    if (connection.label === "Нет связи") return "bad";
    if (connection.label === "Локально" && connection.fresh === "Данные актуальны") return "ok";
    return "nodata";
  };

  Panel.prototype.__installUi159 = function() {
    const root = this.shadowRoot;
    if (!root) return;
    const version = root.querySelector?.(".header-title span");
    if (version) version.textContent = `UI v${UI159}`;
    if (root.querySelector?.("style[data-nikas-ui159]")) return;
    const style = document.createElement("style");
    style.dataset.nikasUi159 = "1";
    style.textContent = `
      .connection-indicator.local.freshness-unknown .connection-lamp{
        background:var(--disabled-text-color,var(--secondary-text-color))!important;
      }
      .connection-indicator.local.freshness-unknown strong{
        color:var(--secondary-text-color)!important;
      }
      .peer-lamp.nodata{
        background:var(--disabled-text-color,var(--secondary-text-color))!important;
        box-shadow:0 0 0 3px color-mix(in srgb,var(--disabled-text-color,var(--secondary-text-color)) 22%,transparent)!important;
      }
    `;
    root.appendChild(style);
  };

  Panel.prototype.__updatePeerConnectionTones159 = function() {
    const root = this.shadowRoot;
    if (!root || !this._hass) return;
    root.querySelectorAll?.(".peer[data-room]").forEach((peer) => {
      const room = PEERS159.find((candidate) => candidate.key === peer.dataset.room);
      const lamp = peer.querySelector?.(".peer-lamp");
      if (!room || !lamp) return;
      const model = this.roomModel(room);
      const connection = this.connection(model);
      const tone = this.peerConnectionTone159(model);
      lamp.classList.remove("ok", "warn", "bad", "nodata");
      lamp.classList.add(tone);
      peer.title = `Связь: ${connection.label}. Актуальность: ${connection.fresh}.`;
    });
  };

  Panel.prototype.render = function(...args) {
    const result = previousRender.apply(this, args);
    this.__installUi159();
    this.__updatePeerConnectionTones159();
    return result;
  };

  Panel.prototype.patch = function(...args) {
    const result = previousPatch.apply(this, args);
    this.__installUi159();
    this.__updatePeerConnectionTones159();
    return result;
  };

  Panel.prototype.__ui159 = true;
}
