import "./nikas-climate-entry-138.js?v=1.3.8";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.3.9";
const AC_IMAGE_139 = "/nikas_climate_panel/assets/ballu-lagoon-real.jpeg";

if (Panel && !Panel.prototype.__nikasUi139Patched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;

  Panel.prototype.__fixNikasUi139 = function () {
    const root = this.shadowRoot;
    if (!root) return;

    root.querySelectorAll("img.u136-ac-photo").forEach((img) => {
      if (img.getAttribute("src") !== AC_IMAGE_139) img.setAttribute("src", AC_IMAGE_139);
    });

    if (!root.querySelector("style[data-nikas-ui139]")) {
      const style = document.createElement("style");
      style.dataset.nikasUi139 = "1";
      style.textContent = `
        /* 1.3.9 — restore the approved composition and keep Apply visible. */
        .u136-ac-photo{
          object-fit:contain!important;
          object-position:center!important;
          background:transparent!important;
        }

        /* Summary: use the working height instead of leaving a large blank lower field. */
        .u136-summary{
          justify-content:flex-start!important;
          gap:8px!important;
        }
        .u136-summary-top{
          min-height:154px!important;
          height:154px!important;
          grid-template-columns:minmax(0,1fr) 154px!important;
          gap:10px!important;
        }
        .u136-summary-top .u136-ac-photo{
          height:150px!important;
          width:100%!important;
        }
        .u136-summary .connection-indicator{
          width:154px!important;
          min-width:154px!important;
          max-width:154px!important;
        }
        .u136-metrics{gap:7px!important;}
        .u136-metric{height:100px!important;min-height:100px!important;}
        .u136-modes{gap:6px!important;}
        .u136-mode{height:68px!important;min-height:68px!important;}
        .u136-extras{gap:7px!important;}
        .u136-extra{
          min-width:0!important;
          height:76px!important;
          min-height:76px!important;
          padding:7px 8px!important;
          overflow:hidden!important;
        }
        .u136-extra div{min-width:0!important;}
        .u136-extra strong,
        .u136-extra span{
          white-space:nowrap!important;
          overflow:hidden!important;
          text-overflow:ellipsis!important;
        }
        .u136-info{
          margin-top:2px!important;
          min-height:48px!important;
          height:48px!important;
        }

        /* Control: reclaim enough height for the legend and Apply button. */
        .u136-control{
          gap:3px!important;
          padding:10px 14px 8px!important;
        }
        .u136-control-head{
          height:136px!important;
          min-height:136px!important;
        }
        .u136-room-id{
          height:27px!important;
          min-height:27px!important;
        }
        .u136-room-id .room-title{
          line-height:27px!important;
          font-size:22px!important;
        }
        .u136-visual-row{
          height:105px!important;
          min-height:105px!important;
          grid-template-columns:minmax(0,1fr) 230px!important;
        }
        .u136-visual-row .u136-ac-photo{height:100px!important;}
        .u136-roomtemp{
          height:95px!important;
          min-height:95px!important;
          padding:7px 11px!important;
        }
        .u136-roomtemp strong{font-size:32px!important;}
        .u136-set,.u136-flap{height:58px!important;min-height:58px!important;}
        .u136-grid.modes .u136-action{height:62px!important;min-height:62px!important;}
        .u136-grid.fans .u136-action{height:59px!important;min-height:59px!important;}
        .u136-feature{height:56px!important;min-height:56px!important;}
        .u136-bottom{
          display:block!important;
          margin-top:auto!important;
          flex:0 0 auto!important;
          visibility:visible!important;
          opacity:1!important;
        }
        .u136-bottom .legend{display:flex!important;margin:0 0 3px!important;}
        .u136-bottom .apply{
          display:block!important;
          visibility:visible!important;
          opacity:1!important;
          position:static!important;
          width:100%!important;
          height:48px!important;
          min-height:48px!important;
          margin:0!important;
        }
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
