import "./nikas-climate-panel.js?v=1.2.1";

const Panel = customElements.get("nikas-climate-panel");

if (Panel && !Panel.prototype.__nikasScrollBoundaryPatched) {
  const originalRender = Panel.prototype.render;

  Panel.prototype.render = function (...args) {
    const result = originalRender.apply(this, args);
    this.__installNikasScrollBoundary?.();
    return result;
  };

  Panel.prototype.__installNikasScrollBoundary = function () {
    const root = this.shadowRoot;
    const viewport = root?.querySelector(".viewport");
    const shell = root?.querySelector(".shell");
    if (!viewport || viewport.dataset.nikasScrollBoundary === "1") return;

    viewport.dataset.nikasScrollBoundary = "1";

    const style = document.createElement("style");
    style.textContent = `
      :host {
        position: fixed !important;
        inset: 0 !important;
        overflow: hidden !important;
        overscroll-behavior: none !important;
      }
      .shell {
        position: absolute !important;
        inset: 0 !important;
        overflow: hidden !important;
        overscroll-behavior: none !important;
        touch-action: none;
      }
      .app-header,
      .peer-selector,
      .bottom-nav {
        touch-action: manipulation;
        overscroll-behavior: none !important;
      }
      .viewport {
        min-height: 0 !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        overscroll-behavior-x: none !important;
        overscroll-behavior-y: contain !important;
        touch-action: pan-y !important;
        -webkit-overflow-scrolling: touch;
      }
      .content {
        min-height: 100%;
      }
    `;
    root.appendChild(style);

    let startY = 0;
    let startX = 0;

    viewport.addEventListener("touchstart", (event) => {
      const touch = event.touches?.[0];
      if (!touch) return;
      startY = touch.clientY;
      startX = touch.clientX;
    }, {passive: true});

    viewport.addEventListener("touchmove", (event) => {
      const touch = event.touches?.[0];
      if (!touch) return;

      const dy = touch.clientY - startY;
      const dx = touch.clientX - startX;
      if (Math.abs(dx) > Math.abs(dy)) {
        event.preventDefault();
        return;
      }

      const atTop = viewport.scrollTop <= 0;
      const atBottom = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 1;

      // NikaS Standard 2.2: the working area owns scrolling.
      // Never allow an edge gesture to chain into HA's host pull-to-refresh/bounce.
      if ((atTop && dy > 0) || (atBottom && dy < 0)) {
        event.preventDefault();
      }
    }, {passive: false});

    viewport.addEventListener("wheel", (event) => {
      const atTop = viewport.scrollTop <= 0;
      const atBottom = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 1;
      if ((atTop && event.deltaY < 0) || (atBottom && event.deltaY > 0)) {
        event.preventDefault();
      }
    }, {passive: false});

    if (shell) shell.scrollTop = 0;
  };

  Panel.prototype.__nikasScrollBoundaryPatched = true;
}
