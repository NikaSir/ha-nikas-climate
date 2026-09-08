import "./nikas-climate-entry-159.js?v=1.4.22";

const Panel = customElements.get("nikas-climate-panel");
const UI160 = "1.4.23";
const PEERS160 = [
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

if (Panel && !Panel.prototype.__ui160) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;

  Panel.prototype.connection = function(m) {
    const noData = {tone: "nodata", label: "Нет данных", fresh: "Нет данных"};
    if (!m?.climate) return noData;
    const registry = this.registryEntry(m.climate.entity_id);
    if (registry?.platform !== "syncleo") return noData;

    // Syncleo availability reports the local transport. HA values can also be
    // optimistic command writes; their presence and HA timestamps prove no RX.
    const state = m.climate.state;
    if (state === "unavailable") {
      return {tone: "offline freshness-none", label: "Нет связи", fresh: "Нет данных"};
    }
    if (!m.available || !["off", "heat", "cool", "heat_cool", "auto", "dry", "fan_only"].includes(state)) {
      return noData;
    }
    // A received-sample timestamp/generation is not exported by Syncleo yet.
    // Keep the known route, but do not invent freshness or stale-sample memory.
    return {tone: "local freshness-unknown", label: "Локально", fresh: "Нет данных"};
  };

  Panel.prototype.peerConnectionTone160 = function(m) {
    const connection = this.connection(m);
    if (connection.label === "Нет связи") return "bad";
    if (connection.label === "Локально" && connection.fresh === "Данные актуальны") return "ok";
    if (connection.label === "Локально" && connection.fresh === "Данные устарели") return "warn";
    return "nodata";
  };

  Panel.prototype.__installUi160 = function() {
    const root = this.shadowRoot;
    if (!root) return;
    const version = root.querySelector?.(".header-title span");
    if (version) version.textContent = `UI v${UI160}`;
  };

  Panel.prototype.__updatePeerConnectionTones160 = function() {
    const root = this.shadowRoot;
    if (!root || !this._hass) return;
    root.querySelectorAll?.(".peer[data-room]").forEach((peer) => {
      const room = PEERS160.find((candidate) => candidate.key === peer.dataset.room);
      const lamp = peer.querySelector?.(".peer-lamp");
      if (!room || !lamp) return;
      const model = this.roomModel(room);
      const connection = this.connection(model);
      const tone = this.peerConnectionTone160(model);
      lamp.classList.remove("ok", "warn", "bad", "nodata");
      lamp.classList.add(tone);
      peer.title = `Канал: ${connection.label}. Актуальность: ${connection.fresh}.`;
    });
  };

  Panel.prototype.render = function(...args) {
    const result = previousRender.apply(this, args);
    this.__installUi160();
    this.__updatePeerConnectionTones160();
    return result;
  };

  Panel.prototype.patch = function(...args) {
    const result = previousPatch.apply(this, args);
    this.__installUi160();
    this.__updatePeerConnectionTones160();
    return result;
  };

  Panel.prototype.__ui160 = true;
}
