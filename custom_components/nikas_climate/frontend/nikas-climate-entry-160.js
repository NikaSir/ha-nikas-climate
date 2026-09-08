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

const finite160 = (value) => value !== null && value !== "" && Number.isFinite(Number(value));
const known160 = (value) => value !== null && value !== undefined && !["", "—", "unknown", "unavailable"].includes(String(value));

if (Panel && !Panel.prototype.__ui160) {
  const previousConnection = Panel.prototype.connection;
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;

  Panel.prototype.__hasSyncleoSnapshot160 = function(m) {
    const attributes = m?.climate?.attributes || {};
    const evidence = [
      finite160(attributes.current_temperature),
      finite160(attributes.temperature),
      known160(attributes.fan_mode),
    ];
    return evidence.filter(Boolean).length >= 2;
  };

  Panel.prototype.connection = function(m) {
    const base = previousConnection.call(this, m);
    if (!m?.climate) return base;
    const registry = this.registryEntry(m.climate.entity_id);
    if (registry?.platform !== "syncleo") return base;

    this.__syncleoSnapshots160 ||= new Set();
    const entityId = m.climate.entity_id;
    const hasSnapshot = this.__hasSyncleoSnapshot160(m);
    if (hasSnapshot) this.__syncleoSnapshots160.add(entityId);
    const hadSnapshot = this.__syncleoSnapshots160.has(entityId);

    if (!m.available) {
      return {
        tone: hadSnapshot ? "offline freshness-stale" : "offline freshness-none",
        label: "Нет связи",
        fresh: hadSnapshot ? "Данные устарели" : "Нет данных",
      };
    }
    if (hasSnapshot) {
      return {tone: "local freshness-confirmed", label: "Локально", fresh: "Состояние получено"};
    }
    return {tone: "local freshness-pending", label: "Локально", fresh: "Ожидание данных"};
  };

  Panel.prototype.peerConnectionTone160 = function(m) {
    const connection = this.connection(m);
    if (connection.label === "Нет связи") return "bad";
    if (connection.label === "Локально" && connection.fresh === "Состояние получено") return "ok";
    return "nodata";
  };

  Panel.prototype.__installUi160 = function() {
    const root = this.shadowRoot;
    if (!root) return;
    const version = root.querySelector?.(".header-title span");
    if (version) version.textContent = `UI v${UI160}`;
    if (root.querySelector?.("style[data-nikas-ui160]") || typeof document === "undefined") return;
    const style = document.createElement("style");
    style.dataset.nikasUi160 = "1";
    style.textContent = `
      .u154-head{
        grid-template-columns:minmax(0,1fr) minmax(168px,42%)!important;
      }
      .u154-connection .connection-indicator{
        min-height:58px!important;
        padding:12px 14px!important;
        border-radius:18px!important;
        column-gap:9px!important;
      }
      .connection-indicator.local.freshness-pending{
        background:color-mix(in srgb,var(--success-color,#43a047) 11%,var(--card-background-color))!important;
        border-color:color-mix(in srgb,var(--success-color,#43a047) 30%,var(--divider-color))!important;
      }
      .connection-indicator.local.freshness-pending .connection-lamp{
        background:var(--success-color,#43a047)!important;
      }
      .connection-indicator.local.freshness-pending strong{
        color:var(--success-color,#43a047)!important;
      }
      .connection-indicator.freshness-stale small{
        color:var(--warning-color,#f6a623)!important;
        font-weight:600!important;
      }
      @media(max-width:520px){
        .u154-head{
          grid-template-columns:minmax(0,1fr) minmax(168px,44%)!important;
        }
      }
      @media(max-width:360px){
        .u154-head{
          grid-template-columns:minmax(0,1fr) minmax(160px,48%)!important;
          gap:8px!important;
        }
        .u154-connection .connection-indicator{
          padding-inline:11px!important;
        }
      }
    `;
    root.appendChild(style);
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
      peer.title = `Канал: ${connection.label}. Данные: ${connection.fresh}.`;
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
