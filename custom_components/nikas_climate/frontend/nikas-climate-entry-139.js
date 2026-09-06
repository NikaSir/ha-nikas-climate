import "./nikas-climate-entry-138.js?v=1.3.8";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.3.9";
const AC_DATA_URL = "/nikas_climate_panel/assets/ballu-lagoon-real-data.txt";
let acDataPromise = null;

const loadAcData = () => {
  if (!acDataPromise) {
    acDataPromise = fetch(`${AC_DATA_URL}?v=${PATCH_UI_VERSION}`, {cache:"no-store"})
      .then((r) => {
        if (!r.ok) throw new Error(`AC asset ${r.status}`);
        return r.text();
      })
      .then((text) => text.trim())
      .catch(() => null);
  }
  return acDataPromise;
};

if (Panel && !Panel.prototype.__nikasUi139Patched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;

  Panel.prototype.__fixNikasUi139 = function () {
    const root = this.shadowRoot;
    if (!root) return;

    const imgs = [...root.querySelectorAll("img.u136-ac-photo")];
    if (imgs.length) {
      loadAcData().then((src) => {
        if (!src || !this.shadowRoot) return;
        this.shadowRoot.querySelectorAll("img.u136-ac-photo").forEach((img) => {
          if (img.getAttribute("src") !== src) img.setAttribute("src", src);
        });
      });
    }

    if (!root.querySelector("style[data-nikas-ui139]")) {
      const style = document.createElement("style");
      style.dataset.nikasUi139 = "1";
      style.textContent = `
        /* 1.3.9 — approved geometry + real Ballu photo + visible Apply. */
        .u136-ac-photo{object-fit:contain!important;object-position:center!important;background:transparent!important;}

        .u136-summary{justify-content:flex-start!important;gap:8px!important;}
        .u136-summary-top{min-height:154px!important;height:154px!important;grid-template-columns:minmax(0,1fr) 154px!important;gap:10px!important;}
        .u136-summary-top .u136-ac-photo{height:150px!important;width:100%!important;}
        .u136-summary .connection-indicator{width:154px!important;min-width:154px!important;max-width:154px!important;}
        .u136-metrics{gap:7px!important;}
        .u136-metric{height:100px!important;min-height:100px!important;}
        .u136-modes{gap:6px!important;}
        .u136-mode{height:68px!important;min-height:68px!important;}
        .u136-extras{gap:7px!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;}
        .u136-extra{min-width:0!important;height:76px!important;min-height:76px!important;padding:7px 8px!important;overflow:hidden!important;}
        .u136-extra div{min-width:0!important;}
        .u136-extra strong,.u136-extra span{white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
        .u136-info{margin-top:2px!important;min-height:48px!important;height:48px!important;}

        .u136-control{gap:3px!important;padding:10px 14px 8px!important;}
        .u136-control-head{height:132px!important;min-height:132px!important;}
        .u136-room-id{height:26px!important;min-height:26px!important;}
        .u136-room-id .room-title{line-height:26px!important;font-size:22px!important;}
        .u136-visual-row{height:102px!important;min-height:102px!important;grid-template-columns:minmax(0,1fr) 230px!important;gap:8px!important;}
        .u136-visual-row .u136-ac-photo{height:98px!important;}
        .u136-roomtemp{height:92px!important;min-height:92px!important;padding:7px 11px!important;}
        .u136-roomtemp strong{font-size:31px!important;}
        .u136-roomtemp span{font-size:11px!important;}
        .u136-roomtemp small{font-size:9px!important;}
        .u136-set,.u136-flap{height:56px!important;min-height:56px!important;}
        .u136-grid.modes .u136-action{height:60px!important;min-height:60px!important;}
        .u136-grid.fans .u136-action{height:56px!important;min-height:56px!important;}
        .u136-feature{height:53px!important;min-height:53px!important;}
        .u136-bottom{display:block!important;margin-top:auto!important;flex:0 0 auto!important;visibility:visible!important;opacity:1!important;}
        .u136-bottom .legend{display:flex!important;margin:0 0 3px!important;min-height:18px!important;}
        .u136-bottom .apply{display:block!important;visibility:visible!important;opacity:1!important;position:static!important;width:100%!important;height:46px!important;min-height:46px!important;margin:0!important;}
      `;
      root.appendChild(style);
    }
  };

  Panel.prototype.render = function (...args) {
    const result = previousRender.apply(this, args);
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    this.__fixNikasUi139();
    return result;
  };

  Panel.prototype.patch = function (...args) {
    const result = previousPatch.apply(this, args);
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    this.__fixNikasUi139();
    return result;
  };

  Panel.prototype.__nikasUi139Patched = true;
}
