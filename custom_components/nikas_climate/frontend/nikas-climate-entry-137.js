import "./nikas-climate-entry-136.js?v=1.3.6";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.3.7";
const REAL_AC_IMAGE = "/nikas_climate_panel/assets/ballu-lagoon.svg";

if (Panel && !Panel.prototype.__nikasUi137Patched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;
  const previousSummary = Panel.prototype.summary;
  const previousControl = Panel.prototype.control;

  const repairAsset = (html) => String(html || "").replaceAll(
    "/nikas_climate_panel/assets/ballu-lagoon-approved.png",
    REAL_AC_IMAGE,
  );

  Panel.prototype.summary = function (m) {
    return repairAsset(previousSummary.call(this, m));
  };

  Panel.prototype.control = function (m) {
    if (this.__u137RoomKey !== m?.room?.key) {
      this.__u137RoomKey = m?.room?.key || null;
      this.__u137TouchedMode = false;
    }

    if (m?.climate && !this.__u137TouchedMode && m.mode === "off") {
      const d = this.draftFor(m);
      if (d && d.mode !== "off") {
        d.mode = "off";
        d.dirty = this.draftChanged(m, d);
      }
    }

    return repairAsset(previousControl.call(this, m));
  };

  Panel.prototype.__installNikasUi137 = function () {
    const root = this.shadowRoot;
    if (!root || root.querySelector("style[data-nikas-ui137]")) return;

    root.addEventListener("click", (event) => {
      if (event.composedPath().some((node) => node?.dataset?.mode)) {
        this.__u137TouchedMode = true;
      }
    }, true);

    const style = document.createElement("style");
    style.dataset.nikasUi137 = "1";
    style.textContent = `
      /* 1.3.7: fact -> approved geometry, without changing the canonical connection plaque. */
      .u136-ac-photo{
        border:0!important;
        outline:0!important;
        background:transparent!important;
        object-fit:contain!important;
        object-position:center!important;
      }

      .u136-summary{
        justify-content:flex-start!important;
        gap:8px!important;
      }
      .u136-summary-top{
        grid-template-columns:minmax(0,1fr) 150px!important;
        min-height:152px!important;
        height:152px!important;
        gap:10px!important;
      }
      .u136-summary-top .u136-ac-photo{
        width:100%!important;
        height:152px!important;
        transform:scale(1.05)!important;
        transform-origin:center!important;
      }
      .u136-summary .connection-indicator{
        margin:0!important;
        align-self:center!important;
      }
      .u136-metrics{gap:7px!important;}
      .u136-metric{
        height:98px!important;
        min-height:98px!important;
      }
      .u136-modes{gap:6px!important;}
      .u136-mode{
        min-width:0!important;
        height:70px!important;
      }
      .u136-extras{
        grid-template-columns:repeat(4,minmax(0,1fr))!important;
        gap:7px!important;
      }
      .u136-extra{
        min-width:0!important;
        height:82px!important;
        padding:8px 7px!important;
        overflow:hidden!important;
      }
      .u136-extra ha-icon{flex:0 0 auto!important;}
      .u136-extra>div{
        min-width:0!important;
        overflow:hidden!important;
      }
      .u136-extra strong,
      .u136-extra span{
        white-space:nowrap!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
      }
      .u136-info{
        margin-top:8px!important;
        min-height:44px!important;
      }

      .u136-control{
        justify-content:flex-start!important;
        gap:6px!important;
      }
      .u136-control-head{
        min-height:188px!important;
        height:188px!important;
        gap:4px!important;
      }
      .u136-room-id{
        min-height:34px!important;
        height:34px!important;
      }
      .u136-room-id .room-title{
        line-height:34px!important;
      }
      .u136-visual-row{
        height:148px!important;
        min-height:148px!important;
        grid-template-columns:minmax(0,1fr) 250px!important;
        gap:12px!important;
        align-items:center!important;
      }
      .u136-visual-row .u136-ac-photo{
        width:100%!important;
        height:144px!important;
        transform:scale(1.08)!important;
        transform-origin:center!important;
      }
      .u136-roomtemp{
        min-height:126px!important;
        height:126px!important;
        padding:10px 14px!important;
      }
      .u136-roomtemp strong{font-size:38px!important;}
      .u136-setrow{gap:10px!important;}
      .u136-set{min-height:66px!important;height:66px!important;}
      .u136-flap{min-height:66px!important;height:66px!important;}
      .u136-grid.modes{gap:7px!important;}
      .u136-grid.modes .u136-action{height:76px!important;}
      .u136-grid.fans{gap:7px!important;}
      .u136-grid.fans .u136-action{height:72px!important;}
      .u136-feature-grid{gap:9px!important;}
      .u136-feature{height:70px!important;}
      .u136-bottom{margin-top:0!important;}
      .u136-bottom .legend{margin-top:0!important;}
      .u136-bottom .apply{margin-top:6px!important;}
    `;
    root.appendChild(style);
  };

  Panel.prototype.render = function (...args) {
    const result = previousRender.apply(this, args);
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    this.__installNikasUi137();
    return result;
  };

  Panel.prototype.patch = function (...args) {
    const result = previousPatch.apply(this, args);
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    this.__installNikasUi137();
    return result;
  };

  Panel.prototype.__nikasUi137Patched = true;
}
