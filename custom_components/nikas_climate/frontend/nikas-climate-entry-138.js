import "./nikas-climate-entry-137.js?v=1.3.7";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.3.8";

if (Panel && !Panel.prototype.__nikasUi138Patched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;

  Panel.prototype.__installNikasUi138 = function () {
    const root = this.shadowRoot;
    if (!root || root.querySelector("style[data-nikas-ui138]")) return;

    const style = document.createElement("style");
    style.dataset.nikasUi138 = "1";
    style.textContent = `
      /* 1.3.8 — approved Control tab must fit between fixed header and bottom nav. */
      .content:has(.u136-control){
        height:100%!important;
        min-height:0!important;
        overflow:hidden!important;
        padding:8px 12px 6px!important;
      }
      .content:has(.u136-control)>#content{
        height:100%!important;
        min-height:0!important;
        overflow:hidden!important;
      }
      .u136-control{
        box-sizing:border-box!important;
        height:100%!important;
        min-height:0!important;
        padding:12px 14px 10px!important;
        display:flex!important;
        flex-direction:column!important;
        gap:4px!important;
        overflow:hidden!important;
      }

      /* Recover vertical budget without changing the approved composition. */
      .u136-control-head{
        height:150px!important;
        min-height:150px!important;
        gap:2px!important;
      }
      .u136-room-id{
        height:30px!important;
        min-height:30px!important;
      }
      .u136-room-id .room-title{
        line-height:30px!important;
        font-size:23px!important;
      }
      .u136-visual-row{
        height:116px!important;
        min-height:116px!important;
        grid-template-columns:minmax(0,1fr) 236px!important;
        gap:10px!important;
      }
      .u136-visual-row .u136-ac-photo{
        height:110px!important;
      }
      .u136-roomtemp{
        height:104px!important;
        min-height:104px!important;
        padding:8px 12px!important;
      }
      .u136-roomtemp strong{font-size:34px!important;}
      .u136-roomtemp span{font-size:12px!important;}
      .u136-roomtemp small{font-size:10px!important;}

      .u136-setrow{gap:8px!important;}
      .u136-set,
      .u136-flap{
        height:62px!important;
        min-height:62px!important;
      }
      .u136-title{
        margin:1px 0 0!important;
        line-height:16px!important;
      }
      .u136-grid.modes{gap:6px!important;}
      .u136-grid.modes .u136-action{
        height:68px!important;
        min-height:68px!important;
      }
      .u136-grid.fans{gap:6px!important;}
      .u136-grid.fans .u136-action{
        height:64px!important;
        min-height:64px!important;
      }
      .u136-feature-grid{gap:8px!important;}
      .u136-feature{
        height:62px!important;
        min-height:62px!important;
      }

      /* Apply is part of the card, never allowed below the viewport/nav. */
      .u136-bottom{
        margin-top:auto!important;
        flex:0 0 auto!important;
        padding-top:2px!important;
      }
      .u136-bottom .legend{
        margin:0 0 4px!important;
        min-height:18px!important;
      }
      .u136-bottom .apply{
        display:block!important;
        position:static!important;
        width:100%!important;
        height:48px!important;
        min-height:48px!important;
        margin:0!important;
        flex:0 0 48px!important;
      }
      .u136-bottom .notice{
        margin:4px 0 0!important;
      }
    `;
    root.appendChild(style);
  };

  Panel.prototype.render = function (...args) {
    const result = previousRender.apply(this, args);
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    this.__installNikasUi138();
    return result;
  };

  Panel.prototype.patch = function (...args) {
    const result = previousPatch.apply(this, args);
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    this.__installNikasUi138();
    return result;
  };

  Panel.prototype.__nikasUi138Patched = true;
}
