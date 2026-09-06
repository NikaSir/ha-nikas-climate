import "./nikas-climate-entry-140.js?v=1.4.0";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.4.1";
const AC_DATA_URL = "/nikas_climate_panel/assets/ballu-lagoon-real-data.txt";
let acDataPromise141 = null;

const loadAcData141 = () => {
  if (!acDataPromise141) {
    acDataPromise141 = fetch(`${AC_DATA_URL}?v=${PATCH_UI_VERSION}`, {cache:"no-store"})
      .then((r) => {
        if (!r.ok) throw new Error(`AC asset ${r.status}`);
        return r.text();
      })
      .then((text) => text.trim())
      .catch(() => null);
  }
  return acDataPromise141;
};

if (Panel && !Panel.prototype.__nikasUi141Patched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;

  Panel.prototype.__applyStateHero140 = function() {
    const root = this.shadowRoot;
    if (!root) return;

    const model = this.__activeModel140?.();
    const mode = model?.available ? (model?.mode || "off") : "unavailable";

    root.querySelectorAll(".u140-state-badge").forEach((el) => el.remove());

    root.querySelectorAll("img.u136-ac-photo").forEach((img) => {
      img.dataset.mode = mode;
      img.alt = "";
      img.removeAttribute("title");
    });

    loadAcData141().then((src) => {
      if (!src || !this.shadowRoot) return;
      this.shadowRoot.querySelectorAll("img.u136-ac-photo").forEach((img) => {
        if (img.getAttribute("src") !== src) img.setAttribute("src", src);
        img.alt = "";
      });
    });
  };

  Panel.prototype.__fixNikasUi141 = function() {
    const root = this.shadowRoot;
    if (!root) return;

    root.querySelectorAll(".u140-state-badge").forEach((el) => el.remove());

    if (!root.querySelector("style[data-nikas-ui141]")) {
      const style = document.createElement("style");
      style.dataset.nikasUi141 = "1";
      style.textContent = `
        /* 1.4.1 — restore approved hero geometry and remove duplicated room title. */
        .u136-room-id{display:none!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;}
        .u136-control-head{height:104px!important;min-height:104px!important;}
        .u136-visual-row{height:104px!important;min-height:104px!important;}
        .u136-visual-row .u136-ac-photo{height:100px!important;}
        .u136-ac-photo{font-size:0!important;color:transparent!important;}

        .u136-control .u136-title + .u136-feature-grid{margin-top:5px!important;}
        .u136-feature-grid{gap:8px!important;}
        .u136-feature{height:54px!important;min-height:54px!important;}

        .u136-ac-photo[data-mode="off"]{filter:grayscale(.30) saturate(.76) brightness(.99)!important;opacity:.96!important;}
        .u136-ac-photo[data-mode="cool"]{filter:saturate(1.08) drop-shadow(0 10px 16px rgba(0,169,214,.26))!important;opacity:1!important;}
        .u136-ac-photo[data-mode="heat"]{filter:sepia(.10) saturate(1.12) drop-shadow(0 10px 16px rgba(230,143,44,.22))!important;opacity:1!important;}
        .u136-ac-photo[data-mode="auto"]{filter:saturate(1.04) drop-shadow(0 10px 16px rgba(62,170,102,.20))!important;opacity:1!important;}
        .u136-ac-photo[data-mode="dry"]{filter:saturate(1.02) drop-shadow(0 10px 16px rgba(0,160,176,.20))!important;opacity:1!important;}
        .u136-ac-photo[data-mode="fan_only"]{filter:saturate(.92) drop-shadow(0 9px 14px rgba(104,121,132,.16))!important;opacity:1!important;}
        .u136-ac-photo[data-mode="unavailable"]{filter:grayscale(1) saturate(.12) contrast(.88)!important;opacity:.52!important;}
      `;
      root.appendChild(style);
    }

    this.__applyStateHero140?.();
  };

  Panel.prototype.render = function (...args) {
    const result = previousRender.apply(this, args);
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    this.__fixNikasUi141();
    return result;
  };

  Panel.prototype.patch = function (...args) {
    const result = previousPatch.apply(this, args);
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    this.__fixNikasUi141();
    return result;
  };

  Panel.prototype.__nikasUi141Patched = true;
}
