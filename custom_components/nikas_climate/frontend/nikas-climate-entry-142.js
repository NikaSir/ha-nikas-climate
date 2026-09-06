import "./nikas-climate-entry-141.js?v=1.4.1";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.4.2";
const AC_DATA_URL = "/nikas_climate_panel/assets/ballu-lagoon-real-data.txt";
let acBlobUrl142 = null;
let acBlobPromise142 = null;

const loadAcBlob142 = () => {
  if (!acBlobPromise142) {
    acBlobPromise142 = fetch(`${AC_DATA_URL}?v=${PATCH_UI_VERSION}`, {cache:"no-store"})
      .then(r => { if (!r.ok) throw new Error(`AC asset ${r.status}`); return r.text(); })
      .then(text => {
        const src = text.trim();
        const m = src.match(/^data:([^;]+);base64,(.+)$/s);
        if (!m) throw new Error("Invalid AC data asset");
        const raw = atob(m[2].replace(/\s+/g,""));
        const bytes = new Uint8Array(raw.length);
        for (let i=0;i<raw.length;i++) bytes[i]=raw.charCodeAt(i);
        acBlobUrl142 = URL.createObjectURL(new Blob([bytes], {type:m[1]}));
        return acBlobUrl142;
      })
      .catch(() => null);
  }
  return acBlobPromise142;
};

if (Panel && !Panel.prototype.__nikasUi142Patched) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;
  const previousSummary = Panel.prototype.summary;

  Panel.prototype.summary = function(m) {
    let html = previousSummary.call(this,m);
    // Remove the unsupported Eco tile from Summary only.
    html = html.replace(/<div class="u136-extra[^>]*placeholder[^>]*>[\s\S]*?<strong>Эко<\/strong>[\s\S]*?<\/div><\/div>/, "");
    return html;
  };

  Panel.prototype.__fixNikasUi142 = function() {
    const root = this.shadowRoot;
    if (!root) return;

    // Hero image: use a Blob URL, avoiding CSP/data-URL rendering failures.
    loadAcBlob142().then(src => {
      if (!src || !this.shadowRoot) return;
      this.shadowRoot.querySelectorAll("img.u136-ac-photo").forEach(img => {
        img.src = src;
        img.alt = "";
        img.removeAttribute("title");
      });
    });

    // Bottom menu icons. Add only to the four canonical navigation buttons.
    const navMeta = new Map([
      ["Сводка","mdi:view-dashboard-outline"],
      ["Управление","mdi:tune-variant"],
      ["Статистика","mdi:chart-line"],
      ["Диагностика","mdi:stethoscope"]
    ]);
    root.querySelectorAll("button,a").forEach(el => {
      const text=(el.textContent||"").trim();
      if (!navMeta.has(text) || el.querySelector(":scope > .nikas-nav-icon")) return;
      const icon=document.createElement("ha-icon");
      icon.className="nikas-nav-icon";
      icon.setAttribute("icon",navMeta.get(text));
      el.prepend(icon);
      el.classList.add("nikas-nav-with-icon");
    });

    if (!root.querySelector("style[data-nikas-ui142]")) {
      const style=document.createElement("style");
      style.dataset.nikasUi142="1";
      style.textContent=`
        /* Approved geometry: no duplicate room title inside working card. */
        .u136-room-id{display:none!important;}
        .u136-ac-photo{object-fit:contain!important;object-position:center!important;background:transparent!important;}
        .u136-summary-top .u136-ac-photo{height:145px!important;max-height:145px!important;}
        .u136-visual-row .u136-ac-photo{height:100px!important;max-height:100px!important;}

        /* Summary: 3 extras after Eco removal, full readable labels. */
        .u136-summary .u136-extras{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;}
        .u136-summary .u136-extra{min-width:0!important;overflow:hidden!important;}
        .u136-summary .u136-extra strong,.u136-summary .u136-extra span{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;}

        /* Restore stable vertical rhythm around Additional. */
        .u136-control .u136-title + .u136-feature-grid{margin-top:7px!important;}
        .u136-feature-grid{gap:9px!important;margin-bottom:0!important;}

        /* Canonical bottom navigation: icon over label, active inherits blue. */
        .nikas-nav-with-icon{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:3px!important;}
        .nikas-nav-icon{--mdc-icon-size:20px;color:inherit!important;display:block!important;}
      `;
      root.appendChild(style);
    }
  };

  Panel.prototype.render = function(...args) {
    const result=previousRender.apply(this,args);
    const version=this.shadowRoot?.querySelector(".header-title span");
    if(version) version.textContent=`UI v${PATCH_UI_VERSION}`;
    this.__fixNikasUi142();
    return result;
  };

  Panel.prototype.patch = function(...args) {
    const result=previousPatch.apply(this,args);
    const version=this.shadowRoot?.querySelector(".header-title span");
    if(version) version.textContent=`UI v${PATCH_UI_VERSION}`;
    this.__fixNikasUi142();
    return result;
  };

  Panel.prototype.__nikasUi142Patched=true;
}
